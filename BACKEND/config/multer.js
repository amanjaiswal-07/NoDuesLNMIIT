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
