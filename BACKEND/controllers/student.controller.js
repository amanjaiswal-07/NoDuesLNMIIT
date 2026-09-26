const https = require('https');
const http = require('http');
const { URL } = require('url');

// ── HTTP helper that follows up to 5 redirects ────────────────────────────────
function fetchFollowingRedirects(url, redirectsLeft = 5) {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const transport = parsed.protocol === 'https:' ? https : http;
        transport.get(url, (res) => {
            if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirectsLeft > 0) {
                // Consume the response body to free up the socket
                res.resume();
                const next = res.headers.location.startsWith('http')
                    ? res.headers.location
                    : `${parsed.origin}${res.headers.location}`;
                resolve(fetchFollowingRedirects(next, redirectsLeft - 1));
            } else {
                resolve(res);
            }
        }).on('error', reject);
    });
}

const NoDuesRequest = require('../models/NoDuesRequest');
const ClearanceStep = require('../models/ClearanceStep');
const StepActionLog = require('../models/StepActionLog');
const EligibleStudent = require('../models/EligibleStudent');
const cloudinary = require('../config/cloudinary');
const { createClearanceSteps } = require('../services/workflowService');
const { syncRequestStatus, relockDependents } = require('../services/dependencyEngine');
const { isValidBranch } = require('../config/workflowConfig');

// ── Cloudinary Utilities ──────────────────────────────────────────────────────

/**
 * Extract Cloudinary public_id from a full URL.
 * Works for both image and raw (PDF) URLs.
 * e.g. https://res.cloudinary.com/cloud/image/upload/v123/nodues/file.jpg → "nodues/file"
 */
function extractPublicId(url) {
    if (!url || !url.startsWith('http')) return null;
    try {
        // Match everything after /upload/ (with optional version) and before last extension
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(\.[^./]+)?$/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

/**
 * Delete a file from Cloudinary by URL.
 * Detects resource_type automatically (raw for PDF, image for others).
 * Non-fatal — logs error and continues on failure.
 */
async function deleteFromCloudinary(url) {
    if (!url || !url.startsWith('http')) return;
    const publicId = extractPublicId(url);
    if (!publicId) return;

    // Determine resource type from URL path
    const resourceType = url.includes('/raw/upload/') ? 'raw' : 'image';

    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`🗑️ Cloudinary delete [${resourceType}] "${publicId}": ${result.result}`);
    } catch (err) {
        console.error(`⚠️  Cloudinary delete failed for "${publicId}":`, err.message);
    }
}

/**
 * Determine which placement-related file URLs need to be cleared
 * when placementStatus changes from oldStatus to newStatus.
 */
function getObsoleteUrlsOnStatusChange(oldStatus, newStatus, student) {
    if (!oldStatus || oldStatus === newStatus) return [];

    const obsolete = [];

    // Files tied to specific old statuses
    if (oldStatus === 'Placed') {
        obsolete.push(student.offerLetterFileUrl);
    }
    if (oldStatus === 'Unplaced') {
        obsolete.push(student.placementDeclarationFileUrl);
    }
    if (oldStatus === 'Preparation Break' || oldStatus === 'Family Business') {
        obsolete.push(student.placementDeclarationFileUrl);
    }
    if (oldStatus === 'Higher Studies India' || oldStatus === 'Higher Studies Abroad') {
        obsolete.push(student.admissionLetterFileUrl);
        obsolete.push(student.examScorecardFileUrl);
    }

    return obsolete.filter(Boolean);
}

/**
 * Which DB fields to clear when placement status changes.
 */
function getObsoleteDbFieldsOnStatusChange(oldStatus, newStatus) {
    if (!oldStatus || oldStatus === newStatus) return {};

    const clear = {};

    if (oldStatus === 'Placed') {
        clear.offerLetterFileUrl = '';
    }
    if (oldStatus === 'Unplaced') {
        clear.placementDeclarationFileUrl = '';
        clear.placementDetailsText = '';
    }
    if (oldStatus === 'Preparation Break' || oldStatus === 'Family Business') {
        clear.placementDeclarationFileUrl = '';
    }
    if (oldStatus === 'Higher Studies India' || oldStatus === 'Higher Studies Abroad') {
        clear.admissionLetterFileUrl = '';
        clear.examScorecardFileUrl = '';
    }

    return clear;
}

// ── Profile Response Builder ──────────────────────────────────────────────────

