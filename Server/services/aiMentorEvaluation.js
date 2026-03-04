/**
 * aiMentorEvaluation.js
 * ════════════════════════════════════════════════════════════════════════════
 * AI-powered mentor application evaluation pipeline.
 *
 * Primary AI  : Google Gemini (gemini-1.5-flash) — cloud, reliable, accurate
 * Fallback    : Heuristic scoring — if Gemini API key is missing or call fails
 *
 * 8-step pipeline:
 *   [1/8] Load application from DB
 *   [2/8] Fetch GitHub data
 *   [3/8] Parse resume
 *   [4/8] Analyse intro video (technical + Gemini Vision)
 *   [5/8] Build AI evaluation prompt
 *   [6/8] Call Gemini AI (or fallback)
 *   [7/8] Enforce scoring formula
 *   [8/8] Persist to DB
 *
 * Scoring weights:
 *   GitHub (30%) + LinkedIn (25%) + Resume (25%) + Video (20%)
 * ════════════════════════════════════════════════════════════════════════════
 */
const crypto                                = require('crypto');
const { queueRequest, getCached }           = require('./geminiRateLimiter');
const { fetchGitHubSummary }                = require('./githubService');
const { parseResumeFromPath, parseResumeFromUrl } = require('./resumeParser');
const { analyzeIntroVideo }                 = require('./videoAnalyzer');
const MentorApplication                     = require('../Model/MentorApplication');

const TAG = '[aiMentorEvaluation]';

// ── Prompt builder ────────────────────────────────────────────────────────────
const buildPrompt = ({ skills, experience, achievements, githubSummary, resumeText, linkedinUrl, introVideoScore, videoFeedback }) => `
You are an expert technical evaluator for a mentorship platform.
Evaluate the mentor profile below and return ONLY a valid JSON object — no extra text, no markdown code fences.

=== MENTOR PROFILE ===
Skills           : ${(skills || []).join(', ') || 'Not provided'}

Experience       :
${experience || 'Not provided'}

Achievements     :
${achievements || 'Not provided'}

LinkedIn URL     : ${linkedinUrl || 'Not provided'}

GitHub Activity  :
${githubSummary || 'Not provided'}

Resume Content   :
${resumeText ? resumeText.slice(0, 4000) : 'No resume content extracted.'}

Intro Video Analysis:
  Video Quality Score: ${introVideoScore}/100
  ${videoFeedback ? `AI Video Feedback: ${videoFeedback}` : 'No video feedback available.'}

=== SCORING RULES ===

githubScore (0–100): Evaluate based on repo quantity, commit activity, stars, language diversity, and project relevance.
  - 80-100: Active contributor, many repos, stars, diverse languages, relevant projects
  - 50-79:  Moderate activity with some relevant projects
  - 20-49:  Few repos or limited activity
  - 0-19:   No meaningful GitHub presence

linkedinScore (0–100): Evaluate professional profile quality.
  - If URL provided: Infer quality from resume context, industry relevance, years of experience, role seniority
  - If no URL: Score 15 (not provided penalty)

resumeScore (0–100): Evaluate resume content quality.
  - 80-100: Detailed, well-written, relevant technical experience, clear expertise areas
  - 50-79:  Decent content with some relevant experience
  - 20-49:  Minimal or poorly written content
  - 0-19:   No resume or unreadable

introVideoScore: Use the pre-computed value exactly: ${introVideoScore}

finalScore (0–100): Calculate as:
  (githubScore × 0.30) + (linkedinScore × 0.25) + (resumeScore × 0.25) + (introVideoScore × 0.20)

recommendation:
  - "approve" if finalScore ≥ 70
  - "review"  if finalScore 40–69
  - "reject"  if finalScore < 40

reason: 2–3 sentences explaining the evaluation. Be specific about strengths and weaknesses.

=== REQUIRED OUTPUT (JSON only) ===
{
  "githubScore": <number>,
  "linkedinScore": <number>,
  "resumeScore": <number>,
  "introVideoScore": ${introVideoScore},
  "finalScore": <number>,
  "recommendation": "<approve|review|reject>",
  "reason": "<explanation>"
}
`.trim();

// ── Gemini AI caller ──────────────────────────────────────────────────────────

/**
 * Generate cache key from prompt hash
 */
