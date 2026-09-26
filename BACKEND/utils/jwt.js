/**
 * jwt.js — signs and verifies our own login tokens (JSON Web Tokens) with JWT_SECRET.
 * The secret must be long and random: anyone who knows it could forge an admin token. A warning is
 * logged at startup when it is shorter than 32 characters.
 */

const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRY = process.env.JWT_EXPIRY || '15h';

// A short or guessable secret would let anyone forge an admin token
if (!SECRET || SECRET.length < 32) {
    console.warn('⚠ SECURITY: JWT_SECRET is missing or shorter than 32 characters. Set a long random value.');
}

/**
 * Signs a JWT.
 * @param {object} payload - { id, email, role, permissionCodes, redirectRoute }
 * @returns {string} token
 */
function signToken(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

/**
 * Verifies and decodes a JWT.
 * @param {string} token
 * @returns {object} decoded payload
 * @throws if invalid/expired
 */
function verifyToken(token) {
    return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
