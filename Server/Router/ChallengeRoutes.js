const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ctrl = require('../Controller/ChallengeController');

// Multer for challenge file submissions
const uploadDir = path.join(__dirname, '../uploads/challenges');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({
  limits: { fileSize: 600 * 1024 * 1024 }
});
// ─── MENTOR ───────────────────────────────────────────────────────────────────
router.post('/create', ctrl.createChallenge);
router.get('/mentor/:mentorId', ctrl.getMentorChallenges);
router.put('/update/:id', ctrl.updateChallenge);
router.delete('/delete/:id', ctrl.deleteChallenge);
router.patch('/status/:id', ctrl.updateStatus);           // publish / close
router.get('/:id/submissions', ctrl.getSubmissions);       // mentor views submissions
router.put('/:id/submissions/:submissionId/rank', ctrl.rankSubmission);
router.post('/:id/distribute-rewards', ctrl.distributeRewards);

// ─── LEARNER ──────────────────────────────────────────────────────────────────
router.get('/', ctrl.getChallenges);                       // all published
router.get('/:id', ctrl.getChallengeById);
router.post('/:id/join', ctrl.joinChallenge);
router.post('/:id/submit', upload.single('file'), ctrl.submitChallenge);
router.get('/:id/leaderboard', ctrl.getLeaderboard);
router.get('/:id/learner-status', ctrl.getLearnerStatus); // check join/submit status

module.exports = router;
