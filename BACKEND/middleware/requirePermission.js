/**
 * requirePermission.js — permission guards built on config/permissionCodes.js:
 * requirePermission(code) for whole routers (e.g. admin) and attachPermissionChecker, which gives
 * department handlers req.hasPermissionFor(unitCode) (details below).
 */

const { resolvePermittedUnitCodes } = require('../config/permissionCodes');

/**
 * Middleware factory: checks that the requesting staff member has permission
 * to act on the given unitCode.
 *
 * Admin (role === 'admin') is always permitted.
 * For staff, their permissionCodes are expanded (via resolvePermittedUnitCodes)
 * and checked against the required unitCode.
 *
 * Usage:
 *   router.post('/approve', verifyToken, requirePermission('medical'), controller)
 *
 *   For dynamic unitCode from route param or query:
 *   router.get('/pending', verifyToken, requirePermissionDynamic, controller)
 *   — in controller, call req.hasPermissionFor(unitCode) to check
 *
 * @param {string} unitCode
 */
function requirePermission(unitCode) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

        // Admin bypasses all permission checks
        if (req.user.role === 'admin') return next();

        const permitted = resolvePermittedUnitCodes(req.user.permissionCodes || []);

        if (permitted.has('*') || permitted.has(unitCode)) {
            return next();
        }

        return res.status(403).json({ error: 'Access denied. You do not have permission to access this section.' });
    };
}

/**
 * Middleware that attaches a hasPermissionFor(unitCode) helper to req.
 * Use this for routes where the unitCode comes from query/body.
 */
function attachPermissionChecker(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    if (req.user.role === 'admin') {
        req.hasPermissionFor = () => true;
        return next();
    }

    const permitted = resolvePermittedUnitCodes(req.user.permissionCodes || []);

    req.hasPermissionFor = (unitCode) => {
        return permitted.has('*') || permitted.has(unitCode);
    };

    // Also expose the set for bulk checks
    req.permittedUnitCodes = permitted;

    next();
}

module.exports = { requirePermission, attachPermissionChecker };
