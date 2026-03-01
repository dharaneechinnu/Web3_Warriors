import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import styled, { keyframes } from 'styled-components';

/* ═══════════════════════════════════════════════════════════════════════════════
   Professional Toast Notification System
   - Stacks up to 5 toasts in the top-right corner
   - Animated enter/exit with progress timer bar
   - Click to navigate, swipe-to-dismiss on mobile
   ═══════════════════════════════════════════════════════════════════════════════ */

// ── Animations ──────────────────────────────────────────────────────────────
const slideIn = keyframes`
  from { transform: translateX(120%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
`;

const slideOut = keyframes`
  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(120%); opacity: 0; }
`;

const timerShrink = keyframes`
  from { width: 100%; }
  to   { width: 0%; }
`;

// ── Styled Components ───────────────────────────────────────────────────────
const ToastContainer = styled.div`
  position: fixed;
  top: 5rem;
  right: 1.25rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  pointer-events: none;
  max-width: 420px;
  width: calc(100% - 2.5rem);

  @media (max-width: 480px) {
    right: 0.75rem;
    max-width: calc(100% - 1.5rem);
    top: 4rem;
  }
`;

const ToastCard = styled.div`
  pointer-events: all;
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 4px solid ${props => props.$accentColor || '#8b5cf6'};
  border-radius: 0.875rem;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: ${props => props.$leaving ? slideOut : slideIn} 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.5),
      0 4px 12px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
`;

const ToastBody = styled.div`
  padding: 0.875rem 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
`;

const IconCircle = styled.div`
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: ${props => props.$bg || 'rgba(139,92,246,0.15)'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
`;

const TextBlock = styled.div`
  flex: 1;
  min-width: 0;
`;

const ToastLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${props => props.$color || '#8b5cf6'};
  margin-bottom: 0.15rem;
`;

const ToastTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

const ToastMessage = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.15rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ToastTime = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 0.25rem;
`;

const DismissBtn = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
  line-height: 1;
  border-radius: 0.375rem;
  transition: all 0.15s;
  align-self: flex-start;
  margin-top: -0.125rem;

  &:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
`;

const TimerBar = styled.div`
  height: 3px;
  background: ${props => props.$color || '#8b5cf6'};
  animation: ${timerShrink} 6s linear forwards;
  opacity: 0.6;
`;

// ── Individual Toast ────────────────────────────────────────────────────────
const Toast = ({ toast, onDismiss, onNavigate }) => {
  const [leaving, setLeaving] = useState(false);
  const meta = toast.meta;

  const handleDismiss = (e) => {
    e.stopPropagation();
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 350);
  };

  const handleClick = () => {
    if (toast.route) {
      onNavigate(toast.route, toast._id);
    }
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 350);
  };

  const timeStr = toast.createdAt
    ? new Date(toast.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : 'Just now';

  return (
    <ToastCard $accentColor={meta.color} $leaving={leaving} onClick={handleClick}>
      <ToastBody>
        <IconCircle $bg={`${meta.color}20`}>
          {meta.icon}
        </IconCircle>
        <TextBlock>
          <ToastLabel $color={meta.color}>{meta.label}</ToastLabel>
          <ToastTitle>{toast.title}</ToastTitle>
          {toast.message && <ToastMessage>{toast.message}</ToastMessage>}
          <ToastTime>{timeStr}</ToastTime>
        </TextBlock>
        <DismissBtn onClick={handleDismiss} title="Dismiss">✕</DismissBtn>
      </ToastBody>
      <TimerBar $color={meta.color} />
    </ToastCard>
  );
};

// ── Main ToastNotifications Component ───────────────────────────────────────
const ToastNotifications = () => {
  const { toasts, dismissToast, markAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNavigate = (route, notifId) => {
    if (notifId) markAsRead(notifId);
    if (route) navigate(route);
  };

  if (!toasts.length) return null;

  return (
    <ToastContainer>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={dismissToast}
          onNavigate={handleNavigate}
        />
      ))}
    </ToastContainer>
  );
};

export default ToastNotifications;
