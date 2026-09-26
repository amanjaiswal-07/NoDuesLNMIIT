/**
 * admin.js routes — /api/admin. Every route requires a valid token AND the 'admin' permission.
 * Eligible students, staff access, dashboard numbers/details and the applications overview.
 */

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { requirePermission } = require('../middleware/requirePermission');
const {
    listEligibleStudents, addEligibleStudent, bulkAddEligibleStudents, bulkRemoveEligibleStudents, removeEligibleStudent, editEligibleStudent,
    listStaffAccess, addStaffAccess, updateStaffAccess, removeStaffAccess,
    getDashboardStats, getDashboardDetails, listApplications, getApplicationDetails,
} = require('../controllers/admin.controller');

// All admin routes require authentication + 'admin' permission
router.use(verifyToken, requirePermission('admin'));

// ── Eligible Students ──────────────────────────────────────────────────────────
router.get('/eligible-students', listEligibleStudents);
router.post('/eligible-students/bulk', bulkAddEligibleStudents);
router.post('/eligible-students', addEligibleStudent);
router.delete('/eligible-students/bulk', bulkRemoveEligibleStudents);
router.put('/eligible-students/:id', editEligibleStudent);
router.delete('/eligible-students/:id', removeEligibleStudent);

// ── Staff Access ───────────────────────────────────────────────────────────────
router.get('/staff-access', listStaffAccess);
router.post('/staff-access', addStaffAccess);
router.put('/staff-access/:id', updateStaffAccess);
router.delete('/staff-access/:id', removeStaffAccess);

// ── Dashboard & Applications ──────────────────────────────────────────────────
router.get('/dashboard-stats', getDashboardStats);
router.get('/dashboard-details/:type', getDashboardDetails);
router.get('/applications', listApplications);
router.get('/applications/:id', getApplicationDetails);

module.exports = router;
