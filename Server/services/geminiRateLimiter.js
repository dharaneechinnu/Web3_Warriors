/**
 * geminiRateLimiter.js
 * ════════════════════════════════════════════════════════════════════════════
 * Rate limiting and retry logic for Google Gemini API calls.
 * 
 * Free tier limits (as of 2026):
 * - 15 requests per minute (RPM)
 * - 1 million tokens per minute (TPM)
 * - 1,500 requests per day (RPD)
 * 
 * This module implements:
 * - Exponential backoff retry on 429 errors
 * - Request queuing to avoid exceeding rate limits
 * - In-memory cache to avoid duplicate API calls
 * ════════════════════════════════════════════════════════════════════════════
 */

const TAG = '[GeminiRateLimiter]';

// ── Rate limiting state ───────────────────────────────────────────────────────
let requestQueue = [];
let isProcessing = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests (12 per minute max)

// ── Cache for video analysis results ──────────────────────────────────────────
const analysisCache = new Map();

/**
 * Sleep helper
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a Gemini API call with retry logic
 */
const executeWithRetry = async (fn, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorMsg = error.message || String(error);
      
      // Check if it's a rate limit error
      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
        const backoffDelay = Math.min(60000, 1000 * Math.pow(2, attempt)); // Max 60s
        console.warn(`${TAG} ⚠️  Rate limit hit (attempt ${attempt}/${maxRetries})`);
        console.warn(`${TAG}    Waiting ${(backoffDelay / 1000).toFixed(1)}s before retry...`);
        await sleep(backoffDelay);
        continue;
      }
      
      // For non-rate-limit errors, throw immediately
      throw error;
    }
  }
  
  throw lastError;
};

/**
 * Queue a Gemini API call to respect rate limits
 */
const queueRequest = async (fn, cacheKey = null) => {
  // Check cache first
  if (cacheKey && analysisCache.has(cacheKey)) {
    console.log(`${TAG} ✅ Cache hit for: ${cacheKey}`);
    return analysisCache.get(cacheKey);
  }
  
  return new Promise((resolve, reject) => {
    requestQueue.push({ fn, resolve, reject, cacheKey });
    processQueue();
  });
};

/**
 * Process the request queue one at a time with rate limiting
 */
const processQueue = async () => {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  
  while (requestQueue.length > 0) {
    const { fn, resolve, reject, cacheKey } = requestQueue.shift();
    
    try {
      // Enforce minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`${TAG} ⏳ Rate limiting: waiting ${(waitTime / 1000).toFixed(1)}s...`);
        await sleep(waitTime);
      }
      
      // Execute with retry logic
      const result = await executeWithRetry(fn);
      
      // Cache the result
      if (cacheKey && result) {
        analysisCache.set(cacheKey, result);
      }
      
      lastRequestTime = Date.now();
      resolve(result);
      
      // Small delay between requests
      await sleep(1000);
      
    } catch (error) {
      reject(error);
    }
  }
  
  isProcessing = false;
};

/**
 * Get cached analysis result
 */
const getCached = (cacheKey) => {
  return analysisCache.get(cacheKey) || null;
};

/**
 * Clear cache (useful for testing)
 */
const clearCache = () => {
  analysisCache.clear();
  console.log(`${TAG} 🧹 Cache cleared`);
};

/**
 * Get cache stats
 */
const getCacheStats = () => {
  return {
    size: analysisCache.size,
    queueLength: requestQueue.length,
    isProcessing,
  };
};

module.exports = {
  queueRequest,
  getCached,
  clearCache,
  getCacheStats,
};
