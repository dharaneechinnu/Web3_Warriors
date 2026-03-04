const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const RESUME_DIR = path.join('uploads', 'resumes');

// Ensure uploads/resumes directory exists at startup
fs.mkdirSync(RESUME_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, RESUME_DIR);
  },
  filename: (req, file, cb) => {
    const ext       = path.extname(file.originalname).toLowerCase();
    const userId    = req.userId || 'unknown';
    const timestamp = Date.now();
    cb(null, `resume_${userId}_${timestamp}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are accepted for resumes.'), false);
  }
};

const resumeUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

module.exports = resumeUpload;
