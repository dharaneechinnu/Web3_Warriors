const MentorApplication = require('../Model/MentorApplication');

/**
 * Ensures the current authenticated user has an approved MentorApplication.
 * Attach this after the auth middleware on any route that should be restricted to
 * verified mentors (uploads, creating courses, adding lectures, etc.).
 */
module.exports = async (req, res, next) => {
  try {
    const userId = req.userId || (req.user && req.user._id);
    if (!userId) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const application = await MentorApplication.findOne({ userId });
    if (!application || application.mentorStatus !== 'approved') {
      return res.status(403).json({ success: false, message: 'Mentor verification required. Please submit an application or wait for approval.' });
    }

    next();
  } catch (err) {
    console.error('[ensureMentorApproved] error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
