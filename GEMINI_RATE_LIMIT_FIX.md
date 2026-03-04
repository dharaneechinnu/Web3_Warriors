# Gemini Rate Limiting & Optimization Fix

## Problem
The application was hitting Gemini API rate limits:
```
[GoogleGenerativeAI Error]: [429 Too Many Requests] You exceeded your current quota
```

This occurred because:
1. Multiple mentor applications triggered simultaneous Gemini API calls
2. No rate limiting between requests
3. No caching mechanism to avoid re-analyzing identical content
4. No check to prevent redundant evaluations

## Solution Implemented

### 1. **Created Gemini Rate Limiter** (`Server/services/geminiRateLimiter.js`)

**Features:**
- **Request Queue**: FIFO queue with 5-second minimum interval between requests (max 12 RPM, well below free tier 15 RPM)
- **Exponential Backoff**: On 429 errors, waits 2^attempt seconds (max 60s), retries up to 3 times
- **In-Memory Cache**: Map-based cache to store analysis results and avoid duplicate API calls
- **Cache Keys**: Uses MD5 hash of file metadata (path+size+mtime) or prompt hash

**Exports:**
- `queueRequest(fn, cacheKey)` - Queue an async function with rate limiting
- `getCached(key)` - Retrieve cached result
- `clearCache()` - Clear all cached results
- `getCacheStats()` - Get cache statistics

### 2. **Updated Video Analyzer** (`Server/services/videoAnalyzer.js`)

**Changes:**
- Added `crypto` and rate limiter imports
- Enhanced `scoreFromFileStat()` with codec bonus (+10 for mp4/webm/mkv)
- Created `getCacheKey(filePath)` helper - generates cache key from file metadata
- Wrapped `analyzeVideoWithGemini()` in rate limiter:
  - Checks cache before API call
  - Queues request with 5s minimum interval
  - Caches result after successful analysis

**Benefits:**
- Same video file won't be analyzed twice (uses cache)
- Videos are analyzed sequentially with rate limiting
- 429 errors trigger exponential backoff and retry

### 3. **Updated AI Evaluation** (`Server/services/aiMentorEvaluation.js`)

**Changes:**
- Added `crypto` and rate limiter imports
- Created `getCacheKeyFromPrompt(prompt)` helper - generates cache key from prompt hash
- Wrapped `callGemini()` in rate limiter:
  - Checks cache before API call
  - Queues request with 5s minimum interval
  - Caches result after successful evaluation

**Benefits:**
- Identical evaluation prompts use cached results
- Text evaluations are rate-limited like video analysis
- 429 errors handled gracefully with retry

### 4. **Added Redundant Evaluation Check** (`Server/services/aiMentorEvaluation.js`)

**Changes:**
- Added check at start of `runEvaluation()`:
  - Skips evaluation if `aiEvaluation.evaluatedAt` exists and is less than 1 hour old
  - Logs warning and returns early to save quota
  - Suggests using `/re-evaluate` endpoint for manual re-evaluation

**Benefits:**
- Prevents duplicate evaluations from double-clicks or race conditions
- Saves API quota on redundant calls
- Still allows manual re-evaluation via admin endpoint

## How It Works

### Video Analysis Flow
```
1. User submits mentor application with video
2. videoAnalyzer.analyzeVideoWithGemini() is called
3. Generate cache key from video file metadata (path+size+mtime)
4. Check if cached result exists → YES: Return cached result (instant)
                                  → NO: Continue to step 5
5. Queue Gemini API request (waits for previous requests to finish)
6. Upload video to Gemini, wait for processing, analyze content
7. Parse scores and feedback from Gemini response
8. Cache result with file metadata key
9. Return analysis
```

### Text Evaluation Flow
```
1. runEvaluation() is called for an application
2. Check if already evaluated recently (<1 hour) → YES: Skip evaluation
                                                   → NO: Continue
3. Build evaluation prompt from GitHub, resume, LinkedIn, video data
4. Generate cache key from prompt hash
5. Check if cached result exists → YES: Return cached result (instant)
                                  → NO: Continue to step 6
6. Queue Gemini API request (waits for previous requests to finish)
7. Send prompt to Gemini, parse JSON response
8. Cache result with prompt hash key
9. Enforce scoring formula and persist to database
```

### Rate Limiting Behavior
```
Request Timeline:
T+0s:  Request 1 enters queue → processes immediately
T+1s:  Request 2 enters queue → waits 4s (min 5s interval)
T+5s:  Request 2 processes
T+6s:  Request 3 enters queue → waits 4s
T+10s: Request 3 processes
T+11s: Request 4 enters queue → waits 4s
...

On 429 Error:
Attempt 1: Wait 2^1 = 2 seconds, retry
Attempt 2: Wait 2^2 = 4 seconds, retry
Attempt 3: Wait 2^3 = 8 seconds, retry
Attempt 4: Wait 2^4 = 16 seconds, retry (if max < 60s)
...
Max wait: 60 seconds
Max retries: 3
```

## Configuration

### Environment Variables
Ensure these are set in `.env`:
```bash
# Gemini API Key (required)
GEMINI_API_KEY=your_api_key_here

# Gemini Model (optional, defaults to gemini-2.0-flash)
GEMINI_MODEL=gemini-2.0-flash
```

### Rate Limiter Settings
Edit `Server/services/geminiRateLimiter.js` to adjust:
```javascript
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds = max 12 RPM (change if needed)
const MAX_RETRIES = 3;             // Max retry attempts on 429 errors
const MAX_BACKOFF_DELAY = 60000;   // Max wait time (60 seconds)
```

