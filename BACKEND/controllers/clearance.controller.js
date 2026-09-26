const ClearanceStep = require('../models/ClearanceStep');
const StepActionLog = require('../models/StepActionLog');
const NoDuesRequest = require('../models/NoDuesRequest');
const User = require('../models/User');
const { DEPARTMENT_ACCESS_CODES } = require('../config/permissionCodes');
const { unlockDependents, relockDependents, syncRequestStatus } = require('../services/dependencyEngine');

// ── What each department may see of a student ─────────────────────────────────
// Every department sees the common identity fields + ID card. The extra profile
// fields and documents below are only sent to the departments listed.
const COMMON_PROFILE_FIELDS = ['name', 'rollNo', 'email', 'branch', 'graduation', 'phone'];

const LIBRARY_FIELDS = { fields: ['libraryEmailDate'], files: ['btpReportFile'] };
const DEPT_PROFILE_ACCESS = {
    placement: {
        fields: ['placementStatus', 'tpcEmailDate', 'placementDetailsText'],
        files: ['offerLetterFile', 'placementDeclarationFile', 'admissionLetterFile', 'examScorecardFile'],
    },
    library_staff: LIBRARY_FIELDS,
    library_librarian: LIBRARY_FIELDS,
    accounts: {
        fields: ['accountHolderName', 'bankAccountNumber', 'bankName', 'bankBranch', 'bankCity', 'ifscCode',
            'donationAmount', 'studentContactNumber', 'fatherName', 'fatherMobileNumber',
            'correspondenceAddress', 'declarationAccepted'],
        files: ['cancelledChequeFile'],
    },
    store: { fields: ['clubRoleType', 'clubRoleDetail', 'festRoleDetail'], files: [] },
    warden: { fields: ['hostel'], files: [] },
};

const COMMON_FILES = ['idCardFile'];

const deptAccess = (unitCode) => DEPT_PROFILE_ACCESS[unitCode] || { fields: [], files: [] };
const allowedFilesFor = (unitCode) => [...COMMON_FILES, ...deptAccess(unitCode).files];

// Request fields shown in department lists; hostel only where the UI needs it
const LIST_REQUEST_FIELDS = 'studentName rollNo studentEmail branch status submittedAt';
const listRequestFields = (unitCode) =>
    ['warden', 'store', 'accounts'].includes(unitCode) ? `${LIST_REQUEST_FIELDS} hostel` : LIST_REQUEST_FIELDS;

// Replace raw Cloudinary proof URLs in logs with a count; files are served via the proof proxy
const safeLog = (log) => {
    const { proofUrls, ...rest } = log;
    return { ...rest, proofCount: (proofUrls || []).length };
};

// ── GET Pending / Approved / Rejected ──────────────────────────────────────────

/**
 * Returns steps for a given unitCode filtered by status.
 * Requires `req.hasPermissionFor(unitCode)` via `attachPermissionChecker` middleware.
 */
