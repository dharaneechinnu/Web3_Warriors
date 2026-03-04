/**
 * videoAnalyzer.js
 * ════════════════════════════════════════════════════════════════════════════
 * Analyses a local mentor intro video using TWO methods:
 *
 *   1. Technical analysis  (ffprobe or file-stat fallback)
 *      → resolution, bitrate, codec, duration → technicalScore (0-100)
 *
 *   2. Google Gemini Vision AI  (watches the actual video)
 *      → presentation, communication, content quality → contentScore (0-100)
 *
 * Final score = technicalScore × 0.30  +  contentScore × 0.70
 *   (content quality matters more than raw video specs)
 *
 * If Gemini is unavailable → uses technical score only.
 * If ffprobe is unavailable → uses file-stat fallback for technical score.
 * ════════════════════════════════════════════════════════════════════════════
 */
const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { queueRequest, getCached } = require('./geminiRateLimiter');

const TAG = '[videoAnalyzer]';

// ── MIME-type helper ──────────────────────────────────────────────────────────
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.mp4': 'video/mp4',      '.m4v': 'video/mp4',
    '.avi': 'video/x-msvideo', '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',  '.flv': 'video/x-flv',
    '.mkv': 'video/x-matroska','.webm': 'video/webm',
    '.3gp': 'video/3gpp',      '.mpg': 'video/mpeg',
    '.mpeg': 'video/mpeg',
  };
  return map[ext] || 'video/mp4';
};

// ── Clamp helper ──────────────────────────────────────────────────────────────
const clamp = (v) => Math.min(100, Math.max(0, Math.round(Number(v) || 0)));

// ═══════════════════════════════════════════════════════════════════════════════
//  PART A — Technical analysis (ffprobe or file-stat)
// ═══════════════════════════════════════════════════════════════════════════════

const getVideoMetadata = (filePath) => {
  try {
    const cmd = `ffprobe -v quiet -print_format json -show_streams -show_format "${filePath}"`;
    console.log(`${TAG} Running: ${cmd}`);
    const output = execSync(cmd, { timeout: 15000 }).toString();
    const data   = JSON.parse(output);

    const videoStream = (data.streams || []).find(s => s.codec_type === 'video');
    const format      = data.format || {};

    const metadata = {
      durationSec:  parseFloat(format.duration || 0),
      sizeMB:       parseFloat((format.size || 0) / (1024 * 1024)),
      bitrateKbps:  parseFloat((format.bit_rate || 0) / 1000),
      width:        videoStream ? parseInt(videoStream.width,  10) : 0,
      height:       videoStream ? parseInt(videoStream.height, 10) : 0,
      codec:        videoStream ? (videoStream.codec_name || '').toLowerCase() : 'unknown',
      fps:          videoStream ? eval(videoStream.r_frame_rate || '0/1') : 0,
    };

    console.log(`${TAG} ffprobe metadata:`, JSON.stringify(metadata, null, 2));
    return { method: 'ffprobe', ...metadata };
  } catch (err) {
    console.warn(`${TAG} ffprobe unavailable or failed: ${err.message}`);
    return null;
  }
};

const scoreFromMetadata = (meta) => {
  let durationScore   = 0;
  let resolutionScore = 0;
  let bitrateScore    = 0;
  let codecScore      = 0;

  // Duration (30 pts) — ideal 60s–300s
  const d = meta.durationSec;
  if      (d >= 60  && d <= 300) durationScore = 30;
  else if (d >= 30  && d <  60)  durationScore = 20;
  else if (d >  300 && d <= 600) durationScore = 20;
  else if (d >= 10  && d <  30)  durationScore = 10;
  else if (d > 0)                durationScore = 5;
  console.log(`${TAG}   durationSec=${d.toFixed(1)}s → ${durationScore}/30`);

  // Resolution (30 pts)
  const h = meta.height;
  if      (h >= 1080) resolutionScore = 30;
  else if (h >= 720)  resolutionScore = 25;
  else if (h >= 480)  resolutionScore = 15;
  else if (h >= 360)  resolutionScore = 8;
  else if (h > 0)     resolutionScore = 3;
  console.log(`${TAG}   resolution=${meta.width}x${h} → ${resolutionScore}/30`);

  // Bitrate (20 pts)
  const bkbps = meta.bitrateKbps;
  if      (bkbps >= 2000) bitrateScore = 20;
  else if (bkbps >= 1000) bitrateScore = 15;
  else if (bkbps >= 500)  bitrateScore = 10;
  else if (bkbps > 0)     bitrateScore = 5;
  console.log(`${TAG}   bitrate=${bkbps.toFixed(0)} kbps → ${bitrateScore}/20`);

  // Codec (20 pts)
  const codec = meta.codec;
  if      (['h264', 'avc', 'hevc', 'h265'].includes(codec)) codecScore = 20;
  else if (['vp9', 'av1'].includes(codec))                   codecScore = 15;
  else if (['vp8', 'mpeg4'].includes(codec))                 codecScore = 10;
  else if (codec !== 'unknown')                              codecScore = 8;
  console.log(`${TAG}   codec="${codec}" → ${codecScore}/20`);

  const total = Math.min(100, durationScore + resolutionScore + bitrateScore + codecScore);
  console.log(`${TAG}   → technicalScore = ${total}/100`);
  return total;
};

