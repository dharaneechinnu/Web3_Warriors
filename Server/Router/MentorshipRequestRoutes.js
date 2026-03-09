const express = require('express');
const router = express.Router();
const mentorshipController = require('../Controller/MentorshipController');
const authMiddleware = require('../MiddleWare/AuthMiddleWare');

// ── LEARNER SENDS REQUEST ──────────────────────────────────────────────────────
router.post('/:learnerId/send-request', authMiddleware, mentorshipController.sendMentorshipRequest);

// ── GET PENDING REQUESTS FOR MENTOR ────────────────────────────────────────────
router.get('/mentor/:mentorId/pending', authMiddleware, mentorshipController.getPendingRequests);

// ── GET ALL REQUESTS FOR MENTOR ────────────────────────────────────────────────
router.get('/mentor/:mentorId/all', authMiddleware, mentorshipController.getMentorRequests);

// ── MENTOR ACCEPTS REQUEST ────────────────────────────────────────────────────
router.patch('/:requestId/accept', authMiddleware, mentorshipController.acceptMentorshipRequest);

// ── MENTOR REJECTS REQUEST ────────────────────────────────────────────────────
router.patch('/:requestId/reject', authMiddleware, mentorshipController.rejectMentorshipRequest);

// ── GET LEARNER'S REQUESTS ────────────────────────────────────────────────────
router.get('/learner/:learnerId/requests', authMiddleware, mentorshipController.getLearnerRequests);

// ── CONFIRM ON-CHAIN PAYMENT (Web3) ──────────────────────────────────────────
// Called by frontend after MetaMask bookSession() tx succeeds
router.post('/:requestId/confirm-payment', authMiddleware, mentorshipController.confirmOnChainPayment);

module.exports = router;
