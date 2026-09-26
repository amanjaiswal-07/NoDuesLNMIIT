/**
 * admin.controller.js — everything behind /api/admin (admin permission required).
 * Sections:
 *   • Eligible students — list / add / edit / remove / bulk CSV import / bulk remove. Branches are
 *     validated (CSE, ECE, CCE, MECH); unknown branches are rejected or skipped with a reason.
 *   • Staff access — list / add / update / remove permission codes on User records.
 *   • Dashboard — getDashboardStats (card numbers + department overview) and
 *     getDashboardDetails (who is behind each card).
 *   • Applications — buildApplicationRows (progress, where it is pending, who put it on hold),
 *     listApplications and getApplicationDetails for the admin Applications page.
 */

const EligibleStudent = require('../models/EligibleStudent');
const User = require('../models/User');
const NoDuesRequest = require('../models/NoDuesRequest');
const ClearanceStep = require('../models/ClearanceStep');
const { ROUTE_TO_PERMISSION, ALL_UNIT_CODES } = require('../config/permissionCodes');
const { VALID_BRANCHES, normalizeBranch, isValidBranch } = require('../config/workflowConfig');

const unknownBranchMessage = (branch) =>
    `Unknown branch "${branch}". Allowed: ${VALID_BRANCHES.join(', ')}`;

// ── Eligible Students ─────────────────────────────────────────────────────────

