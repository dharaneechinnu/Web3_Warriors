/**
 * Centralized Server Configuration
 * ─────────────────────────────────
 * Single source of truth for all URLs and ports.
 * Override via .env for different environments (dev / staging / prod).
 *
 *   PORT              → Express listen port
 *   CLIENT_URL        → Frontend origin  (for emails, CORS, etc.)
 *   SERVER_URL        → Backend self-reference
 *   MONGODB           → Mongo connection string
 */
require('dotenv').config();

const PORT       = process.env.PORT       || 3500;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;

module.exports = {
  PORT,
  CLIENT_URL,
  SERVER_URL,
};
