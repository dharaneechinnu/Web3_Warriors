const express = require("express");
const router = express.Router();
const authMiddleware = require("../MiddleWare/AuthMiddleWare");
const { 
  getUserProfile, 
  updateUserProfile, 
  getUserDashboard,
  addEducation,
  getUserCertifications,
  addRating,
  getUserRatings
} = require("../Controller/userController");

// Routes
router.get("/:id", getUserProfile); // Get user profile
router.put("/profile/:userId", updateUserProfile); // Update profile
router.get("/dashboard/:id", getUserDashboard); // Get dashboard data
router.post("/profile/:userId/education", addEducation); // Add education
router.get("/:userId/certifications", getUserCertifications); // Get certifications
router.post("/:userId/ratings", authMiddleware, addRating); // Add rating (requires auth)
router.get("/:userId/ratings", getUserRatings); // Get ratings

module.exports = router;
