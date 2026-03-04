const express = require('express');
const router = express.Router();
const slotController = require('../Controller/SlotController');
const authMiddleware = require('../MiddleWare/AuthMiddleWare');

// ── CREATE SLOTS ────────────────────────────────────────────────────────────────
router.post('/mentor/:mentorId/create', authMiddleware, slotController.createSlots);

// ── GET AVAILABLE SLOTS FOR A MENTOR ────────────────────────────────────────────
router.get('/mentor/:mentorId/available', slotController.getAvailableSlots);

// ── GET ALL SLOTS FOR A MENTOR ──────────────────────────────────────────────────
router.get('/mentor/:mentorId/all', authMiddleware, slotController.getMentorSlots);

// ── BOOK A SLOT ────────────────────────────────────────────────────────────────
router.post('/book', authMiddleware, slotController.bookSlot);

// ── DELETE A SLOT ──────────────────────────────────────────────────────────────
router.delete('/:slotId', authMiddleware, slotController.deleteSlot);

module.exports = router;
