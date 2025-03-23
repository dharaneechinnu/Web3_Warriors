const multer = require('multer');
const path = require('path');

// Define storage configurations for images and videos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'image' || file.fieldname === 'thumbnail') {
            cb(null, 'uploads/images/');
        } else if (file.fieldname === 'video') {
            cb(null, 'uploads/videos/');
        } else {
            cb(new Error('Invalid file type'), false);
        }
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = Date.now() + ext;
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
