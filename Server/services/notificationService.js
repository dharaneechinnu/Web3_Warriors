const Notification = require('../Model/NotificationModel');

/**
 * Create an in-app notification and return it.
 * Also emits a socket event if io is available.
 */
exports.createNotification = async ({ userId, type, title, message, sessionId, metadata }, io) => {
    try {
        const notification = await Notification.create({
            userId, type, title, message, sessionId, metadata: metadata || {}
        });

        const payload = {
            _id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            sessionId: notification.sessionId,
            metadata: notification.metadata,
            isRead: false,
            createdAt: notification.createdAt
        };

        // Real-time push via Socket.IO if available
        if (io) {
            io.to(`user_${userId}`).emit('new-notification', payload);
        }

        return notification;
    } catch (err) {
        console.error('[Notification] Failed to create:', err.message);
        return null;
    }
};

/**
 * Notify multiple users at once.
 */
exports.createBulkNotifications = async (userIds, { type, title, message, sessionId, metadata }, io) => {
    try {
        const docs = userIds.map(uid => ({ userId: uid, type, title, message, sessionId, metadata: metadata || {} }));
        const notifications = await Notification.insertMany(docs);

        if (io) {
            notifications.forEach(n => {
                io.to(`user_${n.userId}`).emit('new-notification', {
                    _id: n._id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    sessionId: n.sessionId,
                    metadata: n.metadata,
                    isRead: false,
                    createdAt: n.createdAt
                });
            });
        }

        return notifications;
    } catch (err) {
        console.error('[Notification] Bulk create failed:', err.message);
        return [];
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
