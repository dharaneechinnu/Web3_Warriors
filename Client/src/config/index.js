/**
 * Centralized Client Configuration
 * ─────────────────────────────────
 * Change API_BASE_URL / SOCKET_URL / CLIENT_URL here once —
 * every file in the app imports from this single source of truth.
 *
 * In production you can override via environment variables:
 *   REACT_APP_API_BASE_URL   → backend REST base
 *   REACT_APP_SOCKET_URL     → Socket.IO endpoint
 *   REACT_APP_CLIENT_URL     → frontend origin (used by server emails etc.)
 */

// ── Backend API ───────────────────────────────────────────────
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3500';

// ── Socket.IO endpoint (usually same as API) ─────────────────
export const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL || API_BASE_URL;

// ── Client / Frontend origin ──────────────────────────────────
export const CLIENT_URL =
  process.env.REACT_APP_CLIENT_URL || 'http://localhost:3000';

// ── Handy helpers ─────────────────────────────────────────────

/** Build a full asset URL from a relative server path */
export const assetUrl = (relativePath) => {
  if (!relativePath) return '';
  if (/^https?:\/\//i.test(relativePath)) return relativePath;          // already absolute
  const clean = relativePath.replace(/\\/g, '/');
  return `${API_BASE_URL}${clean.startsWith('/') ? '' : '/'}${clean}`;
};