### Cache Settings
The cache is in-memory and persists for the lifetime of the Node.js process. To clear the cache:
```javascript
const { clearCache, getCacheStats } = require('./services/geminiRateLimiter');

// Clear all cached results
clearCache();

// Get cache statistics
const stats = getCacheStats();
console.log(`Cache size: ${stats.size} entries, keys:`, stats.keys);
```

## Testing

### 1. Test Video Analysis Caching
```bash
# Submit the same video twice rapidly
# First: Should process normally (shows upload logs)
# Second: Should use cached result (shows "✅ Using cached analysis")
```

### 2. Test Text Evaluation Caching
```bash
# Submit identical applications (same GitHub, resume, video)
# First: Should process normally
# Second: Should use cached result (shows "✅ Using cached evaluation result")
```

### 3. Test Rate Limiting
```bash
# Submit 5 mentor applications rapidly (within 5 seconds)
# Console should show:
# - "Queueing video analysis request (with rate limiting)..."
# - "Processing queue... (waiting Xs before next request)"
# - Requests processed sequentially with 5s gaps
```

### 4. Test Redundant Evaluation Check
```bash
# Submit an application, wait for evaluation to complete
# Trigger evaluation again via code or double-submit
# Should see: "⚠️ Application was evaluated X minutes ago"
# Should see: "⏩ Skipping redundant evaluation"
```

### 5. Test 429 Error Handling
```bash
# Temporarily set GEMINI_API_KEY to an invalid/rate-limited key
# Submit application
# Should see retry logs: "⚠️ Rate limit hit (429), retrying... (attempt X/3)"
# Should see exponential backoff: "Waiting 2s... 4s... 8s..."
# After 3 retries, should fall back to heuristic scoring
```

## Monitoring

### Console Logs to Watch For

**Successful Cache Hit (Video):**
```
[videoAnalyzer] [Gemini] ✅ Using cached analysis for this video
```

**Successful Cache Hit (Text):**
```
[aiMentorEvaluation] [Gemini] ✅ Using cached evaluation result
```

**Rate Limiting Active:**
```
[geminiRateLimiter] Processing queue... (waiting 4s before next request)
[geminiRateLimiter] ✅ Queue processed successfully
```

**Redundant Evaluation Skipped:**
```
[aiMentorEvaluation] ⚠️  Application was evaluated 15 minutes ago.
[aiMentorEvaluation] ⏩ Skipping redundant evaluation. Use /re-evaluate endpoint for manual re-evaluation.
```

**429 Error with Retry:**
```
[geminiRateLimiter] ⚠️ Rate limit hit (429), retrying... (attempt 1/3, delay: 2s)
[geminiRateLimiter] ⚠️ Rate limit hit (429), retrying... (attempt 2/3, delay: 4s)
```

**429 Error Final Failure:**
```
[geminiRateLimiter] ❌ Max retries (3) exceeded
[aiMentorEvaluation] [Gemini] ❌ Gemini API call failed: [429 Too Many Requests]
[aiMentorEvaluation] [Fallback] Computing heuristic scores…
```

## Quota Management

### Free Tier Limits (Gemini 2.0 Flash)
- **Rate**: 15 requests per minute (RPM)
- **Daily**: 1,500 requests per day (RPD)

### Our Configuration
- **Rate Limiter**: Max 12 RPM (leaves 20% buffer)
- **Request Interval**: 5 seconds between requests
- **Cache**: Reduces actual API calls by avoiding duplicates

### Estimated Capacity
With 12 RPM and 24/7 operation:
```
12 requests/min × 60 min/hour × 24 hours = 17,280 requests/day
```

**BUT** free tier limit is 1,500 RPD, so effective capacity is:
```
1,500 requests/day ÷ 1,440 min/day = 1.04 requests/minute average
```

**Recommendation:**
- For production with >100 mentor applications/day, upgrade to paid tier
- For development/testing, current rate limiting should prevent 429 errors
- Cache significantly reduces API calls (e.g., testing same video multiple times)

## Manual Re-Evaluation

Admin can force re-evaluation via:
```bash
POST /api/admin/mentor/:id/re-evaluate
```

This bypasses the 1-hour redundancy check and triggers a fresh evaluation (still uses cache if prompt/video are identical to a recent evaluation).

## Files Modified

1. ✅ `Server/services/geminiRateLimiter.js` - NEW FILE (136 lines)
2. ✅ `Server/services/videoAnalyzer.js` - Added rate limiting + caching
3. ✅ `Server/services/aiMentorEvaluation.js` - Added rate limiting + caching + redundancy check
4. ✅ `.env` - Already configured with GEMINI_API_KEY and GEMINI_MODEL

## Summary

This implementation provides:
- ✅ **Rate Limiting**: Max 12 RPM (below 15 RPM free tier limit)
- ✅ **Exponential Backoff**: Graceful handling of 429 errors
- ✅ **Caching**: Avoids duplicate API calls for identical content
- ✅ **Redundancy Check**: Prevents evaluating same application multiple times
- ✅ **Queue Management**: FIFO processing with guaranteed intervals
- ✅ **Monitoring**: Detailed console logs for debugging
- ✅ **Fallback**: Heuristic scoring if Gemini fails after retries

**Result:** Should eliminate 429 errors and optimize API quota usage! 🎉