const scoreFromFileStat = (filePath) => {
  try {
    const stats  = fs.statSync(filePath);
    const sizeMB = stats.size / (1024 * 1024);
    const ext    = path.extname(filePath).toLowerCase();
    
    console.log(`${TAG} File size fallback: ${sizeMB.toFixed(2)} MB (${ext})`);

    // Base score from file size (rough proxy for quality)
    let score = 0;
    if      (sizeMB >= 50)  score = 70;
    else if (sizeMB >= 20)  score = 55;
    else if (sizeMB >= 5)   score = 40;
    else if (sizeMB >= 1)   score = 25;
    else                    score = 10;
    
    // Bonus for modern/efficient codecs (smaller size for same quality)
    if (['.mp4', '.webm', '.mkv'].includes(ext)) {
      score = Math.min(100, score + 10);
    }

    console.log(`${TAG} File-stat technicalScore: ${score}/100`);
    return score;
  } catch (err) {
    console.warn(`${TAG} Could not stat file: ${err.message}`);
    return 20;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PART B — Google Gemini Vision AI (watches the video, evaluates content)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate cache key based on file path and size (cheap proxy for file hash)
 */
const getCacheKey = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    const hash = crypto.createHash('md5')
      .update(`${filePath}-${stats.size}-${stats.mtimeMs}`)
      .digest('hex')
      .substring(0, 16);
    return `video_${hash}`;
  } catch {
    return null;
  }
};

