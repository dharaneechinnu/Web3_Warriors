const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'UsersLogins', required: true },
    type:      {
        type: String,
        enum: ['booking_request', 'booking_accepted', 'booking_rejected', 'session_completed',
               'session_cancelled', 'session_reminder', 'general'],
        required: true
    },
    title:     { type: String, required: true },
    message:   { type: String, required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
    isRead:    { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);
