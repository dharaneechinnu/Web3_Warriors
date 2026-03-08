const express = require('express');
const router = express.Router();
const slotController = require('../Controller/SlotController');
const authMiddleware = require('../MiddleWare/AuthMiddleWare');

// ── CREATE SLOTS ────────────────────────────────────────────────────────────────
router.post('/mentor/:mentorId/create', authMiddleware, slotController.createSlots);

// ── GET AVAILABLE SLOTS FOR A MENTOR ────────────────────────────────────────────
// Only returns non-expired slots (endTime > current time)
router.get('/mentor/:mentorId/available', slotController.getAvailableSlots);

// ── GET ALL SLOTS FOR A MENTOR ──────────────────────────────────────────────────
// Returns all slots including expired (for mentor dashboard)
router.get('/mentor/:mentorId/all', authMiddleware, slotController.getMentorSlots);

// ── BOOK A SLOT ────────────────────────────────────────────────────────────────
router.post('/book', authMiddleware, slotController.bookSlot);

// ── CLEANUP EXPIRED SLOTS (Optional cleanup endpoint) ────────────────────────────
// Can be called manually to delete all expired slots from database
router.delete('/cleanup/expired', authMiddleware, slotController.cleanupExpiredSlots);

// ── DELETE A SLOT ──────────────────────────────────────────────────────────────
router.delete('/:slotId', authMiddleware, slotController.deleteSlot);

module.exports = router;