const getCacheKeyFromPrompt = (prompt) => {
  const hash = crypto.createHash('md5').update(prompt).digest('hex').substring(0, 16);
  return `eval_${hash}`;
};

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  // Check cache first
  const cacheKey = getCacheKeyFromPrompt(prompt);
  const cached = getCached(cacheKey);
  if (cached) {
    console.log(`${TAG} [Gemini] ✅ Using cached evaluation result`);
    return cached;
  }

  // Queue the Gemini API call with rate limiting
  console.log(`${TAG} [Gemini] Queueing evaluation request (with rate limiting)...`);
  
  const result = await queueRequest(async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI     = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    console.log(`${TAG} [Gemini] Sending evaluation request — model=${modelName}`);
    console.log(`${TAG} [Gemini] Prompt length: ${prompt.length} chars`);

    const model  = genAI.getGenerativeModel({ model: modelName });
    const apiResult = await model.generateContent(prompt);
    const raw    = apiResult.response.text();

    console.log(`${TAG} [Gemini] Raw response (first 500 chars): ${raw.slice(0, 500)}`);

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in Gemini response');

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`${TAG} [Gemini] Parsed result:`, JSON.stringify(parsed));
    return parsed;
  }, cacheKey);

  return result;
};

// ── Fallback evaluation (heuristic) ───────────────────────────────────────────
const fallbackEvaluation = (githubSummary, resumeText, linkedinUrl, introVideoScore) => {
  console.log(`${TAG} [Fallback] Computing heuristic scores…`);

  const githubScore   = githubSummary && !githubSummary.startsWith('Could not') ? 45 : 15;
  const linkedinScore = linkedinUrl ? 45 : 15;
  const resumeScore   = resumeText && resumeText.length > 200 ? 55 : 25;
  const videoScore    = introVideoScore || 0;

  const finalScore = Math.round(
    githubScore   * 0.30 +
    linkedinScore * 0.25 +
    resumeScore   * 0.25 +
    videoScore    * 0.20
  );

  console.log(`${TAG} [Fallback] github=${githubScore} linkedin=${linkedinScore} resume=${resumeScore} video=${videoScore} final=${finalScore}`);

  return {
    githubScore,
    linkedinScore,
    resumeScore,
    introVideoScore: videoScore,
    finalScore,
    recommendation: finalScore >= 70 ? 'approve' : finalScore >= 40 ? 'review' : 'reject',
    reason: 'AI service was unavailable. Scores are estimated — manual admin review is required.',
  };
};

