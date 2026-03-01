import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../config';
import api from '../services/api';
import io from 'socket.io-client';

const NotificationContext = createContext(null);

// ── Notification type → icon + color mapping ──────────────────────────────────
const NOTIF_META = {
  booking_request:   { icon: '📩', color: '#f59e0b', label: 'Session Request' },
  booking_accepted:  { icon: '✅', color: '#22c55e', label: 'Session Confirmed' },
  booking_rejected:  { icon: '❌', color: '#ef4444', label: 'Session Declined' },
  session_completed: { icon: '🎉', color: '#06b6d4', label: 'Session Complete' },
  session_cancelled: { icon: '🚫', color: '#ef4444', label: 'Session Cancelled' },
  session_reminder:  { icon: '⏰', color: '#f59e0b', label: 'Reminder' },
  course_enrolled:   { icon: '📚', color: '#8b5cf6', label: 'Enrollment' },
  course_completed:  { icon: '🎓', color: '#22c55e', label: 'Course Complete' },
  submission_graded: { icon: '📝', color: '#06b6d4', label: 'Graded' },
  submission_received:{ icon: '📥', color: '#8b5cf6', label: 'Submission' },
  assignment_due:    { icon: '📋', color: '#f59e0b', label: 'Due Soon' },
  challenge_new:     { icon: '🏆', color: '#d946ef', label: 'New Challenge' },
  challenge_submission:{ icon: '📤', color: '#8b5cf6', label: 'Challenge Sub.' },
  challenge_ranked:  { icon: '🥇', color: '#f59e0b', label: 'Ranked' },
  challenge_reward:  { icon: '💰', color: '#22c55e', label: 'Reward' },
  achievement:       { icon: '⭐', color: '#f59e0b', label: 'Achievement' },
  announcement:      { icon: '📢', color: '#06b6d4', label: 'Announcement' },
  general:           { icon: '🔔', color: '#94a3b8', label: 'Notification' },
};

export const getNotifMeta = (type) => NOTIF_META[type] || NOTIF_META.general;

// ── Notification type → navigation route ──────────────────────────────────────
const getNotificationRoute = (notif) => {
  const role = localStorage.getItem('userRole') || 'learner';
  switch (notif.type) {
    case 'booking_request':      return '/mentor/sessions';
    case 'booking_accepted':     return '/sessions';
    case 'booking_rejected':     return '/sessions';
    case 'session_reminder':     return role === 'mentor' ? '/mentor/sessions' : '/sessions';
    case 'session_completed':    return role === 'mentor' ? '/mentor/sessions' : '/sessions';
    case 'session_cancelled':    return role === 'mentor' ? '/mentor/sessions' : '/sessions';
    case 'course_enrolled':      return '/learner-dashboard';
    case 'course_completed':     return '/learner-dashboard';
    case 'submission_graded':    return '/submissions';
    case 'submission_received':  return role === 'mentor' ? '/mentor/submissions' : '/submissions';
    case 'challenge_new':        return '/challenges';
    case 'challenge_submission': return '/mentor/challenges';
    case 'challenge_ranked':     return '/challenges';
    case 'challenge_reward':     return '/wallet';
    default:                     return null;
  }
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const socketRef = useRef(null);

  // ── Fetch notifications from API ──────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get('/notifications', { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setNotifications(res.data.notifications || []);
    } catch {
      // non-critical
    }
  }, []);

  // ── Mark single notification as read ──────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    const token = localStorage.getItem('token');
    try {
      await api.patch(`/notifications/read/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* ignore */ }
  }, []);

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      await api.patch('/notifications/read-all', {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  }, []);

  // ── Show an in-app toast ──────────────────────────────────────────────────
  const showToast = useCallback((notification) => {
    const id = ++toastIdRef.current;
    const meta = getNotifMeta(notification.type);
    const toast = {
      id,
      ...notification,
      meta,
      route: getNotificationRoute(notification),
      createdAt: notification.createdAt || new Date().toISOString(),
    };
    setToasts(prev => [toast, ...prev].slice(0, 5)); // keep max 5 toasts

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, []);

  // ── Dismiss a toast ───────────────────────────────────────────────────────
  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Chrome / Browser push notification ────────────────────────────────────
  const showBrowserNotification = useCallback((notif) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      const meta = getNotifMeta(notif.type);
      const n = new Notification(notif.title || 'New Notification', {
        body: notif.message || '',
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: notif._id || `notif-${Date.now()}`,
        requireInteraction: false,
        silent: false,
      });
      n.onclick = () => {
        window.focus();
        const route = getNotificationRoute(notif);
        if (route) window.location.href = route;
        n.close();
      };
      // Auto-close after 8 seconds
      setTimeout(() => n.close(), 8000);
    } catch (e) {
      console.warn('[NotificationCtx] Browser notification failed:', e);
    }
  }, []);

  // ── Request permission on auth ────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [isAuthenticated]);

  // ── Fetch on mount + poll every 30s ───────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [isAuthenticated, fetchNotifications]);

  // ── Socket.IO real-time listener ──────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.emit('join-notifications', userId);

    socket.on('new-notification', (notif) => {
      // Add to in-app list
      setNotifications(prev => [notif, ...prev]);
      // Show toast
      showToast(notif);
      // Show browser notification
      showBrowserNotification(notif);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, showToast, showBrowserNotification]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const value = {
    notifications,
    unreadCount,
    toasts,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    showToast,
    dismissToast,
    getNotificationRoute,
    getNotifMeta,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export default NotificationContext;
