/**
 * mentorApplicationUpload.js
 * Multer config that handles BOTH resume (PDF) and introVideo (mp4/mov/webm/avi)
 * in a single multipart/form-data request using upload.fields().
 *
 * Fields accepted:
 *   resume     — 1 PDF, max 10 MB  → uploads/resumes/
 *   introVideo — 1 video file, max 200 MB → uploads/intros/
 */
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const RESUME_DIR = path.join('uploads', 'resumes');
const INTRO_DIR  = path.join('uploads', 'intros');

// Ensure directories exist at startup
fs.mkdirSync(RESUME_DIR, { recursive: true });
fs.mkdirSync(INTRO_DIR,  { recursive: true });

console.log('[mentorApplicationUpload] Upload dirs ready →', RESUME_DIR, '|', INTRO_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`[multer:destination] fieldname="${file.fieldname}" originalname="${file.originalname}" mimetype="${file.mimetype}"`);
    if (file.fieldname === 'resume') {
      cb(null, RESUME_DIR);
    } else if (file.fieldname === 'introVideo') {
      cb(null, INTRO_DIR);
    } else {
      cb(new Error(`Unexpected field: ${file.fieldname}`), null);
    }
  },

  filename: (req, file, cb) => {
    const ext       = path.extname(file.originalname).toLowerCase();
    const userId    = req.userId || 'unknown';
    const timestamp = Date.now();
    const name      = file.fieldname === 'resume'
      ? `resume_${userId}_${timestamp}${ext}`
      : `intro_${userId}_${timestamp}${ext}`;
    console.log(`[multer:filename] saving as "${name}"`);
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  console.log(`[multer:fileFilter] checking field="${file.fieldname}" mime="${file.mimetype}" ext="${path.extname(file.originalname)}"`);

  if (file.fieldname === 'resume') {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      console.log('[multer:fileFilter] ✅ resume accepted');
      cb(null, true);
    } else {
      console.warn('[multer:fileFilter] ❌ resume rejected — not a PDF');
      cb(new Error('Only PDF files are accepted for resumes.'), false);
    }

  } else if (file.fieldname === 'introVideo') {
    const ALLOWED_VIDEO_TYPES = /mp4|mov|mkv|avi|webm|flv/i;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (ALLOWED_VIDEO_TYPES.test(ext)) {
      console.log('[multer:fileFilter] ✅ introVideo accepted');
      cb(null, true);
    } else {
      console.warn(`[multer:fileFilter] ❌ introVideo rejected — unsupported extension ".${ext}"`);
      cb(new Error('Only MP4, MOV, MKV, AVI, WEBM, FLV videos are accepted for intro video.'), false);
    }

  } else {
    cb(new Error(`Unknown field: ${file.fieldname}`), false);
  }
};

const mentorApplicationUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB (covers both resume and video)
  },
});

/**
 * Use this in the route:
 *   mentorApplicationUpload.fields([
 *     { name: 'resume',     maxCount: 1 },
 *     { name: 'introVideo', maxCount: 1 },
 *   ])
 */
module.exports = mentorApplicationUpload;
