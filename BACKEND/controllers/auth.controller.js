/**
 * auth.controller.js — Google sign-in.
 * POST /api/auth/google receives the Google ID token plus the role picked on the login page:
 *   • student → must be on the EligibleStudent list; a User record with the 'student' code is
 *     created/updated and a token with role 'student' is issued (redirect /student)
 *   • staff/admin → the User must already hold the selected permission code (added by an admin
 *     or by that department's staff); the token's redirectRoute comes from PERMISSION_TO_ROUTE
 * GET /api/auth/me returns the signed-in user. Permissions inside the token are informational
 * only — middleware/verifyToken.js re-reads them from the database on every request.
 */

const { verifyGoogleToken } = require('../utils/googleAuth');
const { signToken } = require('../utils/jwt');
const User = require('../models/User');
const EligibleStudent = require('../models/EligibleStudent');
const { PERMISSION_TO_ROUTE } = require('../config/permissionCodes');

/**
 * Derive graduation from roll number.
 * e.g. 23UEC513 → contains 'U' → "UG"
 *      23PEC513 → contains 'P' → "PG"
 */
function deriveGraduation(rollNo) {
    const upper = (rollNo || '').toUpperCase();
    if (upper.includes('U')) return 'UG';
    if (upper.includes('P')) return 'PG';
    return '';
}

/**
 * POST /api/auth/google
 * Body: { credential: "<google_id_token>", selectedRole: "student" | ... }
 */
async function googleLogin(req, res) {
    try {
        const { credential, selectedRole } = req.body;
        if (!credential || !selectedRole) {
            return res.status(400).json({ error: 'Missing Google credential or selected role' });
        }

        // 1. Verify Google token
        const { email, name } = await verifyGoogleToken(credential);
        const normalizedEmail = email.toLowerCase();

        // ── STUDENT LOGIN ──────────────────────────────────────────────────────
        if (selectedRole === 'student') {
            // Verify student is eligible
            const eligibleStudent = await EligibleStudent.findOne({ email: normalizedEmail });
            if (!eligibleStudent) {
                return res.status(403).json({
                    error: 'Access denied. You are not on the Eligible Students list.',
                });
            }

            // Ensure graduation is stored in EligibleStudent (computed from rollNo once)
            if (!eligibleStudent.graduation) {
                eligibleStudent.graduation = deriveGraduation(eligibleStudent.rollNo);
                await eligibleStudent.save();
            }

            // Sync User document for auth/permissions only (NO studentProfile)
            let user = await User.findOne({ email: normalizedEmail });
            if (!user) {
                user = new User({
                    name: eligibleStudent.name,
                    email: normalizedEmail,
                    permissionCodes: ['student'],
                });
                await user.save();
            } else {
                if (!user.permissionCodes.includes('student')) {
                    user.permissionCodes.push('student');
                    await user.save();
                }
            }

            const token = signToken({
                id: user._id,
                email: user.email,
                name: user.name,
                role: 'student',
                rollNo: eligibleStudent.rollNo,
                branch: eligibleStudent.branch,
                permissionCodes: user.permissionCodes,
                redirectRoute: '/student',
            });

            return res.json({
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: 'student',
                    rollNo: eligibleStudent.rollNo,
                    branch: eligibleStudent.branch,
                    permissionCodes: user.permissionCodes,
                    redirectRoute: '/student',
                },
            });
        }

        // ── STAFF / ADMIN LOGIN ────────────────────────────────────────────────
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(403).json({
                error: 'Access denied. You do not have permission to access this section.',
            });
        }

        if (!user.permissionCodes.includes(selectedRole)) {
            return res.status(403).json({
                error: 'Access denied. You do not have permission to access this section.',
            });
        }

        const permissionCodes = user.permissionCodes || [];
        const redirectRoute = PERMISSION_TO_ROUTE[selectedRole] || '/';

        const token = signToken({
            id: user._id,
            email: user.email,
            name: user.name,
            permissionCodes,
            redirectRoute,
        });

        return res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                permissionCodes,
                redirectRoute,
            },
        });

    } catch (err) {
        console.error('Google login error:', err);
        if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token')) {
            return res.status(401).json({ error: 'Invalid Google token' });
        }
        res.status(500).json({ error: 'Authentication failed' });
    }
}

/** GET /api/auth/me — Returns current logged-in user info from JWT */
function getMe(req, res) {
    res.json({ user: req.user });
}

module.exports = { googleLogin, getMe };
