/**
 * app.js — builds the Express application (no listening here; see server.js).
 * Order matters:
 *   1. helmet (security headers) and CORS (only the Vercel site and local dev may call the API;
 *      Content-Disposition is exposed so the browser can read download file names)
 *   2. JSON / form body parsing, then stripOperators(), which removes "$…" and dotted keys from
 *      body/query/params so client input can never become a MongoDB operator (NoSQL injection)
 *   3. API routes: /api/auth, /api/admin, /api/student, /api/clearance
 *   4. 404 handler and the global error handler (upload errors → 400; unexpected errors → a
 *      generic 500 so internal details are never sent to the browser)
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const clearanceRoutes = require('./routes/clearance');

const app = express();

// ── Security & Parsing ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://no-dues-gravity.vercel.app'
  ],
  credentials: true,
  exposedHeaders: ['Content-Disposition'], // lets the browser read download file names
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Block MongoDB operator injection: drop any "$…" or dotted keys from client input
// (e.g. ?unitCode[$ne]=x or { "email": { "$gt": "" } }) before it can reach a query.
function stripOperators(value) {
    if (Array.isArray(value)) return value.map(stripOperators);
    if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
        for (const key of Object.keys(value)) {
            if (key.startsWith('$') || key.includes('.')) {
                delete value[key];
                continue;
            }
            const had = value[key] && typeof value[key] === 'object' && Object.keys(value[key]).length > 0;
            value[key] = stripOperators(value[key]);
            // a field that only held operators (e.g. { $ne: x }) is dropped entirely
            if (had && !Array.isArray(value[key]) && Object.keys(value[key]).length === 0) delete value[key];
        }
    }
    return value;
}
app.use((req, _res, next) => {
    stripOperators(req.body);
    stripOperators(req.query);
    stripOperators(req.params);
    next();
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/clearance', clearanceRoutes);

// ── 404 Catch ─────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    // Upload problems (wrong file type, too large) and bad JSON are the client's to fix
    const status = err.status || err.statusCode || (err.name === 'MulterError' ? 400 : 500);
    if (status >= 500) console.error('Unhandled error:', err);
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (maximum 10 MB).' : err.message;
    res.status(status).json({ error: status >= 500 ? 'Internal server error' : message });
});

module.exports = app;