const analyzeVideoWithGemini = async (localPath) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log(`${TAG} [Gemini] No GEMINI_API_KEY set — skipping AI video content analysis`);
    return null;
  }

  // Generate cache key
  const cacheKey = getCacheKey(localPath);
  if (cacheKey) {
    const cached = getCached(cacheKey);
    if (cached) {
      console.log(`${TAG} [Gemini] ✅ Using cached analysis for this video`);
      return cached;
    }
  }

  // Queue the Gemini API call with rate limiting
  console.log(`${TAG} [Gemini] Queueing video analysis request (with rate limiting)...`);
  
  try {
    const analysis = await queueRequest(async () => {
      const { GoogleGenerativeAI }            = require('@google/generative-ai');
      const { GoogleAIFileManager, FileState } = require('@google/generative-ai/server');

      const fileManager = new GoogleAIFileManager(apiKey);
      const genAI       = new GoogleGenerativeAI(apiKey);
      const modelName   = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

      // ── Step 1: Upload video to Gemini ────────────────────────────────────────
      const mimeType = getMimeType(localPath);
      console.log(`${TAG} [Gemini] Uploading video "${path.basename(localPath)}" (${mimeType})…`);

      const uploadResult = await fileManager.uploadFile(localPath, {
        mimeType,
        displayName: path.basename(localPath),
      });
      console.log(`${TAG} [Gemini] ✅ Upload complete — name="${uploadResult.file.name}" state="${uploadResult.file.state}"`);

      // ── Step 2: Wait for Gemini to process the video ──────────────────────────
      let file = uploadResult.file;
      let waitAttempts = 0;
      while (file.state === FileState.PROCESSING) {
        waitAttempts++;
        if (waitAttempts > 30) {
          console.warn(`${TAG} [Gemini] ⚠️ Processing timeout after ${waitAttempts * 5}s`);
          return null;
        }
        console.log(`${TAG} [Gemini] ⏳ Video processing… (${waitAttempts * 5}s elapsed)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        file = await fileManager.getFile(file.name);
      }

      if (file.state === 'FAILED') {
        console.error(`${TAG} [Gemini] ❌ Video processing FAILED`);
        return null;
      }
      console.log(`${TAG} [Gemini] ✅ Video ready — state="${file.state}"`);

      // ── Step 3: Analyze video content with Gemini Vision ──────────────────────
      const model = genAI.getGenerativeModel({ model: modelName });
      console.log(`${TAG} [Gemini] 🎬 Analyzing video content with ${modelName}…`);

      const analysisPrompt = `You are an expert evaluator reviewing a mentor's introduction video for an online mentorship and learning platform.

Watch this video carefully and evaluate the mentor's introduction on the following criteria.
Return ONLY a valid JSON object — no markdown code fences, no extra text before or after.

=== EVALUATION CRITERIA ===

1. **presentationScore** (0-100): Visual professionalism — background, lighting, camera quality, appearance.
   - 85-100: Professional studio-like setup, excellent lighting, clean background, well-groomed
   - 65-84:  Good setup with minor issues (slightly messy background, okay lighting)
   - 40-64:  Acceptable but clearly amateur (poor lighting, distracting background)
   - 15-39:  Very poor visual quality, distracting environment
   - 0-14:   No face visible, extremely dark, or unwatchable

2. **communicationScore** (0-100): Speaking quality — clarity, confidence, pace, articulation, enthusiasm, engagement.
   - 85-100: Excellent speaker — clear, confident, well-paced, enthusiastic, engaging
   - 65-84:  Good communication with minor issues (slight hesitation, a bit monotone)
   - 40-64:  Understandable but lacks confidence, too fast/slow, or low energy
   - 15-39:  Difficult to follow, heavy stammering, very monotone
   - 0-14:   Cannot understand, no speech, or entirely incoherent

3. **contentScore** (0-100): Relevance and depth — does the mentor explain their expertise, teaching approach, topic areas, and value?
   - 85-100: Clearly articulates expertise, specific topics, teaching philosophy, and what learners will gain
   - 65-84:  Mentions relevant topics and experience but could be more specific
   - 40-64:  Vague introduction, limited detail about expertise or teaching approach
   - 15-39:  Mostly off-topic or lacks substance
   - 0-14:   No meaningful educational content

4. **overallVideoScore** (0-100): Calculate as:
   presentationScore * 0.25  +  communicationScore * 0.40  +  contentScore * 0.35

5. **feedback**: 2-3 sentences of constructive feedback. Mention specific strengths and areas for improvement. Be professional and helpful.

=== REQUIRED OUTPUT FORMAT (JSON only) ===
{
  "presentationScore": <number>,
  "communicationScore": <number>,
  "contentScore": <number>,
  "overallVideoScore": <number>,
  "feedback": "<string>"
}`;

      const result = await model.generateContent([
        {
          fileData: {
            mimeType: file.mimeType,
            fileUri:  file.uri,
          },
        },
        { text: analysisPrompt },
      ]);

      const responseText = result.response.text();
      console.log(`${TAG} [Gemini] Raw response (first 600 chars):\n${responseText.slice(0, 600)}`);

      // ── Step 4: Parse JSON from Gemini response ───────────────────────────────
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`${TAG} [Gemini] ❌ No JSON found in Gemini response`);
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const parsedAnalysis = {
        presentationScore:  clamp(parsed.presentationScore),
        communicationScore: clamp(parsed.communicationScore),
        contentScore:       clamp(parsed.contentScore),
        overallVideoScore:  clamp(parsed.overallVideoScore),
        feedback:           String(parsed.feedback || ''),
      };

      console.log(`${TAG} [Gemini] ✅ Video content analysis complete:`);
      console.log(`${TAG}   presentationScore  = ${parsedAnalysis.presentationScore}/100`);
      console.log(`${TAG}   communicationScore = ${parsedAnalysis.communicationScore}/100`);
      console.log(`${TAG}   contentScore       = ${parsedAnalysis.contentScore}/100`);
      console.log(`${TAG}   overallVideoScore  = ${parsedAnalysis.overallVideoScore}/100`);
      console.log(`${TAG}   feedback           = "${parsedAnalysis.feedback}"`);

      // ── Step 5: Clean up uploaded file from Gemini (best effort) ──────────────
      try {
        await fileManager.deleteFile(file.name);
        console.log(`${TAG} [Gemini] 🧹 Cleaned up uploaded file from Gemini`);
      } catch (delErr) {
        console.warn(`${TAG} [Gemini] Could not delete uploaded file: ${delErr.message}`);
      }

      return parsedAnalysis;
    }, cacheKey); // End of queueRequest callback

    return analysis; // Return cached or freshly computed analysis

  } catch (err) {
    console.error(`${TAG} [Gemini] ❌ Video analysis error: ${err.message}`);
    if (err.stack) {
      console.error(`${TAG} [Gemini] Stack:\n${err.stack.split('\n').slice(0, 4).join('\n')}`);
    }
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PUBLIC ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyses the intro video at the given local path.
 * ASYNC — combines ffprobe technical analysis + Gemini AI content analysis.
 *
 * @param  {string} localPath - Absolute or relative path to the video file
 * @returns {Promise<{
 *   score: number,
 *   method: string,
 *   metadata: object|null,
 *   geminiAnalysis: object|null
 * }>}
 */
const analyzeIntroVideo = async (localPath) => {
  console.log(`\n${TAG} ════════════════════════════════════════════════`);
  console.log(`${TAG} ▶ analyzeIntroVideo START`);
  console.log(`${TAG}   path: ${localPath}`);
  console.log(`${TAG}   timestamp: ${new Date().toISOString()}`);

  if (!localPath) {
    console.log(`${TAG} No path provided → score=0`);
    return { score: 0, method: 'none', metadata: null, geminiAnalysis: null };
  }

  if (!fs.existsSync(localPath)) {
    console.warn(`${TAG} File not found: ${localPath} → score=0`);
    return { score: 0, method: 'not_found', metadata: null, geminiAnalysis: null };
  }

  // ── A. Technical analysis ──────────────────────────────────────────────────
  console.log(`\n${TAG} [A] Technical analysis (ffprobe / stat fallback)…`);
  let technicalScore  = 0;
  let metadata        = null;
  let technicalMethod = 'stat_fallback';

  const ffprobeResult = getVideoMetadata(localPath);
  if (ffprobeResult) {
    technicalScore  = scoreFromMetadata(ffprobeResult);
    metadata        = ffprobeResult;
    technicalMethod = 'ffprobe';
  } else {
    technicalScore = scoreFromFileStat(localPath);
  }
  console.log(`${TAG} [A] ✅ Technical score = ${technicalScore}/100  (method: ${technicalMethod})`);

  // ── B. Gemini AI content analysis ──────────────────────────────────────────
  console.log(`\n${TAG} [B] Gemini AI video content analysis…`);
  const geminiResult = await analyzeVideoWithGemini(localPath);

  if (geminiResult) {
    // Combine: technical 30% + AI content 70%
    const combinedScore = Math.round(
      technicalScore * 0.30 + geminiResult.overallVideoScore * 0.70
    );
    console.log(`\n${TAG} ── COMBINED SCORE ─────────────────────────────`);
    console.log(`${TAG}   Technical (×0.30) : ${technicalScore}  → ${(technicalScore * 0.30).toFixed(1)}`);
    console.log(`${TAG}   AI Content(×0.70) : ${geminiResult.overallVideoScore}  → ${(geminiResult.overallVideoScore * 0.70).toFixed(1)}`);
    console.log(`${TAG}   Combined          : ${combinedScore}/100`);
    console.log(`${TAG} ════════════════════════════════════════════════\n`);

    return {
      score:          combinedScore,
      method:         `${technicalMethod}+gemini`,
      metadata,
      geminiAnalysis: geminiResult,
    };
  }

  // Gemini unavailable — use technical score only
  console.log(`${TAG} ⚠️ Gemini unavailable — using technical score only: ${technicalScore}`);
  console.log(`${TAG} ════════════════════════════════════════════════\n`);

  return {
    score:          technicalScore,
    method:         technicalMethod,
    metadata,
    geminiAnalysis: null,
  };
};

module.exports = { analyzeIntroVideo };
