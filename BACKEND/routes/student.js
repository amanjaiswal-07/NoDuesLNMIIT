const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const upload = require('../config/multer');
const studentController = require('../controllers/student.controller');

// All student routes require a verified JWT.
// We accept EITHER:
//   (a) role === 'student'  (new tokens issued after the role field was added), OR
//   (b) permissionCodes includes 'student' (older tokens issued before role field was added)
// This prevents hard-refresh 403s for users whose stored token pre-dates the role field.
const requireStudentAccess = (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const hasRole = req.user.role === 'student';
    const hasPerm = Array.isArray(req.user.permissionCodes) && req.user.permissionCodes.includes('student');
    if (!hasRole && !hasPerm) {
        return res.status(403).json({ error: 'Forbidden: student access required' });
    }
    next();
};

router.use(verifyToken, requireStudentAccess);

// ── Profile ────────────────────────────────────────────────────────────────────
router.get('/profile', studentController.getProfile);

router.post(
    '/profile',
    upload.fields([
        { name: 'idCardFile', maxCount: 1 },
        { name: 'btpReportFile', maxCount: 1 },
        { name: 'offerLetterFile', maxCount: 1 },
        { name: 'placementDeclarationFile', maxCount: 1 },
        { name: 'admissionLetterFile', maxCount: 1 },
        { name: 'examScorecardFile', maxCount: 1 },
        { name: 'cancelledChequeFile', maxCount: 1 },
    ]),
    studentController.updateProfile
);

// ── In-App File Viewer Proxy ───────────────────────────────────────────────────
// Returns file content via backend proxy — Cloudinary URL never exposed to frontend
router.get('/file/:fieldName', studentController.getStudentFile);

// ── Apply ──────────────────────────────────────────────────────────────────────
router.post('/apply', studentController.applyForNoDues);

// ── Tracking ───────────────────────────────────────────────────────────────────
router.get('/request', studentController.getActiveRequest);
router.get('/request/:requestId/steps', studentController.getRequestSteps);
// Event timeline — all StepActionLog entries for this request
router.get('/request/:requestId/logs', studentController.getRequestLogs);

// ── Reply to Rejection ─────────────────────────────────────────────────────────
router.post(
    '/request/steps/:stepId/reply',
    upload.array('proofs', 5),
    studentController.replyToRejectedStep
);

// ── Reapply after rejection ─────────────────────────────────────────────────────
// upload.single so students can optionally attach one proof file
router.post('/reapply', upload.single('reapplyFile'), studentController.reapply);

// Reapply proof proxy — dept officers load this from the View Details modal
router.get('/reapply/proof/:stepId/:index', studentController.getReapplyProof);
router.get('/logs/:logId/proof/:index', studentController.getMyLogProof);
router.get('/certificate', studentController.getCertificate);

module.exports = router;
