const express = require("express");
const router = express.Router();
const { getUserProfile, updateUserProfile, getUserDashboard } = require("../Controller/userController");

// Routes
router.get("/:id", getUserProfile); // Get user profile
router.put("/profile/:userId", updateUserProfile); // FIXED: Use `id` instead of `userId`
router.get("/dashboard/:id", getUserDashboard); // Get dashboard data

module.exports = router;
