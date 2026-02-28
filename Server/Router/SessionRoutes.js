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
router.patch('/accept-request/:id', ctrl.acceptRequest);   // accept learner request + schedule
router.patch('/reject-request/:id', ctrl.rejectRequest);   // reject learner request

// ─── LEARNER ──────────────────────────────────────────────────────────────────
router.get('/learner/:learnerId', ctrl.getLearnerSessions);
router.post('/book/:id', ctrl.bookSession);
router.patch('/cancel/:id', ctrl.cancelSession);
router.post('/rate/:id', ctrl.rateSession);
router.post('/request', ctrl.sendRequest);                  // learner sends request

// ─── JOIN (both) ──────────────────────────────────────────────────────────────
router.get('/join/:id', ctrl.getJoinInfo);                  // get roomId for video call

// ─── SHARED ──────────────────────────────────────────────────────────────────
router.get('/', ctrl.getSessions);            // GET /sessions?mentorId=...&status=...
router.get('/:id', ctrl.getSessionById);

module.exports = router;