/**
 * Build the profile response sent to the frontend.
 * EligibleStudent is the single source of truth for student data.
 */
function buildProfileResponse(student) {
    const s = student.toObject ? student.toObject() : student;
    return {
        // Identity (static, from admin)
        email: s.email,
        name: s.name,
        rollNo: s.rollNo,
        department: s.branch,    // frontend field name
        branch: s.branch,
        graduation: s.graduation || '',

        // Profile state
        profileCompleted: s.profileCompleted || false,
        submittedAt: s.submittedAt || null,

        // Editable fields
        phone: s.phone || '',
        hostel: s.hostel || '',
        clubRoleType: s.clubRoleType || '',
        clubRoleDetail: s.clubRoleDetail || '',
        festRoleDetail: s.festRoleDetail || '',
        placementStatus: s.placementStatus || '',
        placementDetailsText: s.placementDetailsText || '',
        libraryEmailDate: s.libraryEmailDate || '',
        tpcEmailDate: s.tpcEmailDate || '',
        accountHolderName: s.accountHolderName || '',
        bankAccountNumber: s.bankAccountNumber || '',
        bankName: s.bankName || '',
        bankBranch: s.bankBranch || '',
        bankCity: s.bankCity || '',
        ifscCode: s.ifscCode || '',
        donationAmount: s.donationAmount ?? '0',
        studentContactNumber: s.studentContactNumber || '',
        fatherName: s.fatherName || '',
        fatherMobileNumber: s.fatherMobileNumber || '',
        correspondenceAddress: s.correspondenceAddress || '',
        declarationAccepted: s.declarationAccepted || false,

        // File URLs (Cloudinary)
        idCardFileUrl: s.idCardFileUrl || '',
        btpReportFileUrl: s.btpReportFileUrl || '',
        offerLetterFileUrl: s.offerLetterFileUrl || '',
        placementDeclarationFileUrl: s.placementDeclarationFileUrl || '',
        admissionLetterFileUrl: s.admissionLetterFileUrl || '',
        examScorecardFileUrl: s.examScorecardFileUrl || '',
        cancelledChequeFileUrl: s.cancelledChequeFileUrl || '',
    };
}

// ── Profile Completeness Check ────────────────────────────────────────────────

function computeProfileCompleted(s) {
    const isHigherStudies =
        s.placementStatus === 'Higher Studies India' ||
        s.placementStatus === 'Higher Studies Abroad';

    const basicOk = Boolean(s.rollNo && s.branch && s.graduation && s.phone && s.hostel);
    const docsOk = Boolean(s.idCardFileUrl && s.btpReportFileUrl && s.libraryEmailDate);

    const roleOk = Boolean(
        s.clubRoleType && (
            s.clubRoleType === 'None' ||
            (s.clubRoleType === 'Club Coordinator' && s.clubRoleDetail) ||
            (s.clubRoleType === 'Fest Organizing Committee' && s.festRoleDetail) ||
            (s.clubRoleType === 'Both' && s.clubRoleDetail && s.festRoleDetail)
        )
    );

    let placementOk = Boolean(s.placementStatus && s.tpcEmailDate);
    if (s.placementStatus === 'Placed') placementOk = placementOk && Boolean(s.offerLetterFileUrl);
    if (s.placementStatus === 'Unplaced') placementOk = placementOk && Boolean(s.placementDetailsText) && Boolean(s.placementDeclarationFileUrl);
    if (s.placementStatus === 'Preparation Break' || s.placementStatus === 'Family Business') placementOk = placementOk && Boolean(s.placementDeclarationFileUrl);
    if (isHigherStudies) placementOk = placementOk && Boolean(s.admissionLetterFileUrl || s.examScorecardFileUrl);

    const declarationOk = Boolean(
        s.accountHolderName && s.bankAccountNumber && s.bankName && s.bankBranch &&
        s.bankCity && s.ifscCode && s.donationAmount !== undefined && s.donationAmount !== '' &&
        s.studentContactNumber && s.fatherName && s.fatherMobileNumber &&
        s.correspondenceAddress && s.cancelledChequeFileUrl && s.declarationAccepted === true
    );

    return basicOk && docsOk && roleOk && placementOk && declarationOk;
}

// ── Profile Lock ──────────────────────────────────────────────────────────────