async function getStepsByStatus(req, res, status) {
    try {
        const { unitCode } = req.query;
        if (!unitCode || typeof unitCode !== 'string') return res.status(400).json({ error: 'unitCode query param is required' });

        if (!req.hasPermissionFor(unitCode)) {
            return res.status(403).json({ error: `Not authorized for unitCode: ${unitCode}` });
        }

        // Populate request details so frontend can show student name, roll, etc.
        const steps = await ClearanceStep.find({ unitCode, status })
            .select('-studentProofUrls')
            .populate('requestId', listRequestFields(unitCode))
            .sort({ updatedAt: -1 });

        // For 'pending' steps: enforce prerequisite check.
        // Only show a step as pending if ALL its dependsOn prerequisites are approved.
        // This guards against race conditions where downstream steps linger in 'pending'
        // after an upstream step was rejected or reset.
        let filteredSteps = steps;
        if (status === 'pending') {
            // Extract valid (non-null) requestIds — populated steps have requestId as an object
            const rawIds = steps
                .map(s => s.requestId?._id || s.requestId)
                .filter(id => id != null); // guard against null requestId refs
            const requestIds = [...new Set(rawIds.map(id => String(id)))];

            if (requestIds.length > 0) {
                // Fetch all sibling steps for the affected requests
                const siblingSteps = await ClearanceStep.find({ requestId: { $in: requestIds } });
                // Build map: requestId -> { unitCode -> status }
                const statusByRequest = {};
                for (const sibling of siblingSteps) {
                    const rid = String(sibling.requestId);
                    if (!statusByRequest[rid]) statusByRequest[rid] = {};
                    statusByRequest[rid][sibling.unitCode] = sibling.status;
                }
                filteredSteps = steps.filter(step => {
                    if (step.dependsOn.length === 0) return true; // no deps - always show
                    const rawId = step.requestId?._id || step.requestId;
                    if (!rawId) return true; // can't validate, show it (safe fallback)
                    const rid = String(rawId);
                    const sMap = statusByRequest[rid] || {};
                    return step.dependsOn.every(dep => sMap[dep] === 'approved');
                });
            }
        }

        // Library staff's "Sent" tab shows what the Librarian did with each forwarded request
        if (unitCode === 'library_staff' && filteredSteps.length > 0) {
            const ids = filteredSteps.map(s => s.requestId?._id || s.requestId).filter(Boolean);
            const librarianSteps = await ClearanceStep.find(
                { requestId: { $in: ids }, unitCode: 'library_librarian' },
                'requestId status rejectionReason'
            ).lean();
            const byRequest = Object.fromEntries(librarianSteps.map(l => [String(l.requestId), l]));
            filteredSteps = filteredSteps.map(s => {
                const lib = byRequest[String(s.requestId?._id || s.requestId)];
                return { ...s.toObject(), librarianStatus: lib?.status || null, librarianReason: lib?.rejectionReason || '' };
            });
        }

        res.json({ steps: filteredSteps });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getPending(req, res) { return getStepsByStatus(req, res, 'pending'); }
async function getApproved(req, res) { return getStepsByStatus(req, res, 'approved'); }
async function getRejected(req, res) { return getStepsByStatus(req, res, 'rejected'); }

// ── Approve & Reject ──────────────────────────────────────────────────────────

// Labels of this step's prerequisites that are not approved yet (a held step can be
// moved to approved only once everything it waits on is approved).
async function unmetPrerequisites(step) {
    if (!step.dependsOn || step.dependsOn.length === 0) return [];
    const siblings = await ClearanceStep.find({ requestId: step.requestId });
    return siblings
        .filter(s => step.dependsOn.includes(s.unitCode) && s.status !== 'approved')
        .map(s => s.unitLabel || s.unitCode);
}

async function approveStep(req, res) {
    try {
        const { stepId } = req.params;
        const step = await ClearanceStep.findById(stepId);
        if (!step) return res.status(404).json({ error: 'Step not found' });

        if (!req.hasPermissionFor(step.unitCode)) {
            return res.status(403).json({ error: 'Not authorized for this step' });
        }
        if (step.status !== 'pending' && step.status !== 'rejected') {
            return res.status(400).json({ error: `Cannot approve step in '${step.status}' state` });
        }
        const waitingOn = await unmetPrerequisites(step);
        if (waitingOn.length > 0) {
            return res.status(400).json({ error: `Cannot approve yet — still waiting on: ${waitingOn.join(', ')}` });
        }

        // Update step
        step.status = 'approved';
        step.actionBy = req.user.email;
        step.actionAt = new Date();
        step.restartFrom = []; // a hold's reset choice no longer applies once approved
        await step.save();

        // Log action
        await StepActionLog.create({
            stepId: step._id,
            requestId: step.requestId,
            action: 'approved',
            actorEmail: req.user.email,
            actorRole: req.user.role,
        });

        // Run dependency engine: unlock downstream steps + sync request status
        const unlockedCodes = await unlockDependents(step.requestId);

        res.json({ message: 'Step approved', unlockedCodes, step: { _id: step._id, unitCode: step.unitCode, status: step.status } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function rejectStep(req, res) {
    try {
        const { stepId } = req.params;
        const { reason, description, restartFrom } = req.body;

        if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });
        if (!description || !description.trim()) return res.status(400).json({ error: 'Rejection description is required' });

        // Fetch step first so we can check unitCode
        const step = await ClearanceStep.findById(stepId);
        if (!step) return res.status(404).json({ error: 'Step not found' });

        if (!req.hasPermissionFor(step.unitCode)) {
            return res.status(403).json({ error: 'Not authorized for this step' });
        }
        if (step.status === 'locked' || step.status === 'rejected') {
            return res.status(400).json({ error: `Cannot reject step in '${step.status}' state` });
        }

        // A completed application (every department approved) is final
        const siblings = await ClearanceStep.find({ requestId: step.requestId });
        if (siblings.length > 0 && siblings.every(s => s.status === 'approved')) {
            return res.status(400).json({ error: 'This application is already completed by all departments and can no longer be put on hold.' });
        }

        // Only departments this step (directly or indirectly) waits on, and that are part of this
        // student's request, can be reset — resetting a later department would deadlock the chain.
        const depsByCode = Object.fromEntries(siblings.map(s => [s.unitCode, s.dependsOn || []]));
        const upstream = new Set();
        const stack = [...(depsByCode[step.unitCode] || step.dependsOn || [])];
        while (stack.length) {
            const code = stack.pop();
            if (upstream.has(code) || !(code in depsByCode)) continue;
            upstream.add(code);
            stack.push(...depsByCode[code]);
        }
        const validRestart = Array.isArray(restartFrom)
            ? [...new Set(restartFrom)].filter(code => upstream.has(code))
            : [];

        // Departments that MUST select at least one upstream dependency to reset.
        // HOD, Store, and Accounts all have optional dep selection — handled on frontend.
        // NAD still enforces mandatory dep selection.
        const DEPENDENT_UNITS = ['nad'];
        if (DEPENDENT_UNITS.includes(step.unitCode) && validRestart.length === 0) {
            return res.status(400).json({ error: 'Please select at least one dependent department to reset on reapply' });
        }

        step.status = 'rejected';
        step.actionBy = req.user.email;
        step.actionAt = new Date();
        step.rejectedAt = new Date();
        step.rejectionReason = reason;
        step.rejectionDescription = description.trim();
        step.restartFrom = validRestart;
        await step.save();

        await StepActionLog.create({
            stepId: step._id,
            requestId: step.requestId,
            action: 'rejected',
            actorEmail: req.user.email,
            actorRole: 'staff',
            note: `[${reason}] ${description.trim()}`,
        });

        await syncRequestStatus(step.requestId);

        // Re-lock any downstream steps whose prerequisites are now invalidated.
        // Wrapped in try-catch — non-fatal: the core reject is already committed.
        try {
            await relockDependents(step.requestId);
        } catch (relockErr) {
            console.error('[rejectStep] relockDependents failed (non-fatal):', relockErr.message);
        }

        res.json({ message: 'Step rejected', step: { _id: step._id, unitCode: step.unitCode, status: step.status } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function bulkApprove(req, res) {
    try {
        const { stepIds } = req.body;
        if (!Array.isArray(stepIds) || stepIds.length === 0) {
            return res.status(400).json({ error: 'stepIds array is required' });
        }

        const steps = await ClearanceStep.find({ _id: { $in: stepIds } });
        const approvedSteps = [];
        const requestIds = new Set(); // to run dependency engine later

        for (const step of steps) {
            if (!req.hasPermissionFor(step.unitCode)) continue;
            if (step.status !== 'pending' && step.status !== 'rejected') continue;
            if ((await unmetPrerequisites(step)).length > 0) continue;

            step.status = 'approved';
            step.actionBy = req.user.email;
            step.actionAt = new Date();
            step.restartFrom = [];
            await step.save();

            await StepActionLog.create({
                stepId: step._id,
                requestId: step.requestId,
                action: 'approved',
                actorEmail: req.user.email,
                actorRole: 'staff',
            });

            approvedSteps.push(step._id);
            requestIds.add(step.requestId.toString());
        }

        // Run dependency engine for all affected requests
        for (const rid of requestIds) {
            await unlockDependents(rid);
        }

        res.json({ message: `Bulk approved ${approvedSteps.length} steps`, approvedSteps });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// ── GET Step Details (History) ───────────────────────────────────────────────

async function getStepDetails(req, res) {
    try {
        const { stepId } = req.params;
        const step = await ClearanceStep.findById(stepId)
            .select('-studentProofUrls')
            .populate('requestId', LIST_REQUEST_FIELDS);
        if (!step) return res.status(404).json({ error: 'Step not found' });

        if (!req.hasPermissionFor(step.unitCode)) {
            return res.status(403).json({ error: 'Not authorized for this step' });
        }

        // Fetch full history tail
        const history = await StepActionLog.find({ stepId }).sort({ timestamp: 1 }).lean();

        res.json({ step, history: history.map(safeLog) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// ── GET Step Full Details (for View Details modal) ────────────────────────────

/**
 * GET /api/clearance/:stepId/full
 * Returns:
 *  - The current step (with hold info) and its event log (timeline/history)
 *  - All sibling steps for the same request (for prerequisite display)
 *  - The student's profile: common identity fields for every department, plus
 *    only the fields/documents this step's department needs (DEPT_PROFILE_ACCESS)
 *  - Document hasXxx booleans (NOT the raw URLs — frontend uses the file proxy)
 */
async function getStepFull(req, res) {
    try {
        const { stepId } = req.params;
        const EligibleStudent = require('../models/EligibleStudent');

        const step = await ClearanceStep.findById(stepId)
            .select('-studentProofUrls')
            .populate('requestId', 'studentName studentEmail rollNo branch status submittedAt');
        if (!step) return res.status(404).json({ error: 'Step not found' });

        if (!req.hasPermissionFor(step.unitCode)) {
            return res.status(403).json({ error: 'Not authorized for this step' });
        }

        const request = step.requestId;
        const access = deptAccess(step.unitCode);
        const allowedFiles = allowedFilesFor(step.unitCode);

        // All sibling steps for prerequisite panel
        const allSteps = await ClearanceStep.find({ requestId: request._id })
            .select('unitCode unitLabel unitGroup status rejectionReason rejectionDescription actionAt')
            .lean();

        const fileDbFields = allowedFiles.map(f => FILE_FIELD_MAP[f]);
        const profile = await EligibleStudent.findOne({ email: request.studentEmail })
            .select([...COMMON_PROFILE_FIELDS, ...access.fields, ...fileDbFields])
            .lean();

        // Only this department's fields; documents as presence flags (never raw URLs)
        let safeProfile = null;
        if (profile) {
            safeProfile = {};
            for (const f of [...COMMON_PROFILE_FIELDS, ...access.fields]) safeProfile[f] = profile[f];
            safeProfile.documents = Object.fromEntries(
                allowedFiles.map(f => [f, Boolean(profile[FILE_FIELD_MAP[f]])])
            );
        }

        // All action logs for this specific step — timeline, hold history, reapply history
        const stepLogs = await StepActionLog.find({ stepId: step._id })
            .sort({ timestamp: 1 })
            .lean();

        res.json({
            step,
            allSteps,
            stepLogs: stepLogs.map(safeLog),
            profile: safeProfile,
            requestInfo: {
                _id: request._id,
                studentEmail: request.studentEmail,
                studentName: request.studentName,
                rollNo: request.rollNo,
                branch: request.branch,
                status: request.status,
                submittedAt: request.submittedAt,
            },
        });
    } catch (err) {
        console.error('getStepFull error:', err);
        res.status(500).json({ error: err.message });
    }
}

// ── Department Staff Access Management ────────────────────────────────────────

const isAdmin = (req) => Array.isArray(req.user.permissionCodes) && req.user.permissionCodes.includes('admin');

/**
 * Validates that :unitCode is a department whose access can be managed and that
 * the caller belongs to it (or is admin). Sends the error response and returns
 * false if not.
 */
function checkManageableUnit(req, res, unitCode) {
    if (!DEPARTMENT_ACCESS_CODES.includes(unitCode)) {
        res.status(400).json({ error: `Unknown department: ${unitCode}` });
        return false;
    }
    if (!req.hasPermissionFor(unitCode)) {
        res.status(403).json({ error: `Not authorized for department: ${unitCode}` });
        return false;
    }
    return true;
}

async function getDepartmentAccess(req, res) {
    try {
        const { unitCode } = req.params;
        if (!checkManageableUnit(req, res, unitCode)) return;

        // Find users who have this specific unitCode in their permissionCodes
        const users = await User.find({ permissionCodes: unitCode }).sort({ createdAt: -1 });
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function addDepartmentAccess(req, res) {
    try {
        const { unitCode } = req.params;
        if (!checkManageableUnit(req, res, unitCode)) return;

        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: 'name and email are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
            if (!user.permissionCodes.includes(unitCode)) {
                user.permissionCodes.push(unitCode);
                await user.save();
            }
            return res.json({ message: 'Permission added to existing user', user });
        }

        // Create new staff user
        user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            permissionCodes: [unitCode],
        });

        res.status(201).json({ message: 'Staff access added', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function editDepartmentAccess(req, res) {
    try {
        const { unitCode, userId } = req.params;
        if (!checkManageableUnit(req, res, unitCode)) return;

        const { name, email } = req.body;
        if (!name || !email) {
            return res.status(400).json({ error: 'name and email are required' });
        }

        const user = await User.findById(userId);
        if (!user || !user.permissionCodes.includes(unitCode)) {
            return res.status(404).json({ error: 'User not found in this department' });
        }

        // A user who also has access elsewhere (another department, admin, student)
        // can only be renamed/re-emailed by an admin — otherwise one department
        // could take over another department's or the admin's login.
        const hasOtherAccess = user.permissionCodes.some(c => c !== unitCode);
        if (hasOtherAccess && !isAdmin(req)) {
            return res.status(403).json({ error: 'This user also has access to other sections. Only an admin can change their name or email.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingEmailUser = await User.findOne({ email: normalizedEmail });

        if (existingEmailUser && existingEmailUser.id !== userId) {
            return res.status(409).json({ error: 'Email already exists. Please use a different email or merge permissions.' });
        }

        user.name = name.trim();
        user.email = normalizedEmail;
        await user.save();

        res.json({ message: 'Department access updated', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function removeDepartmentAccess(req, res) {
    try {
        const { unitCode, userId } = req.params;
        if (!checkManageableUnit(req, res, unitCode)) return;

        const user = await User.findById(userId);
        if (!user || !user.permissionCodes.includes(unitCode)) {
            return res.status(404).json({ error: 'User not found in this department' });
        }

        // Remove just this unitCode from the user's permissions
        user.permissionCodes = user.permissionCodes.filter(c => c !== unitCode);

        if (user.permissionCodes.length === 0) {
            // If they have no permissions left, we can delete them
            await User.findByIdAndDelete(userId);
            res.json({ message: 'User record deleted as they have no remaining permissions' });
        } else {
            await user.save();
            res.json({ message: 'Permission removed from user', user });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// ── Department File Proxy (for View Details modal) ────────────────────────────

const FILE_FIELD_MAP = {
    idCardFile: 'idCardFileUrl',
    btpReportFile: 'btpReportFileUrl',
    offerLetterFile: 'offerLetterFileUrl',
    placementDeclarationFile: 'placementDeclarationFileUrl',
    admissionLetterFile: 'admissionLetterFileUrl',
    examScorecardFile: 'examScorecardFileUrl',
    cancelledChequeFile: 'cancelledChequeFileUrl',
};

async function fetchFollowingRedirects(url, depth = 0) {
    if (depth > 5) throw new Error('Too many redirects');
    const https = require('https');
    const http = require('http');
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    return new Promise((resolve, reject) => {
        client.get(url, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                resolve(fetchFollowingRedirects(res.headers.location, depth + 1));
            } else {
                resolve(res);
            }
        }).on('error', reject);
    });
}

/** Streams a Cloudinary file to the client (inline, no caching). */
async function streamCloudinaryFile(fileUrl, res) {
    // Cloudinary URL fixes
    if (fileUrl.includes('/image/upload/') && fileUrl.toLowerCase().endsWith('.pdf')) {
        fileUrl = fileUrl.replace('/image/upload/', '/raw/upload/');
    }
    fileUrl = fileUrl.replace(/\/fl_attachment/g, '');

    const proxyRes = await fetchFollowingRedirects(fileUrl);

    let contentType = proxyRes.headers['content-type'] || 'application/octet-stream';
    if (fileUrl.toLowerCase().endsWith('.pdf') || contentType === 'application/octet-stream') {
        contentType = 'application/pdf';
    }

    if (contentType.startsWith('text/html')) {
        return res.status(502).json({ error: 'File could not be retrieved from storage.' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    proxyRes.pipe(res);
}

/**
 * GET /api/clearance/:stepId/file/:fieldName
 * Allows department officers to view student documents inside the View Details modal.
 * Gated by stepId permission, and each department may only open its own documents
 * (ID card for everyone, see DEPT_PROFILE_ACCESS for the rest).
 */
async function getStepFile(req, res) {
    try {
        const { stepId, fieldName } = req.params;
        const EligibleStudent = require('../models/EligibleStudent');

        const dbField = FILE_FIELD_MAP[fieldName];
        if (!dbField) return res.status(400).json({ error: 'Invalid file field' });

        const step = await ClearanceStep.findById(stepId).populate('requestId', 'studentEmail');
        if (!step) return res.status(404).json({ error: 'Step not found' });

        if (!req.hasPermissionFor(step.unitCode)) {
            return res.status(403).json({ error: 'Not authorized for this step' });
        }
        if (!allowedFilesFor(step.unitCode).includes(fieldName)) {
            return res.status(403).json({ error: 'This document is not available to your department' });
        }

        const studentEmail = step.requestId?.studentEmail;
        if (!studentEmail) return res.status(404).json({ error: 'Student not found' });

        const student = await EligibleStudent.findOne({ email: studentEmail });
        if (!student) return res.status(404).json({ error: 'Student profile not found' });

        const fileUrl = student[dbField];
        if (!fileUrl) return res.status(404).json({ error: 'File not uploaded yet' });

        await streamCloudinaryFile(fileUrl, res);
    } catch (err) {
        console.error('getStepFile error:', err);
        res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/clearance/:stepId/logs/:logId/proof/:index
 * Streams a proof file attached to one of this step's timeline entries
 * (e.g. an older reapply), so raw storage URLs never reach the browser.
 */
async function getLogProof(req, res) {
    try {
        const { stepId, logId } = req.params;
        const index = parseInt(req.params.index, 10) || 0;

        const step = await ClearanceStep.findById(stepId).select('unitCode');
        if (!step) return res.status(404).json({ error: 'Step not found' });
        if (!req.hasPermissionFor(step.unitCode)) {
            return res.status(403).json({ error: 'Not authorized for this step' });
        }

        const log = await StepActionLog.findOne({ _id: logId, stepId: step._id }).lean();
        const fileUrl = log?.proofUrls?.[index];
        if (!fileUrl) return res.status(404).json({ error: 'Proof file not found' });

        await streamCloudinaryFile(fileUrl, res);
    } catch (err) {
        console.error('getLogProof error:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getPending, getApproved, getRejected,
    approveStep, rejectStep, bulkApprove,
    getStepDetails, getStepFull, getStepFile, getLogProof,
    getDepartmentAccess, addDepartmentAccess, editDepartmentAccess, removeDepartmentAccess,
};
