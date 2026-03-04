const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../MiddleWare/AuthMiddleWare');
const mentorApplicationUpload = require('../MiddleWare/mentorApplicationUpload');
const {
  submitApplication,
  getMyApplication,
} = require('../Controller/mentorApplicationController');

// POST /mentor-application/apply
// Body (multipart/form-data):
//   text fields : name, skills, experience, achievements, githubUrl, linkedinUrl
//   file fields : resume (PDF, required), introVideo (mp4/mov/webm etc., optional)
router.post(
  '/apply',
  authMiddleware,
  mentorApplicationUpload.fields([
    { name: 'resume',     maxCount: 1 },
    { name: 'introVideo', maxCount: 1 },
  ]),
  submitApplication
);

// GET /mentor-application/my
// Returns the authenticated user's own application + AI evaluation result
router.get('/my', authMiddleware, getMyApplication);

module.exports = router;
