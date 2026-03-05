/**
 * web3Routes.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Mounted at: /web3
 *
 * Admin-only routes (adminAuth middleware):
 *   POST  /web3/course/create
 *   POST  /web3/course/mint-certificate
 *   POST  /web3/challenge/create
 *   POST  /web3/challenge/declare-winners
 *   POST  /web3/mentor/mint-badge
 *   GET   /web3/platform/balance
 *
 * Authenticated-user routes (authMiddleware):
 *   POST  /web3/course/buy
 *   POST  /web3/challenge/join
 *   GET   /web3/course/:courseId/purchased?learnerAddress=0x…
 *   GET   /web3/challenge/:challengeId/joined?participantAddress=0x…
 */

const express      = require('express');
const router       = express.Router();
const authMiddleware = require('../MiddleWare/AuthMiddleWare');
const adminAuth    = require('../MiddleWare/adminAuth');
const ctrl         = require('../Controller/web3Controller');

// ── Course routes ─────────────────────────────────────────────────────────────
router.post('/course/create',           adminAuth, ctrl.createCourse);
router.post('/course/buy',              authMiddleware, ctrl.buyCourse);
router.post('/course/mint-certificate', adminAuth, ctrl.mintCourseCertificate);
router.get ('/course/:courseId/purchased', authMiddleware, ctrl.checkCoursePurchased);

// ── Challenge routes ──────────────────────────────────────────────────────────
router.post('/challenge/create',          adminAuth, ctrl.createChallenge);
router.post('/challenge/join',            authMiddleware, ctrl.joinChallenge);
router.post('/challenge/declare-winners', adminAuth, ctrl.declareWinners);
router.get ('/challenge/:challengeId/joined', authMiddleware, ctrl.checkChallengeJoined);

// ── Mentor badge ──────────────────────────────────────────────────────────────
router.post('/mentor/mint-badge', adminAuth, ctrl.mintMentorBadge);

// ── Platform info ─────────────────────────────────────────────────────────────
router.get('/platform/balance', adminAuth, ctrl.getPlatformBalance);

module.exports = router;