/** GET /api/admin/eligible-students */
async function listEligibleStudents(req, res) {
    try {
        const students = await EligibleStudent.find().sort({ createdAt: -1 });
        res.json({ students });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/** POST /api/admin/eligible-students  — add single student */
async function addEligibleStudent(req, res) {
    try {
        const { name, email, rollNo, branch } = req.body;
        if (!name || !email || !rollNo || !branch) {
            return res.status(400).json({ error: 'name, email, rollNo, branch are required' });
        }
        if (!isValidBranch(branch)) {
            return res.status(400).json({ error: unknownBranchMessage(branch) });
        }

        const existing = await EligibleStudent.findOne({
            $or: [{ email: email.toLowerCase() }, { rollNo: rollNo.trim() }],
        });
        if (existing) {
            return res.status(409).json({ error: 'Student with this email or roll number already exists' });
        }

        const student = await EligibleStudent.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            rollNo: rollNo.trim().toUpperCase(),
            branch: normalizeBranch(branch),
            addedBy: req.user.id,
        });

        res.status(201).json({ message: 'Student added', student });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/** POST /api/admin/eligible-students/bulk  — bulk import from parsed CSV rows */
async function bulkAddEligibleStudents(req, res) {
    try {
        // Expects: { students: [{ name, email, rollNo, branch }] }
        const { students: rows } = req.body;
        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ error: 'No student rows provided' });
        }

        const existingEmails = new Set(
            (await EligibleStudent.find({}, 'email rollNo')).flatMap(s => [s.email, s.rollNo])
        );

        const toInsert = [];
        const skipped = [];

        for (const row of rows) {
            const email = (row.email || '').trim().toLowerCase();
            const rollNo = (row.rollNo || '').trim().toUpperCase();
            const name = (row.name || '').trim();
            const branch = normalizeBranch(row.branch);

            if (!email || !rollNo || !name || !branch) {
                skipped.push({ row, reason: 'Missing fields' });
                continue;
            }
            if (!isValidBranch(branch)) {
                skipped.push({ row, reason: unknownBranchMessage(row.branch) });
                continue;
            }
            if (existingEmails.has(email) || existingEmails.has(rollNo)) {
                skipped.push({ row, reason: 'Duplicate email or rollNo' });
                continue;
            }

            existingEmails.add(email);
            existingEmails.add(rollNo);
            toInsert.push({ name, email, rollNo, branch, addedBy: req.user.id });
        }

        const inserted = await EligibleStudent.insertMany(toInsert);
        res.status(201).json({
            message: `${inserted.length} students imported`,
            imported: inserted.length,
            skipped: skipped.length,
            skippedDetails: skipped,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/** PUT /api/admin/eligible-students/:id */
async function editEligibleStudent(req, res) {
    try {
        const { name, email, rollNo, branch } = req.body;
        if (!name || !email || !rollNo || !branch) {
            return res.status(400).json({ error: 'name, email, rollNo, branch are required' });
        }
        if (!isValidBranch(branch)) {
            return res.status(400).json({ error: unknownBranchMessage(branch) });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedRollNo = rollNo.trim().toUpperCase();

        const existing = await EligibleStudent.findOne({
            _id: { $ne: req.params.id },
            $or: [{ email: normalizedEmail }, { rollNo: normalizedRollNo }],
        });

        if (existing) {
            return res.status(409).json({ error: 'Another student with this email or roll number already exists' });
        }

        // Derive graduation from new rollNo
        let graduation = '';
        if (normalizedRollNo.includes('U')) graduation = 'UG';
        else if (normalizedRollNo.includes('P')) graduation = 'PG';

        // Use $set so ONLY identity fields are updated — profile fields are preserved
        const student = await EligibleStudent.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    name: name.trim(),
                    email: normalizedEmail,
                    rollNo: normalizedRollNo,
                    branch: normalizeBranch(branch),
                    graduation,
                },
            },
            { new: true }
        );

        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json({ message: 'Student updated', student });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/** DELETE /api/admin/eligible-students/bulk */
async function bulkRemoveEligibleStudents(req, res) {
    try {
        const { studentIds } = req.body;
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ error: 'studentIds array is required' });
        }
        await EligibleStudent.deleteMany({ _id: { $in: studentIds } });
        res.json({ message: 'Students removed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/** DELETE /api/admin/eligible-students/:id */
async function removeEligibleStudent(req, res) {
    try {
        const student = await EligibleStudent.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json({ message: 'Student removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// ── Staff Access ──────────────────────────────────────────────────────────────

/** GET /api/admin/staff-access */
async function listStaffAccess(req, res) {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/admin/staff-access
 * Body: { name, email, route }  — route is the frontend route string like "/medical"
 * Backend converts route → permissionCode automatically.
 */
async function addStaffAccess(req, res) {
    try {
        const { name, email, route } = req.body;
        if (!name || !email || !route) {
            return res.status(400).json({ error: 'name, email, route are required' });
        }

        const permissionCode = ROUTE_TO_PERMISSION[route];
        if (!permissionCode) {
            return res.status(400).json({ error: `Unknown route: ${route}` });
        }

        const normalizedEmail = email.trim().toLowerCase();
        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
            // User already exists — add permission code if not already present
            if (!user.permissionCodes.includes(permissionCode)) {
                user.permissionCodes.push(permissionCode);
                await user.save();
            }
            return res.json({ message: 'Permission added to existing user', user });
        }

        // Create new staff user
        user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            permissionCodes: [permissionCode],
        });

        res.status(201).json({ message: 'Staff access added', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/**
 * PUT /api/admin/staff-access/:id
 * Body: { name, email, route }
 * Query: ?oldCode=xyz
 */
async function updateStaffAccess(req, res) {
    try {
        const { id } = req.params;
        const { name, email, route } = req.body;
        const { oldCode } = req.query;

        if (!name || !email || !route) {
            return res.status(400).json({ error: 'name, email, route are required' });
        }

        const permissionCode = (route === 'admin' || route === '/admin') ? 'admin' : ROUTE_TO_PERMISSION[route];
        if (!permissionCode) {
            return res.status(400).json({ error: `Unknown route: ${route}` });
        }

        const normalizedEmail = email.trim().toLowerCase();
        let existingUserWithEmail = await User.findOne({ email: normalizedEmail });

        if (existingUserWithEmail && existingUserWithEmail.id !== id) {
            return res.status(409).json({ error: 'Email already exists. Please use a different email or merge permissions.' });
        }

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Update basic info
        user.name = name.trim();
        user.email = normalizedEmail;

        // Swap the targeted old code with the newly requested code if applicable
        if (oldCode && oldCode !== 'null' && user.permissionCodes.includes(oldCode)) {
            user.permissionCodes = user.permissionCodes.map(c => c === oldCode ? permissionCode : c);
        } else if (!user.permissionCodes.includes(permissionCode)) {
            user.permissionCodes.push(permissionCode);
        }

        // Deduplicate just in case
        user.permissionCodes = [...new Set(user.permissionCodes)];

        await user.save();
        res.json({ message: 'Access updated', user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/** DELETE /api/admin/staff-access/:id?code=XYZ */
async function removeStaffAccess(req, res) {
    try {
        const { id } = req.params;
        const { code } = req.query;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (code && code !== 'null') {
            user.permissionCodes = user.permissionCodes.filter(c => c !== code);

            if (user.permissionCodes.length === 0) {
                await User.findByIdAndDelete(id);
                return res.json({ message: 'User deleted as they have no remaining permissions' });
            } else {
                await user.save();
                return res.json({ message: 'Permission code removed successfully' });
            }
        } else {
            // Fallback for safety
            await User.findByIdAndDelete(id);
            res.json({ message: 'User completely removed' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// ── Applications ───────────────────────────────────────────────────────────────

// Labs are shown as their lab group (e.g. "Labs - MECH"), everything else by its own label
const LAB_GROUP_LABELS = {
    labs_cse_cce: 'Labs - CSE/CCE',
    labs_ece_cce: 'Labs - ECE/CCE',
    labs_mech: 'Labs - MECH',
    labs_physics: 'Labs - Physics',
};

const departmentOf = (step) => (step.unitGroup && LAB_GROUP_LABELS[step.unitGroup])
    ? { key: step.unitGroup, name: LAB_GROUP_LABELS[step.unitGroup] }
    : { key: step.unitCode, name: step.unitLabel };

/** GET /api/admin/dashboard-stats */
async function getDashboardStats(req, res) {
    try {
        const [authorizedUsers, eligibleStudents, profilesCompleted, requestCounts, openSteps] = await Promise.all([
            User.countDocuments({ permissionCodes: { $elemMatch: { $ne: 'student' } } }),
            EligibleStudent.countDocuments(),
            EligibleStudent.countDocuments({ profileCompleted: true }),
            NoDuesRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            ClearanceStep.find({ status: { $in: ['pending', 'rejected'] } }, 'unitCode unitLabel unitGroup status').lean(),
        ]);

        const byStatus = Object.fromEntries(requestCounts.map(r => [r._id, r.count]));
        const completedApplications = byStatus.approved || 0;
        const onHoldApplications = byStatus.action_required || 0;
        const totalApplications = requestCounts.reduce((sum, r) => sum + r.count, 0);

        // Per-department queue sizes (pending = waiting for that department, onHold = put on hold by it)
        const overview = {};
        for (const step of openSteps) {
            const { key, name } = departmentOf(step);
            overview[key] = overview[key] || { code: key, name, pendingCount: 0, onHoldCount: 0 };
            if (step.status === 'pending') overview[key].pendingCount++;
            else overview[key].onHoldCount++;
        }
        const departmentOverview = Object.values(overview)
            .sort((a, b) => (b.pendingCount + b.onHoldCount) - (a.pendingCount + a.onHoldCount));

        res.json({
            authorizedUsers,
            eligibleStudents,
            profilesCompleted,
            totalApplications,
            activeApplications: totalApplications - completedApplications,
            onHoldApplications,
            completedApplications,
            departmentOverview,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/**
 * Builds one summary row per application (optionally filtered by status):
 * step progress, where it is pending and where/since when it is on hold.
 */
async function buildApplicationRows(filter = {}) {
    const requests = await NoDuesRequest.find(filter)
        .select('applicationNo studentName studentEmail rollNo branch status submittedAt completedAt createdAt')
        .sort({ createdAt: -1 })
        .lean();

    const steps = await ClearanceStep.find({ requestId: { $in: requests.map(r => r._id) } })
        .select('requestId unitCode unitLabel unitGroup status rejectionReason rejectedAt')
        .lean();

    const stepsByRequest = {};
    for (const s of steps) (stepsByRequest[String(s.requestId)] = stepsByRequest[String(s.requestId)] || []).push(s);

    return requests.map(r => {
        const reqSteps = stepsByRequest[String(r._id)] || [];
        // Collapse labs into their group so the list stays readable
        const pendingAt = [...new Set(reqSteps.filter(s => s.status === 'pending').map(s => departmentOf(s).name))];
        const held = reqSteps.filter(s => s.status === 'rejected');
        const onHoldAt = held.map(s => ({ name: s.unitLabel, reason: s.rejectionReason || '', since: s.rejectedAt || null }));
        const holdTimes = held.map(s => s.rejectedAt).filter(Boolean).map(d => new Date(d).getTime());
        const year = new Date(r.submittedAt || r.createdAt || Date.now()).getFullYear();
        return {
            ...r,
            applicationNo: r.applicationNo || `ND-${year}-${String(r.rollNo || '').toUpperCase()}`,
            approvedSteps: reqSteps.filter(s => s.status === 'approved').length,
            totalSteps: reqSteps.length,
            pendingAt,
            onHoldAt,
            onHoldSince: holdTimes.length ? new Date(Math.min(...holdTimes)) : null,
        };
    });
}

/** GET /api/admin/applications — one row per application with step progress */
async function listApplications(req, res) {
    try {
        res.json({ applications: await buildApplicationRows() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/**
 * GET /api/admin/dashboard-details/:type
 * The rows behind each dashboard card.
 * type: users | eligible | profiles | active | onhold | completed
 */
async function getDashboardDetails(req, res) {
    try {
        const { type } = req.params;

        if (type === 'users') {
            const users = await User.find({ permissionCodes: { $elemMatch: { $ne: 'student' } } })
                .select('name email permissionCodes createdAt')
                .sort({ createdAt: -1 })
                .lean();
            const rows = users.map(u => ({
                _id: u._id,
                name: u.name,
                email: u.email,
                roles: u.permissionCodes
                    .filter(c => c !== 'student')
                    .map(c => c === 'admin' ? 'Admin' : (LAB_GROUP_LABELS[c] || ALL_UNIT_CODES[c]?.label || c)),
                addedAt: u.createdAt,
            }));
            return res.json({ rows });
        }

        if (type === 'eligible' || type === 'profiles') {
            const query = type === 'profiles' ? { profileCompleted: true } : {};
            const [students, requests] = await Promise.all([
                EligibleStudent.find(query)
                    .select('name email rollNo branch profileCompleted createdAt updatedAt')
                    .sort(type === 'profiles' ? { updatedAt: -1 } : { createdAt: -1 })
                    .lean(),
                NoDuesRequest.find({}, 'studentEmail status submittedAt').lean(),
            ]);
            const requestByEmail = Object.fromEntries(requests.map(r => [r.studentEmail.toLowerCase(), r]));
            const rows = students.map(s => {
                const request = requestByEmail[s.email.toLowerCase()];
                return {
                    _id: s._id,
                    name: s.name,
                    email: s.email,
                    rollNo: s.rollNo,
                    branch: s.branch,
                    profileCompleted: Boolean(s.profileCompleted),
                    addedAt: s.createdAt,
                    profileSavedAt: s.updatedAt,
                    applicationStatus: request?.status || null,
                    appliedAt: request?.submittedAt || null,
                };
            });
            return res.json({ rows });
        }

        const STATUS_FILTER = {
            active: { status: { $ne: 'approved' } },
            onhold: { status: 'action_required' },
            completed: { status: 'approved' },
        };
        if (STATUS_FILTER[type]) {
            return res.json({ rows: await buildApplicationRows(STATUS_FILTER[type]) });
        }

        res.status(400).json({ error: `Unknown dashboard card: ${type}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

/** GET /api/admin/applications/:id — all steps of one application */
async function getApplicationDetails(req, res) {
    try {
        const request = await NoDuesRequest.findById(req.params.id)
            .select('applicationNo studentName studentEmail rollNo branch status submittedAt completedAt createdAt')
            .lean();
        if (!request) return res.status(404).json({ error: 'Application not found' });

        const steps = await ClearanceStep.find({ requestId: request._id })
            .select('unitCode unitLabel unitGroup status actionBy actionAt rejectionReason rejectionDescription')
            .lean();

        res.json({ application: request, steps });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    listEligibleStudents, addEligibleStudent, bulkAddEligibleStudents, bulkRemoveEligibleStudents, removeEligibleStudent, editEligibleStudent,
    listStaffAccess, addStaffAccess, updateStaffAccess, removeStaffAccess,
    getDashboardStats, getDashboardDetails, listApplications, getApplicationDetails,
};