// ── Main entry point ──────────────────────────────────────────────────────────
const runEvaluation = async (applicationId, forceEvaluation = false) => {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`${TAG} ▶ runEvaluation START — applicationId=${applicationId}`);
  console.log(`${TAG}   timestamp : ${new Date().toISOString()}`);
  console.log(`${TAG}   forceEval : ${forceEvaluation ? '✅ YES (manual re-evaluation)' : '❌ NO (auto)'}`);
  console.log(`${TAG}   AI engine : Google Gemini (${process.env.GEMINI_MODEL || 'gemini-2.0-flash'})`);
  console.log(`${TAG}   API key   : ${process.env.GEMINI_API_KEY ? '✅ configured' : '❌ NOT SET'}`);
  console.log(`${'─'.repeat(70)}`);

  try {
    // ══ Step 1/8: Load application ═══════════════════════════════════════════
    console.log(`\n${TAG} [1/8] Loading application from DB…`);
    const application = await MentorApplication.findById(applicationId);
    if (!application) {
      console.error(`${TAG} ❌ Application ${applicationId} not found in DB.`);
      return;
    }
    console.log(`${TAG} ✅ Application found:`);
    console.log(`${TAG}    userId           = ${application.userId}`);
    console.log(`${TAG}    name             = "${application.name}"`);
    console.log(`${TAG}    status           = ${application.mentorStatus}`);
    console.log(`${TAG}    githubUrl        = "${application.githubUrl || 'none'}"`);
    console.log(`${TAG}    linkedinUrl      = "${application.linkedinUrl || 'none'}"`);
    console.log(`${TAG}    resumeLocalPath  = "${application.resumeLocalPath || 'none'}"`);
    console.log(`${TAG}    introVideoPath   = "${application.introVideoLocalPath || 'none'}"`);

    // Check if already evaluated recently (skip redundant evaluations)
    // BUT: Allow forced re-evaluation when explicitly requested by admin
    if (!forceEvaluation && application.aiEvaluation?.evaluatedAt) {
      const evaluatedAt = new Date(application.aiEvaluation.evaluatedAt);
      const hoursSinceEvaluation = (Date.now() - evaluatedAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceEvaluation < 1) {
        console.log(`${TAG} ⚠️  Application was evaluated ${Math.round(hoursSinceEvaluation * 60)} minutes ago.`);
        console.log(`${TAG} ⏩ Skipping redundant evaluation. Use /re-evaluate endpoint for manual re-evaluation.`);
        console.log(`${'═'.repeat(70)}\n`);
        return;
      } else {
        console.log(`${TAG} ℹ️  Previous evaluation was ${Math.round(hoursSinceEvaluation)} hours ago — proceeding with fresh evaluation.`);
      }
    } else if (forceEvaluation) {
      console.log(`${TAG} 🔄 Force re-evaluation requested by admin — bypassing redundancy check.`);
    }

    const { skills, experience, achievements, resumeUrl, resumeLocalPath,
            githubUrl, linkedinUrl, introVideoLocalPath } = application;

    // ══ Step 2/8: Fetch GitHub data ══════════════════════════════════════════
    console.log(`\n${TAG} [2/8] Fetching GitHub data for: ${githubUrl || 'none'}…`);
    let githubSummary = '';
    try {
      const githubResult = await fetchGitHubSummary(githubUrl);
      githubSummary = githubResult.summary;
      console.log(`${TAG} ✅ GitHub summary (first 200 chars): ${githubSummary.slice(0, 200)}`);
    } catch (ghErr) {
      console.warn(`${TAG} ⚠️  GitHub fetch failed: ${ghErr.message}`);
      githubSummary = 'GitHub data unavailable.';
    }

    // ══ Step 3/8: Parse resume ═══════════════════════════════════════════════
    console.log(`\n${TAG} [3/8] Parsing resume…`);
    let resumeText = '';
    try {
      if (resumeLocalPath) {
        console.log(`${TAG}    Trying local path: ${resumeLocalPath}`);
        resumeText = await parseResumeFromPath(resumeLocalPath);
        console.log(`${TAG} ✅ Resume parsed from local file — ${resumeText.length} chars`);
      }
      if (!resumeText && resumeUrl) {
        console.log(`${TAG}    Local parse failed or empty — trying URL: ${resumeUrl}`);
        resumeText = await parseResumeFromUrl(resumeUrl);
        console.log(`${TAG} ✅ Resume parsed from URL — ${resumeText.length} chars`);
      }
      if (!resumeText) {
        console.warn(`${TAG} ⚠️  Could not extract resume text`);
      }
    } catch (resErr) {
      console.warn(`${TAG} ⚠️  Resume parse error: ${resErr.message}`);
    }

    // ══ Step 4/8: Analyse intro video (technical + Gemini Vision) ════════════
    console.log(`\n${TAG} [4/8] Analysing intro video…`);
    let introVideoScore  = 0;
    let introVideoMeta   = null;
    let introVideoMethod = 'none';
    let videoFeedback    = '';
    let geminiAnalysis   = null;

    try {
      // analyzeIntroVideo is now ASYNC — does both technical + Gemini Vision
      const videoResult    = await analyzeIntroVideo(introVideoLocalPath || '');
      introVideoScore      = videoResult.score;
      introVideoMeta       = videoResult.metadata;
      introVideoMethod     = videoResult.method;
      geminiAnalysis       = videoResult.geminiAnalysis;

      if (geminiAnalysis) {
        videoFeedback = geminiAnalysis.feedback || '';
        console.log(`${TAG} ✅ Intro video score=${introVideoScore} method="${introVideoMethod}"`);
        console.log(`${TAG}    Gemini presentation  = ${geminiAnalysis.presentationScore}/100`);
        console.log(`${TAG}    Gemini communication = ${geminiAnalysis.communicationScore}/100`);
        console.log(`${TAG}    Gemini content       = ${geminiAnalysis.contentScore}/100`);
        console.log(`${TAG}    Gemini overall       = ${geminiAnalysis.overallVideoScore}/100`);
        console.log(`${TAG}    Gemini feedback      = "${videoFeedback}"`);
      } else {
        console.log(`${TAG} ✅ Intro video score=${introVideoScore} method="${introVideoMethod}" (no Gemini analysis)`);
      }

      if (introVideoMeta) {
        console.log(`${TAG}    duration=${introVideoMeta.durationSec?.toFixed(1)}s  ${introVideoMeta.width}x${introVideoMeta.height}  codec=${introVideoMeta.codec}  bitrate=${introVideoMeta.bitrateKbps?.toFixed(0)}kbps`);
      }
    } catch (vidErr) {
      console.warn(`${TAG} ⚠️  Video analysis error: ${vidErr.message}`);
      introVideoScore = 0;
    }

    // ══ Step 5/8: Build evaluation prompt ════════════════════════════════════
    console.log(`\n${TAG} [5/8] Building evaluation prompt…`);
    const prompt = buildPrompt({
      skills, experience, achievements,
      githubSummary, resumeText, linkedinUrl,
      introVideoScore, videoFeedback,
    });
    console.log(`${TAG} ✅ Prompt built — ${prompt.length} chars`);

    // ══ Step 6/8: Call Gemini AI (or fallback) ═══════════════════════════════
    console.log(`\n${TAG} [6/8] Calling Gemini AI for evaluation…`);
    let evaluation;
    try {
      evaluation = await callGemini(prompt);
      console.log(`${TAG} ✅ Gemini evaluation complete`);
    } catch (geminiErr) {
      console.warn(`${TAG} ⚠️  Gemini unavailable (${geminiErr.message}) — using heuristic fallback`);
      evaluation = fallbackEvaluation(githubSummary, resumeText, linkedinUrl, introVideoScore);
    }

    // ══ Step 7/8: Enforce scoring formula ════════════════════════════════════
    console.log(`\n${TAG} [7/8] Enforcing scoring formula…`);
    const gS = Math.min(100, Math.max(0, Number(evaluation.githubScore)   || 0));
    const lS = Math.min(100, Math.max(0, Number(evaluation.linkedinScore) || 0));
    const rS = Math.min(100, Math.max(0, Number(evaluation.resumeScore)   || 0));
    const vS = Math.min(100, Math.max(0, Number(introVideoScore)          || 0));
    const finalScore = Math.round(gS * 0.30 + lS * 0.25 + rS * 0.25 + vS * 0.20);

    console.log(`${TAG} ── Score breakdown ─────────────────────────────`);
    console.log(`${TAG}   GitHub Score   (×0.30) = ${gS}  → ${(gS * 0.30).toFixed(1)}`);
    console.log(`${TAG}   LinkedIn Score (×0.25) = ${lS}  → ${(lS * 0.25).toFixed(1)}`);
    console.log(`${TAG}   Resume Score   (×0.25) = ${rS}  → ${(rS * 0.25).toFixed(1)}`);
    console.log(`${TAG}   Video Score    (×0.20) = ${vS}  → ${(vS * 0.20).toFixed(1)}`);
    console.log(`${TAG}   ─────────────────────────────────────────────`);
    console.log(`${TAG}   Final Score             = ${finalScore}`);

    const validRecommendations = ['approve', 'review', 'reject'];
    const recommendation = validRecommendations.includes(evaluation.recommendation)
      ? evaluation.recommendation
      : finalScore >= 70 ? 'approve' : finalScore >= 40 ? 'review' : 'reject';

    console.log(`${TAG}   Recommendation          = ${recommendation}`);
    console.log(`${TAG}   Reason                  = ${evaluation.reason || ''}`);

    // ══ Step 8/8: Persist to DB ══════════════════════════════════════════════
    console.log(`\n${TAG} [8/8] Saving evaluation to database…`);

    const updateData = {
      aiEvaluation: {
        githubScore:     gS,
        linkedinScore:   lS,
        resumeScore:     rS,
        introVideoScore: vS,
        finalScore,
        recommendation,
        reason:          evaluation.reason || '',
        evaluatedAt:     new Date(),
      },
    };

    // Save Gemini video analysis details if available
    if (geminiAnalysis) {
      updateData.aiEvaluation.videoAnalysis = {
        presentationScore:  geminiAnalysis.presentationScore,
        communicationScore: geminiAnalysis.communicationScore,
        contentScore:       geminiAnalysis.contentScore,
        overallVideoScore:  geminiAnalysis.overallVideoScore,
        feedback:           geminiAnalysis.feedback,
        method:             introVideoMethod,
      };
    }

    await MentorApplication.findByIdAndUpdate(applicationId, updateData);

    console.log(`\n${TAG} ✅ Evaluation saved to DB for application ${applicationId}`);
    console.log(`${TAG}   ┌─────────────────────────────────────────┐`);
    console.log(`${TAG}   │  Final Score: ${String(finalScore).padStart(3)}  →  ${recommendation.toUpperCase().padEnd(7)}  │`);
    console.log(`${TAG}   └─────────────────────────────────────────┘`);
    console.log(`${'═'.repeat(70)}\n`);

  } catch (err) {
    console.error(`${TAG} ❌ Unexpected top-level error for ${applicationId}:`, err);
  }
};

module.exports = { runEvaluation };