/**
 * The profile can be edited before applying and while the application is On Hold
 * (so the student can fix what a department asked for). It is locked while the
 * application is being reviewed and after it is completed.
 */
async function getProfileLock(email) {
    const emailRegex = new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const request = await NoDuesRequest.findOne({ studentEmail: emailRegex }).sort({ createdAt: -1 }).select('status');
    if (!request || request.status === 'action_required') return { editable: true, reason: '' };
    // Orphaned request (no steps) is treated as no application — same rule as getActiveRequest
    const stepCount = await ClearanceStep.countDocuments({ requestId: request._id });
    if (stepCount === 0 && request.status !== 'approved') return { editable: true, reason: '' };
    return {
        editable: false,
        reason: request.status === 'approved'
            ? 'Your No Dues is complete, so your profile can no longer be edited.'
            : 'Your profile is locked while your application is being reviewed. It unlocks only if a department puts your application on hold.',
    };
}

// ── Controllers ───────────────────────────────────────────────────────────────

async function getProfile(req, res) {
    try {
        const student = await EligibleStudent.findOne({ email: req.user.email });
        if (!student) return res.status(404).json({ error: 'Student not found in eligible list' });
        const lock = await getProfileLock(req.user.email);
        res.json({ profile: { ...buildProfileResponse(student), editable: lock.editable, lockReason: lock.reason } });
    } catch (err) {
        console.error('getProfile error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function updateProfile(req, res) {
    try {
        const student = await EligibleStudent.findOne({ email: req.user.email });
        if (!student) return res.status(404).json({ error: 'Student not found in eligible list' });

        const lock = await getProfileLock(req.user.email);
        if (!lock.editable) {
            // Files were already uploaded by multer before we got here — remove them
            const uploaded = Object.values(req.files || {}).flat().map(f => f.path);
            await Promise.all(uploaded.map(deleteFromCloudinary));
            return res.status(403).json({ error: lock.reason });
        }

        // Helper: get new Cloudinary URL from upload, or fall back to existing
        const getUrl = (fieldName, existingUrl) => {
            if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
                return req.files[fieldName][0].path; // Cloudinary URL from multer
            }
            return existingUrl || '';
        };

        const {
            phone, hostel,
            clubRoleType, clubRoleDetail, festRoleDetail,
            placementStatus, placementDetailsText,
            libraryEmailDate, tpcEmailDate,
            accountHolderName, bankAccountNumber, bankName, bankBranch, bankCity,
            ifscCode, donationAmount, studentContactNumber,
            fatherName, fatherMobileNumber, correspondenceAddress,
            submittedDate, declarationAccepted,
        } = req.body;

        const isDeclarationAccepted = declarationAccepted === 'true' || declarationAccepted === true;

        // ── Club Role Cleanup ──────────────────────────────────────────────
        // If role is None, always clear detail fields
        const resolvedClubDetail = (clubRoleType === 'None') ? '' : (clubRoleDetail || student.clubRoleDetail || '');
        const resolvedFestDetail = (clubRoleType === 'None') ? '' : (festRoleDetail || student.festRoleDetail || '');

        // ── Placement Status Change Detection ──────────────────────────────
        const oldPlacementStatus = student.placementStatus;
        const newPlacementStatus = placementStatus || student.placementStatus || '';
        const placementChanged = oldPlacementStatus && oldPlacementStatus !== newPlacementStatus;

        // Determine obsolete Cloudinary files from old placement status
        const obsoleteUrls = placementChanged
            ? getObsoleteUrlsOnStatusChange(oldPlacementStatus, newPlacementStatus, student)
            : [];

        // Determine DB fields to clear due to placement change
        const obsoleteDbFields = placementChanged
            ? getObsoleteDbFieldsOnStatusChange(oldPlacementStatus, newPlacementStatus)
            : {};

        // ── File Re-upload Cleanup ─────────────────────────────────────────
        // If a new file is uploaded, delete the old one from Cloudinary first
        const fileFieldMap = {
            idCardFile: 'idCardFileUrl',
            btpReportFile: 'btpReportFileUrl',
            offerLetterFile: 'offerLetterFileUrl',
            placementDeclarationFile: 'placementDeclarationFileUrl',
            admissionLetterFile: 'admissionLetterFileUrl',
            examScorecardFile: 'examScorecardFileUrl',
            cancelledChequeFile: 'cancelledChequeFileUrl',
        };

        for (const [formField, dbField] of Object.entries(fileFieldMap)) {
            const hasNewFile = req.files && req.files[formField] && req.files[formField][0];
            const existingUrl = student[dbField];
            if (hasNewFile && existingUrl && !obsoleteUrls.includes(existingUrl)) {
                obsoleteUrls.push(existingUrl); // also clean up replaced file
            }
        }

        // Delete all obsolete files from Cloudinary (non-blocking, parallel)
        await Promise.all(obsoleteUrls.map(deleteFromCloudinary));

        // ── Build Updated Document ─────────────────────────────────────────
        // New file URLs: use uploaded file if present, else keep existing
        // (but clear fields that became obsolete due to placement change)
        const resolveUrl = (formField, dbField) => {
            if (obsoleteDbFields[dbField] !== undefined) return ''; // cleared by status change
            return getUrl(formField, student[dbField]);
        };

        student.phone = phone || student.phone || '';
        student.hostel = hostel || student.hostel || '';

        student.clubRoleType = clubRoleType || student.clubRoleType || '';
        student.clubRoleDetail = resolvedClubDetail;
        student.festRoleDetail = resolvedFestDetail;

        student.placementStatus = newPlacementStatus;
        student.placementDetailsText = obsoleteDbFields.placementDetailsText !== undefined
            ? ''
            : (placementDetailsText || student.placementDetailsText || '');

        student.libraryEmailDate = libraryEmailDate || student.libraryEmailDate || '';
        student.tpcEmailDate = tpcEmailDate || student.tpcEmailDate || '';

        student.accountHolderName = accountHolderName || student.accountHolderName || '';
        student.bankAccountNumber = bankAccountNumber || student.bankAccountNumber || '';
        student.bankName = bankName || student.bankName || '';
        student.bankBranch = bankBranch || student.bankBranch || '';
        student.bankCity = bankCity || student.bankCity || '';
        student.ifscCode = ifscCode ? ifscCode.toUpperCase() : (student.ifscCode || '');
        student.donationAmount = donationAmount !== undefined ? donationAmount : (student.donationAmount || '0');
        student.studentContactNumber = studentContactNumber || student.studentContactNumber || '';
        student.fatherName = fatherName || student.fatherName || '';
        student.fatherMobileNumber = fatherMobileNumber || student.fatherMobileNumber || '';
        student.correspondenceAddress = correspondenceAddress || student.correspondenceAddress || '';
        student.declarationAccepted = isDeclarationAccepted;
        student.submittedAt = submittedDate ? new Date(submittedDate) : (student.submittedAt || new Date());

        // File URLs
        student.idCardFileUrl = resolveUrl('idCardFile', 'idCardFileUrl');
        student.btpReportFileUrl = resolveUrl('btpReportFile', 'btpReportFileUrl');
        student.offerLetterFileUrl = resolveUrl('offerLetterFile', 'offerLetterFileUrl');
        student.placementDeclarationFileUrl = resolveUrl('placementDeclarationFile', 'placementDeclarationFileUrl');
        student.admissionLetterFileUrl = resolveUrl('admissionLetterFile', 'admissionLetterFileUrl');
        student.examScorecardFileUrl = resolveUrl('examScorecardFile', 'examScorecardFileUrl');
        student.cancelledChequeFileUrl = resolveUrl('cancelledChequeFile', 'cancelledChequeFileUrl');

        // Compute and store profileCompleted
        student.profileCompleted = computeProfileCompleted(student);

        await student.save();

        console.log(`✅ Profile updated: ${student.email} | complete: ${student.profileCompleted} | placementChange: ${placementChanged ? `${oldPlacementStatus}→${newPlacementStatus}` : 'none'}`);

        res.json({
            message: student.profileCompleted
                ? 'Profile saved and marked complete.'
                : 'Profile saved. Fill all required fields to apply.',
            profile: { ...buildProfileResponse(student), editable: true, lockReason: '' },
        });
    } catch (err) {
        console.error('updateProfile error:', err);
        res.status(500).json({ error: err.message });
    }
}

// ── In-App File Proxy ─────────────────────────────────────────────────────────

// Map frontend field names to EligibleStudent URL fields
const FILE_FIELD_MAP = {
    idCardFile: 'idCardFileUrl',
    btpReportFile: 'btpReportFileUrl',
    offerLetterFile: 'offerLetterFileUrl',
    placementDeclarationFile: 'placementDeclarationFileUrl',
    admissionLetterFile: 'admissionLetterFileUrl',
    examScorecardFile: 'examScorecardFileUrl',
    cancelledChequeFile: 'cancelledChequeFileUrl',
};

/**
 * GET /api/student/file/:fieldName
 * Proxies the Cloudinary file back to the client.
 * Follows HTTP redirects (Cloudinary CDN often 302s).
 * Cloudinary URL is NEVER sent to the frontend.
 */
async function getStudentFile(req, res) {
    try {
        const { fieldName } = req.params;
        const dbField = FILE_FIELD_MAP[fieldName];
        if (!dbField) return res.status(400).json({ error: 'Invalid file field' });

        const student = await EligibleStudent.findOne({ email: req.user.email });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        let fileUrl = student[dbField];
        if (!fileUrl) return res.status(404).json({ error: 'File not uploaded yet' });

        // Cloudinary fixes:
        // 1. PDFs uploaded with resource_type:auto get stored as 'raw'.
        //    If URL still says /image/upload/ for a .pdf, correct it to /raw/upload/
        if (fileUrl.includes('/image/upload/') && fileUrl.toLowerCase().endsWith('.pdf')) {
            fileUrl = fileUrl.replace('/image/upload/', '/raw/upload/');
        }
        // 2. fl_attachment flag forces download — remove it so file opens inline
        fileUrl = fileUrl.replace(/\/fl_attachment/g, '');

        // Fetch from Cloudinary and stream to client.
        // fetchFollowingRedirects() handles 301/302 that Cloudinary CDN issues.
        const proxyRes = await fetchFollowingRedirects(fileUrl);

        // Determine correct content-type.
        // Cloudinary often returns 'application/octet-stream' for PDFs stored in raw mode,
        // so we override based on URL extension rather than trusting the upstream header.
        let contentType = proxyRes.headers['content-type'] || 'application/octet-stream';
        if (fileUrl.toLowerCase().endsWith('.pdf') || contentType === 'application/octet-stream') {
            contentType = 'application/pdf';
        }

        // If Cloudinary returned HTML it means an error page (bad URL, not found, etc.)
        if (contentType.startsWith('text/html')) {
            console.error(`Cloudinary returned HTML for ${fieldName} | url=${fileUrl}`);
            if (!res.headersSent) return res.status(502).json({ error: 'File could not be retrieved from storage.' });
            return;
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline');
        // No-cache: ensures UI sees updated file after re-upload
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        proxyRes.pipe(res);

    } catch (err) {
        console.error('getStudentFile error:', err);
        res.status(500).json({ error: err.message });
    }
}

// ── Apply for No Dues ─────────────────────────────────────────────────────────

async function applyForNoDues(req, res) {
    try {
        const student = await EligibleStudent.findOne({ email: req.user.email });
        if (!student) return res.status(404).json({ error: 'Student not found in eligible list' });

        if (!student.profileCompleted) {
            return res.status(403).json({
                error: 'Profile is incomplete. Please complete your profile before applying.',
            });
        }

        if (!isValidBranch(student.branch)) {
            return res.status(400).json({
                error: `Your branch "${student.branch}" is not recognised. Please contact the admin to correct it before applying.`,
            });
        }

        const existing = await NoDuesRequest.findOne({
            studentEmail: req.user.email,
            status: { $ne: 'approved' },
        });

        if (existing) {
            // Check if the request has any clearance steps (steps may have been manually deleted)
            const stepCount = await ClearanceStep.countDocuments({ requestId: existing._id });
            if (stepCount === 0) {
                // Orphaned request — no steps exist, safe to auto-delete and allow fresh apply
                console.warn(`⚠ Orphaned NoDuesRequest detected (no steps). Auto-deleting: ${existing._id}`);
                await NoDuesRequest.deleteOne({ _id: existing._id });
            } else {
                return res.status(400).json({ error: 'You already have an active application.' });
            }
        }

        const request = await NoDuesRequest.create({
            studentEmail: student.email,
            studentName: student.name,
            rollNo: student.rollNo,
            branch: student.branch,
            phone: student.phone,
            hostel: student.hostel,
            btpReportEmailDate: student.libraryEmailDate,
            placementStatus: student.placementStatus,
            idCardUrl: student.idCardFileUrl,
            btpReportUrl: student.btpReportFileUrl,
            offerLetterUrl: student.offerLetterFileUrl,
            declarationUrl: student.placementDeclarationFileUrl || student.cancelledChequeFileUrl,
            admissionLetterUrl: student.admissionLetterFileUrl,
            examScorecardUrl: student.examScorecardFileUrl,
            status: 'in_progress',
        });

        const steps = await createClearanceSteps(request);
        res.status(201).json({ message: 'Application submitted successfully.', request, steps });
    } catch (err) {
        console.error('applyForNoDues error:', err);
        res.status(500).json({ error: err.message });
    }
}

// ── Tracking ──────────────────────────────────────────────────────────────────

async function getActiveRequest(req, res) {
    try {
        // Use case-insensitive regex so email case mismatches between JWT and DB never cause a miss.
        const emailRegex = new RegExp(`^${req.user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const request = await NoDuesRequest.findOne({ studentEmail: emailRegex }).sort({ createdAt: -1 });
        if (!request) return res.status(404).json({ error: 'No active request found' });

        // If the request has no clearance steps it is orphaned (manually deleted from DB).
        // Treat it as if no request exists so the student can reapply cleanly.
        const stepCount = await ClearanceStep.countDocuments({ requestId: request._id });
        if (stepCount === 0 && request.status !== 'approved') {
            return res.status(404).json({ error: 'No active request found' });
        }

        res.json({ request });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getRequestSteps(req, res) {
    try {
        const { requestId } = req.params;

        // Find by _id only (ObjectId is exact — no email case-sensitivity risk),
        // then verify ownership with a normalized lowercase comparison.
        const request = await NoDuesRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.studentEmail.toLowerCase() !== req.user.email.toLowerCase()) {
            return res.status(403).json({ error: 'Not authorized to view this request' });
        }

        const steps = await ClearanceStep.find({ requestId });
        res.json({ steps });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// ── Rejection Reply ───────────────────────────────────────────────────────────

async function replyToRejectedStep(req, res) {
    try {
        const { stepId } = req.params;
        const { comment } = req.body;

        const step = await ClearanceStep.findById(stepId).populate('requestId');
        if (!step) return res.status(404).json({ error: 'Step not found' });
        if (step.requestId.studentEmail !== req.user.email) return res.status(403).json({ error: 'Not authorized' });
        if (step.status !== 'rejected') return res.status(400).json({ error: `Cannot reply to step in '${step.status}' state` });

        const proofUrls = req.files ? req.files.map((f) => f.path) : [];
        step.status = 'pending';
        step.studentReply = comment || '';
        if (proofUrls.length > 0) step.studentProofUrls.push(...proofUrls);
        step.repliedAt = new Date();
        await step.save();

        await StepActionLog.create({ stepId: step._id, requestId: step.requestId._id, action: 'student_replied', actorEmail: req.user.email, actorRole: 'student', note: comment || '', proofUrls });
        await StepActionLog.create({ stepId: step._id, requestId: step.requestId._id, action: 'reopened', actorEmail: 'system', note: 'Returned to pending after student reply' });
        await syncRequestStatus(step.requestId._id);

        res.json({ message: 'Reply submitted successfully', step });
    } catch (err) {
        console.error('replyToRejectedStep error:', err);
        res.status(500).json({ error: err.message });
    }
}

async function reapply(req, res) {
    try {
        // Find most-recent active (non-fully-approved) request for this student
        // Use case-insensitive email match to handle any case mismatch between JWT and DB.
        const emailRegex = new RegExp(`^${req.user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const request = await NoDuesRequest.findOne({
            studentEmail: emailRegex,
            status: { $in: ['action_required', 'in_progress'] },
        }).sort({ createdAt: -1 });

        if (!request) {
            return res.status(404).json({ error: 'No reapply-able request found. All done or no application exists.' });
        }

        const allSteps = await ClearanceStep.find({ requestId: request._id });

        const rejectedSteps = allSteps.filter(s => s.status === 'rejected');
        if (rejectedSteps.length === 0) {
            return res.status(400).json({ error: 'No rejected steps found. Nothing to reapply.' });
        }

        // ── Persist reapply data (ALWAYS overwrite — clears old data if nothing provided) ──
        const comment = req.body?.comment?.trim() || '';
        const proofUrl = req.file ? req.file.path : '';
        const reapplyTimestamp = new Date();

        // Save on each rejected step (the step-level data for departments that put it on hold)
        for (const step of rejectedSteps) {
            step.studentReply = comment;                    // '' clears previous comment
            step.studentProofUrls = proofUrl ? [proofUrl] : [];  // replaces array entirely
            step.repliedAt = reapplyTimestamp;
            await step.save();
        }

        // Save globally on the request so ALL affected departments can see it
        request.reapplyData = { comment, proofUrl, submittedAt: reapplyTimestamp };
        await request.save();
        // ───────────────────────────────────────────────────────────────────────

        // Collect all unit codes that should be reset to 'pending'
        const toResetPending = new Set();
        // Collect all unit codes that should go back to 'locked' (re-locked because their prerequisite is being reset)
        const toRelock = new Set();

        const siblingCodes = new Set(allSteps.map(s => s.unitCode));
        // Departments a re-locked step must wait for before it comes back (its reset choice)
        const waitFor = {};
        // Why each department is being reset by someone else's hold — shown in its timeline
        const resetBy = {};

        for (const step of rejectedSteps) {
            const restart = (step.restartFrom || []).filter(code => siblingCodes.has(code) && code !== step.unitCode);
            if (restart.length > 0) {
                // HOD / NAD / Store / Accounts specified which upstream deps to restart
                restart.forEach(code => {
                    toResetPending.add(code);
                    // snapshot now — the holder's reason is cleared when it is re-locked below
                    (resetBy[code] = resetBy[code] || []).push(
                        `${step.unitLabel || step.unitCode} put the application on hold ([${step.rejectionReason}] ${step.rejectionDescription})`
                    );
                });
                waitFor[step.unitCode] = restart;
                // The rejected step itself goes back to locked (it will unlock naturally when deps re-approve)
                toRelock.add(step.unitCode);
            } else {
                // Simple case: reset only the rejected step itself
                toResetPending.add(step.unitCode);
            }

            // Special rule: if library_librarian is rejected → restart full library chain
            if (step.unitCode === 'library_librarian') {
                toResetPending.add('library_staff');
                // library_librarian will re-lock because library_staff is being reset
                toRelock.add('library_librarian');
                toResetPending.delete('library_librarian'); // not pending, will be locked
            }
        }

        // Post-loop rule: if library_staff is being reset (e.g. HOD selected Library as faulty),
        // also relock library_librarian so the full 2-step chain restarts from scratch.
        // relockDependents skips 'approved' steps, so we must do this explicitly here.
        if (toResetPending.has('library_staff')) {
            toRelock.add('library_librarian');
            toResetPending.delete('library_librarian'); // ensure it stays in relock, not pending
        }

        const logs = [];

        // Log 'reapply' event on each rejected step (before reset, so log shows which dept was on hold)
        for (const s of rejectedSteps) {
            logs.push({
                stepId: s._id,
                requestId: request._id,
                action: 'reapply',
                actorEmail: req.user.email,
                actorRole: 'student',
                note: comment,
                proofUrls: proofUrl ? [proofUrl] : [],
            });
        }

        // A step that must wait (re-locked) is never also reset to pending
        for (const code of toRelock) toResetPending.delete(code);

        // Apply resets
        for (const s of allSteps) {
            if (toResetPending.has(s.unitCode)) {
                const holders = resetBy[s.unitCode] || [];
                const note = holders.length > 0
                    ? `Reset because ${holders.join('; ')}.`
                        + (comment ? ` Student's comment: ${comment}` : '')
                    : 'Reset by student reapply';
                s.status = 'pending';
                // Clear old rejection data so the step looks fresh to the department
                s.rejectionReason = '';
                s.rejectionDescription = '';
                s.rejectedAt = undefined;
                s.restartFrom = [];
                s.actionBy = '';
                s.actionAt = undefined;
                await s.save();
                logs.push({
                    stepId: s._id, requestId: request._id, action: 'reopened', actorEmail: 'system', actorRole: 'system', note,
                    // departments reset by another department's hold also get the student's document
                    proofUrls: holders.length > 0 && proofUrl ? [proofUrl] : [],
                });
            } else if (toRelock.has(s.unitCode)) {
                s.status = 'locked';
                s.rejectionReason = '';
                s.rejectionDescription = '';
                s.rejectedAt = undefined;
                s.restartFrom = waitFor[s.unitCode] || []; // unlocks only after these are approved again
                s.actionBy = '';
                s.actionAt = undefined;
                await s.save();
                logs.push({ stepId: s._id, requestId: request._id, action: 'reopened', actorEmail: 'system', actorRole: 'system', note: 'Re-locked by reapply — awaiting prerequisites' });
            }
        }

        if (logs.length > 0) await StepActionLog.insertMany(logs);

        // Cascade: re-lock any steps that now have unsatisfied prerequisites
        // (e.g. NAD/Store/Accounts must re-lock when HOD is locked)
        await relockDependents(request._id);

        // Sync request status back to in_progress
        await syncRequestStatus(request._id);

        res.json({
            message: 'Reapply successful. The relevant steps have been reset.',
            resetUnits: [...toResetPending],
            reLockedUnits: [...toRelock],
        });
    } catch (err) {
        console.error('reapply error:', err);
        res.status(500).json({ error: err.message });
    }
}

// ── Reapply Proof Proxy (for department ViewDetailsModal) ─────────────────────

/**
 * GET /api/student/reapply/proof/:stepId/:index      (student who owns the request)
 * GET /api/clearance/reapply/proof/:stepId/:index    (staff with permission for the step)
 * Proxies the student's reapply proof file stored in ClearanceStep.studentProofUrls.
 * The proxy logic lives here for co-location with reapply.
 */
async function getReapplyProof(req, res) {
    try {
        const { stepId } = req.params;
        const index = parseInt(req.params.index, 10) || 0;

        const step = await ClearanceStep.findById(stepId).populate('requestId');
        if (!step) return res.status(404).json({ error: 'Step not found' });

        // Clearance router attaches hasPermissionFor; the student router does not.
        const allowed = typeof req.hasPermissionFor === 'function'
            ? req.hasPermissionFor(step.unitCode)
            : (step.requestId?.studentEmail || '').toLowerCase() === (req.user.email || '').toLowerCase();
        if (!allowed) return res.status(403).json({ error: 'Not authorized to view this file' });

        const urls = step.studentProofUrls || [];
        if (index < 0 || index >= urls.length) {
            return res.status(404).json({ error: 'Proof file not found at that index' });
        }

        await streamProofFile(urls[index], res);
    } catch (err) {
        console.error('getReapplyProof error:', err);
        res.status(500).json({ error: err.message });
    }
}

// Streams a stored proof file (Cloudinary) to the client without exposing its URL.
async function streamProofFile(storedUrl, res) {
    let fileUrl = storedUrl;

    // Cloudinary URL fixes (same as other proxy handlers)
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

// GET /student/logs/:logId/proof/:index — a document the student attached to a timeline event (e.g. a reapply)
async function getMyLogProof(req, res) {
    try {
        const index = parseInt(req.params.index, 10) || 0;
        const log = await StepActionLog.findById(req.params.logId).lean();
        const fileUrl = log?.proofUrls?.[index];
        if (!fileUrl) return res.status(404).json({ error: 'Document not found' });

        const request = await NoDuesRequest.findById(log.requestId).select('studentEmail').lean();
        if (!request || (request.studentEmail || '').toLowerCase() !== (req.user.email || '').toLowerCase()) {
            return res.status(403).json({ error: 'Not authorized to view this file' });
        }

        await streamProofFile(fileUrl, res);
    } catch (err) {
        console.error('getMyLogProof error:', err);
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
}

// ── GET Request Logs (for event timeline) ───────────────────────────────────

/**
 * GET /api/student/request/:requestId/logs
 * Returns all StepActionLog entries for a request, sorted by timestamp ascending.
 * Only available to the student who owns the request.
 */
async function getRequestLogs(req, res) {
    try {
        const { requestId } = req.params;

        // Find by _id only, then verify ownership with case-insensitive email comparison.
        const request = await NoDuesRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.studentEmail.toLowerCase() !== req.user.email.toLowerCase()) {
            return res.status(403).json({ error: 'Not authorized to view this request' });
        }

        const logs = await StepActionLog.find({ requestId }).sort({ timestamp: 1 }).lean();
        res.json({ logs });
    } catch (err) {
        console.error('getRequestLogs error:', err);
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getMyLogProof,
    getProfile,
    updateProfile,
    getStudentFile,
    applyForNoDues,
    getActiveRequest,
    getRequestSteps,
    replyToRejectedStep,
    reapply,
    getReapplyProof,
    getRequestLogs,
};
