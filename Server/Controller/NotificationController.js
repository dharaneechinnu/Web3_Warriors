const notifService = require('../services/notificationService');

// GET /notifications — all notifications for the logged-in user
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const unreadOnly = req.query.unread === 'true';
        const limit = parseInt(req.query.limit) || 50;
        const notifications = await notifService.getUserNotifications(userId, { limit, unreadOnly });
        res.json({ success: true, notifications });
    } catch (err) {
        console.error('[NotificationCtrl] getMyNotifications error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

// GET /notifications/unread-count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const count = await notifService.getUnreadCount(userId);
        res.json({ success: true, count });
    } catch (err) {
        console.error('[NotificationCtrl] getUnreadCount error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
    }
};

// PATCH /notifications/read/:id
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const notification = await notifService.markAsRead(req.params.id, userId);
        if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
        res.json({ success: true, notification });
    } catch (err) {
        console.error('[NotificationCtrl] markAsRead error:', err);
        res.status(500).json({ success: false, message: 'Failed to mark as read' });
    }
};

// PATCH /notifications/read-all
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        await notifService.markAllAsRead(userId);
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        console.error('[NotificationCtrl] markAllAsRead error:', err);
        res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
};
