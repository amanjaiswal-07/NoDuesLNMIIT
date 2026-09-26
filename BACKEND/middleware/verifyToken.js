const { verifyToken: verify } = require('../utils/jwt');
const User = require('../models/User');
const EligibleStudent = require('../models/EligibleStudent');

/**
 * Middleware: extracts JWT from Authorization header, verifies it,
 * and attaches decoded user to req.user.
 *
 * Permissions are re-read from the database on every request, so access that an
 * admin removes (or a student taken off the eligible list) stops working at once
 * instead of lasting until the token expires.
 */
async function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
        decoded = verify(token);
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    try {
        const user = await verifyToken.loadUser(decoded.id);
        if (!user || (user.email || '').toLowerCase() !== (decoded.email || '').toLowerCase()) {
            return res.status(401).json({ error: 'Your access has been removed. Please sign in again.' });
        }

        const permissionCodes = user.permissionCodes || [];
        if (decoded.role === 'student') {
            const stillEligible = permissionCodes.includes('student')
                && await verifyToken.isEligibleStudent(user.email.toLowerCase());
            if (!stillEligible) {
                return res.status(401).json({ error: 'Your access has been removed. Please sign in again.' });
            }
        }

        req.user = { ...decoded, permissionCodes };
        next();
    } catch (err) {
        console.error('verifyToken lookup failed:', err.message);
        return res.status(500).json({ error: 'Could not verify your session. Please try again.' });
    }
}

// Database lookups (kept separate so tests can replace them)
verifyToken.loadUser = (id) => User.findById(id).select('email permissionCodes').lean();
verifyToken.isEligibleStudent = async (email) => Boolean(await EligibleStudent.exists({ email }));

module.exports = verifyToken;
