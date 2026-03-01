const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'UsersLogins', required: true },
    type:      {
        type: String,
        enum: [
            // Session / Booking
            'booking_request', 'booking_accepted', 'booking_rejected',
            'session_completed', 'session_cancelled', 'session_reminder',
            // Courses
            'course_enrolled', 'course_completed',
            // Assignments & Submissions
            'submission_graded', 'submission_received', 'assignment_due',
            // Challenges
            'challenge_new', 'challenge_submission', 'challenge_ranked', 'challenge_reward',
            // System
            'general', 'announcement', 'achievement'
        ],
        required: true
    },
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
    metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },   // flexible extra data (courseId, challengeId, url, etc.)
    isRead:    { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
