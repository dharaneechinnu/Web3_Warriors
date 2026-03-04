const express   = require('express');
const router    = express.Router();
const adminAuth = require('../MiddleWare/adminAuth');
const {
  getPendingMentors,
  getMentorApplicationById,
  approveMentor,
  rejectMentor,
  retriggerEvaluation,
} = require('../Controller/adminController');

// GET  /api/admin/mentors/pending          — list pending (or filtered) applications
// Query: ?status=pending|approved|rejected  ?page=1  ?limit=20
router.get('/mentors/pending', adminAuth, getPendingMentors);

// GET  /api/admin/mentors/:id              — full application detail for one mentor
router.get('/mentors/:id', adminAuth, getMentorApplicationById);

// PATCH /api/admin/mentor/:id/approve     — approve a pending application
router.patch('/mentor/:id/approve', adminAuth, approveMentor);

// PATCH /api/admin/mentor/:id/reject      — reject a pending application
router.patch('/mentor/:id/reject', adminAuth, rejectMentor);

// POST  /api/admin/mentor/:id/re-evaluate — re-trigger AI evaluation (e.g. after Ollama was down)
router.post('/mentor/:id/re-evaluate', adminAuth, retriggerEvaluation);

module.exports = router;
