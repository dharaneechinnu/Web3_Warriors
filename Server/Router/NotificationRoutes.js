const express = require('express');
const router = express.Router();
const auth = require('../MiddleWare/AuthMiddleWare');
const ctrl = require('../Controller/NotificationController');

// All routes require authentication
router.use(auth);

router.get('/',            ctrl.getMyNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.patch('/read/:id',  ctrl.markAsRead);
router.patch('/read-all',  ctrl.markAllAsRead);

module.exports = router;
