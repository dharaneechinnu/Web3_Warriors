const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const courseProgressController = require('../Controller/CourseProgressController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/assignments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.zip', '.txt'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: ' + allowedTypes.join(', ')));
    }
  }
});

// Get user progress for a specific course
router.get('/progress/:userId/:courseId', courseProgressController.getUserProgress);

// Update lecture progress
router.post('/updateLectureProgress', courseProgressController.updateLectureProgress);

// Quiz routes
router.get('/:courseId/quiz/:lectureId', courseProgressController.getQuiz);
router.post('/:courseId/quiz/:lectureId/submit', courseProgressController.submitQuiz);

// Article routes
router.get('/:courseId/article/:lectureId', courseProgressController.getArticle);

// Assignment routes
router.get('/:courseId/assignment/:lectureId', courseProgressController.getAssignment);
router.post('/:courseId/assignment/:lectureId/submit', upload.single('file'), courseProgressController.submitAssignment);

module.exports = router;