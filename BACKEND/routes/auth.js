/**
 * auth.js routes — /api/auth
 *   POST /google  exchange a Google credential for our JWT (public)
 *   GET  /me      current user (token required)
 */

const express = require('express');
const router = express.Router();
const { googleLogin, getMe } = require('../controllers/auth.controller');
const verifyToken = require('../middleware/verifyToken');

// POST /api/auth/google  — exchange Google credential for JWT
router.post('/google', googleLogin);

// GET /api/auth/me  — returns current user from JWT
router.get('/me', verifyToken, getMe);

module.exports = router;
