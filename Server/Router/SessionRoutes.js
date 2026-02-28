const express = require('express');
const router = express.Router();
const ctrl = require('../Controller/SessionController');

// ─── MENTOR ───────────────────────────────────────────────────────────────────
router.post('/create', ctrl.createSession);
router.get('/mentor/:mentorId', ctrl.getMentorSessions);
router.put('/update/:id', ctrl.updateSession);
router.patch('/accept/:id', ctrl.acceptBooking);
router.patch('/reject/:id', ctrl.rejectBooking);
router.patch('/complete/:id', ctrl.completeSession);

// ─── LEARNER ──────────────────────────────────────────────────────────────────
router.get('/learner/:learnerId', ctrl.getLearnerSessions);
router.post('/book/:id', ctrl.bookSession);
router.patch('/cancel/:id', ctrl.cancelSession);
router.post('/rate/:id', ctrl.rateSession);

// ─── SHARED ──────────────────────────────────────────────────────────────────
router.get('/', ctrl.getSessions);            // GET /sessions?mentorId=...&status=...
router.get('/:id', ctrl.getSessionById);

module.exports = router;
