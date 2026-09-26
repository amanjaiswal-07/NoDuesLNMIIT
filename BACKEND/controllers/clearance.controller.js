const ClearanceStep = require('../models/ClearanceStep');
const StepActionLog = require('../models/StepActionLog');
const NoDuesRequest = require('../models/NoDuesRequest');
const User = require('../models/User');
const { DEPARTMENT_ACCESS_CODES } = require('../config/permissionCodes');
const { unlockDependents, relockDependents, syncRequestStatus } = require('../services/dependencyEngine');

// ── GET Pending / Approved / Rejected ──────────────────────────────────────────

/**
 * Returns steps for a given unitCode filtered by status.
 * Requires `req.hasPermissionFor(unitCode)` via `attachPermissionChecker` middleware.
 */
async function getStepsByStatus(req, res, status) {
    try {
        const { unitCode } = req.query;
        if (!unitCode) return res.status(400).json({ error: 'unitCode query param is required' });

        if (!req.hasPermissionFor(unitCode)) {
            return res.status(403).json({ error: `Not authorized for unitCode: ${unitCode}` });
        }

        // Populate request details so frontend can show student name, roll, etc.
        const steps = await ClearanceStep.find({ unitCode, status })
            .populate('requestId')
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

        res.json({ steps: filteredSteps });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getPending(req, res) { return getStepsByStatus(req, res, 'pending'); }
async function getApproved(req, res) { return getStepsByStatus(req, res, 'approved'); }
async function getRejected(req, res) { return getStepsByStatus(req, res, 'rejected'); }

// ── Approve & Reject ──────────────────────────────────────────────────────────

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

        // Update step
        step.status = 'approved';
        step.actionBy = req.user.email;
        step.actionAt = new Date();
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

        res.json({ message: 'Step approved', unlockedCodes, step });
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

        // Departments that MUST select at least one upstream dependency to reset.
        // HOD, Store, and Accounts all have optional dep selection — handled on frontend.
        // NAD still enforces mandatory dep selection.
        const DEPENDENT_UNITS = ['nad'];
        if (DEPENDENT_UNITS.includes(step.unitCode) && (!Array.isArray(restartFrom) || restartFrom.length === 0)) {
            return res.status(400).json({ error: 'Please select at least one dependent department to reset on reapply' });
        }

        step.status = 'rejected';
        step.actionBy = req.user.email;
        step.actionAt = new Date();
        step.rejectedAt = new Date();
        step.rejectionReason = reason;
        step.rejectionDescription = description.trim();
        step.restartFrom = (Array.isArray(restartFrom) && restartFrom.length > 0) ? restartFrom : [];
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

        res.json({ message: 'Step rejected', step });
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

            step.status = 'approved';
            step.actionBy = req.user.email;
            step.actionAt = new Date();
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
        const step = await ClearanceStep.findById(stepId).populate('requestId');
        if (!step) return res.status(404).json({ error: 'Step not found' });

        if (!req.hasPermissionFor(step.unitCode)) {
            return res.status(403).json({ error: 'Not authorized for this step' });
        }

        // Fetch full history tail
        const history = await StepActionLog.find({ stepId }).sort({ timestamp: 1 });

        res.json({ step, history });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// ── GET Step Full Details (for View Details modal) ────────────────────────────

/**
 * GET /api/clearance/:stepId/full
 * Returns:
 *  - The current step (with rejection info)
 *  - All sibling steps for the same request (for prerequisite display)
 *  - Student profile from EligibleStudent (for department-specific fields)
 *  - Document hasXxx booleans (NOT the raw URLs — frontend uses proxy)
 */
async function getStepFull(req, res) {
    try {
        const { stepId } = req.params;
        const EligibleStudent = require('../models/EligibleStudent');

        const step = await ClearanceStep.findById(stepId).populate('requestId');
        if (!step) return res.status(404).json({ error: 'Step not found' });

        if (!req.hasPermissionFor(step.unitCode)) {
            return res.status(403).json({ error: 'Not authorized for this step' });
        }

        const request = step.requestId;

        // All sibling steps for prerequisite panel
        const allSteps = await ClearanceStep.find({ requestId: request._id })
            .select('unitCode unitLabel unitGroup status rejectionReason rejectionDescription actionAt')
            .lean();

        // Full student profile from EligibleStudent (not exposed via NoDuesRequest)
        const profile = await EligibleStudent.findOne({ email: request.studentEmail })
            .select([
                'name', 'rollNo', 'email', 'branch', 'department', 'graduation',
                'phone', 'hostel',
                // Library
                'libraryEmailDate', 'btpReportFileUrl',
                // Placement
                'placementStatus', 'tpcEmailDate', 'placementDetailsText',
                'offerLetterFileUrl', 'placementDeclarationFileUrl',
                'admissionLetterFileUrl', 'examScorecardFileUrl',
                // Club / Store
                'clubRoleType', 'clubRoleDetail', 'festRoleDetail',
                // Financial / Accounts
                'accountHolderName', 'bankAccountNumber', 'bankName',
                'bankBranch', 'bankCity', 'ifscCode', 'donationAmount',
                'fatherName', 'fatherMobileNumber', 'correspondenceAddress',
                'cancelledChequeFileUrl',
                // Documents (presence only)
                'idCardFileUrl',
            ])
            .lean();

        // Convert raw Cloudinary URLs to boolean hasX flags so we never leak URLs.
        // The frontend fetches files via /api/student/file/:fieldName (auth-gated proxy).
        const docFlags = profile ? {
            hasIdCard: Boolean(profile.idCardFileUrl),
            hasBtpReport: Boolean(profile.btpReportFileUrl),
            hasOfferLetter: Boolean(profile.offerLetterFileUrl),
            hasPlacementDeclaration: Boolean(profile.placementDeclarationFileUrl),
            hasAdmissionLetter: Boolean(profile.admissionLetterFileUrl),
            hasExamScorecard: Boolean(profile.examScorecardFileUrl),
            hasCancelledCheque: Boolean(profile.cancelledChequeFileUrl),
        } : {};

        // Build safe profile (strip raw URLs)
        const safeProfile = profile ? {
            name: profile.name,
            rollNo: profile.rollNo,
            email: profile.email,
            branch: profile.branch,
            department: profile.department,
            graduation: profile.graduation,
            phone: profile.phone,
            hostel: profile.hostel,
            libraryEmailDate: profile.libraryEmailDate,
            placementStatus: profile.placementStatus,
            tpcEmailDate: profile.tpcEmailDate,
            placementDetailsText: profile.placementDetailsText,
            clubRoleType: profile.clubRoleType,
            clubRoleDetail: profile.clubRoleDetail,
            festRoleDetail: profile.festRoleDetail,
            accountHolderName: profile.accountHolderName,
            bankAccountNumber: profile.bankAccountNumber,
            bankName: profile.bankName,
            bankBranch: profile.bankBranch,
            bankCity: profile.bankCity,
            ifscCode: profile.ifscCode,
            donationAmount: profile.donationAmount,
            fatherName: profile.fatherName,
            fatherMobileNumber: profile.fatherMobileNumber,
            correspondenceAddress: profile.correspondenceAddress,
            ...docFlags,
        } : null;

        // All action logs for this specific step — for On Hold history + Reapply history
        const StepActionLog = require('../models/StepActionLog');
        const stepLogs = await StepActionLog.find({ stepId: step._id })
            .sort({ timestamp: 1 })
            .lean();

        res.json({
            step,
            allSteps,
            stepLogs,
            profile: safeProfile,
            requestInfo: {
                _id: request._id,
                studentEmail: request.studentEmail,
                studentName: request.studentName,
                rollNo: request.rollNo,
                branch: request.branch,
                hostel: request.hostel,
                phone: request.phone,
                placementStatus: request.placementStatus,
                // Latest reapply data — visible to ALL departments (not just the one that put on hold)
                reapplyData: request.reapplyData || null,
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

/**
 * GET /api/clearance/:stepId/file/:fieldName
 * Allows department officers to view student documents inside the View Details modal.
 * Gated by stepId permission (officer must have permission for that step's unitCode).
 */
async function getStepFile(req, res) {
    try {
        const { stepId, fieldName } = req.params;
        const EligibleStudent = require('../models/EligibleStudent');

        const dbField = FILE_FIELD_MAP[fieldName];
        if (!dbField) return res.status(400).json({ error: 'Invalid file field' });

        const step = await ClearanceStep.findById(stepId).populate('requestId');
        if (!step) return res.status(404).json({ error: 'Step not found' });

        if (!req.hasPermissionFor(step.unitCode)) {
            return res.status(403).json({ error: 'Not authorized for this step' });
        }

        const studentEmail = step.requestId?.studentEmail;
        if (!studentEmail) return res.status(404).json({ error: 'Student not found' });

        const student = await EligibleStudent.findOne({ email: studentEmail });
        if (!student) return res.status(404).json({ error: 'Student profile not found' });

        let fileUrl = student[dbField];
        if (!fileUrl) return res.status(404).json({ error: 'File not uploaded yet' });

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

    } catch (err) {
        console.error('getStepFile error:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getPending, getApproved, getRejected,
    approveStep, rejectStep, bulkApprove,
    getStepDetails, getStepFull, getStepFile,
    getDepartmentAccess, addDepartmentAccess, editDepartmentAccess, removeDepartmentAccess,
};
