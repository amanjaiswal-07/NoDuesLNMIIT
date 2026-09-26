/**
 * multer.js — file-upload middleware used by the student routes (profile documents,
 * reapply proof). Files stream straight to Cloudinary: PDFs as 'raw', images as 'image'.
 * Security limits: only real PDF / JPG / PNG files (MIME type AND extension must match),
 * at most 10 MB each and 10 files per request. Anything else is rejected with a 400.
 */

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary');

/**
 * PDF files MUST be uploaded with resource_type: 'raw' to Cloudinary.
 * Images use resource_type: 'image'.
 * We use a dynamic params function so the resource_type is set per file.
 */
const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        const isPdf = file.mimetype === 'application/pdf' ||
            file.originalname.toLowerCase().endsWith('.pdf');

        return {
            folder: 'nodues',
            resource_type: isPdf ? 'raw' : 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        };
    },
});

// Only PDFs and JPG/PNG images are accepted — checked by both type and extension
// before anything is sent to Cloudinary.
const ALLOWED = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
};
/**
 * Accepts only PDF / JPG / PNG files whose type and extension agree.
 */
function fileFilter(req, file, cb) {
    const name = (file.originalname || '').toLowerCase();
    const exts = ALLOWED[file.mimetype];
    if (exts && exts.some(ext => name.endsWith(ext))) return cb(null, true);
    const err = new Error('Only PDF, JPG or PNG files are allowed.');
    err.status = 400;
    cb(err);
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10 MB each, at most 10 per request
});

module.exports = upload;
