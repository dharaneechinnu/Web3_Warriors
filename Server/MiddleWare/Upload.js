const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directory exists
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Define storage configurations for images and videos with mentor-specific folders
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const mentorId = req.body.mentorId;
        if (!mentorId) {
            return cb(new Error('Mentor ID is required'), false);
        }

        let uploadPath;
        if (file.fieldname === 'image' || file.fieldname === 'thumbnail') {
            uploadPath = path.join('uploads', 'mentors', mentorId, 'images');
        } else if (file.fieldname === 'video') {
            uploadPath = path.join('uploads', 'mentors', mentorId, 'videos');
        } else {
            return cb(new Error('Invalid file type'), false);
        }

        // Ensure the directory exists
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const mentorId = req.body.mentorId;
        const courseTitle = req.body.title ? req.body.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'untitled';
        const timestamp = Date.now();
        const filename = `${mentorId}_${courseTitle}_${file.fieldname}_${timestamp}${ext}`;
        cb(null, filename);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = ['.png', '.jpg', '.jpeg', '.gif','.webp'];
    const allowedVideoTypes = ['.mp4', '.mkv', '.avi'];

    const ext = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === 'image' || file.fieldname === 'thumbnail') {
        if (allowedImageTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    } else if (file.fieldname === 'video') {
        if (allowedVideoTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'), false);
        }
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

// Initialize upload middleware with storage and file filter
const upload = multer({ storage, fileFilter });

module.exports = upload;
