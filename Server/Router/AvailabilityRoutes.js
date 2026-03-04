const express = require('express');
const router = express.Router();
const availabilityController = require('../Controller/AvailabilityController');
const authMiddleware = require('../MiddleWare/AuthMiddleWare');

// ── SET/UPDATE AVAILABILITY ────────────────────────────────────────────────────
router.post('/:mentorId/availability', authMiddleware, availabilityController.setAvailability);

// ── GET AVAILABILITIES ────────────────────────────────────────────────────────
router.get('/:mentorId/availability', availabilityController.getAvailabilities);

// ── DELETE AVAILABILITY ────────────────────────────────────────────────────────
router.delete('/availability/:availabilityId', authMiddleware, availabilityController.deleteAvailability);

// ── GENERATE SLOTS ────────────────────────────────────────────────────────────
router.post('/:mentorId/generate-slots', authMiddleware, availabilityController.generateSlots);

// ── GET AVAILABLE SLOTS ────────────────────────────────────────────────────────
router.get('/:mentorId/available-slots', availabilityController.getAvailableSlots);

module.exports = router;
