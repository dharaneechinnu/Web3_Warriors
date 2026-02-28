const Notification = require('../Model/NotificationModel');

/**
 * Create an in-app notification and return it.
 * Also emits a socket event if io is available.
 */
exports.createNotification = async ({ userId, type, title, message, sessionId }, io) => {
    try {
        const notification = await Notification.create({
            userId, type, title, message, sessionId
        });

        // Real-time push via Socket.IO if available
        if (io) {
            io.to(`user_${userId}`).emit('new-notification', {
                _id: notification._id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                sessionId: notification.sessionId,
                isRead: false,
                createdAt: notification.createdAt
            });
        }

        return notification;
    } catch (err) {
        console.error('[Notification] Failed to create:', err.message);
        return null;
    }
};

/**
 * Get all notifications for a user, newest first.
 */
exports.getUserNotifications = async (userId, { limit = 50, unreadOnly = false } = {}) => {
    const filter = { userId };
    if (unreadOnly) filter.isRead = false;
    return Notification.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
};

/**
 * Mark one notification as read.
 */
exports.markAsRead = async (notificationId, userId) => {
    return Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
    );
};

/**
 * Mark ALL notifications as read for a user.
 */
exports.markAllAsRead = async (userId) => {
    return Notification.updateMany({ userId, isRead: false }, { isRead: true });
};

/**
 * Get unread count.
 */
exports.getUnreadCount = async (userId) => {
    return Notification.countDocuments({ userId, isRead: false });
};
