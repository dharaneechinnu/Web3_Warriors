const path               = require('path');
const MentorApplication  = require('../Model/MentorApplication');
const { runEvaluation }  = require('../services/aiMentorEvaluation');

// ── POST /mentor-application/apply ────────────────────────────────────────────
const submitApplication = async (req, res) => {
  const TAG = '[submitApplication]';
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${TAG} ▶ Request received`);
  console.log(`${TAG} userId  : ${req.userId}`);
  console.log(`${TAG} body    :`, JSON.stringify(req.body));
  console.log(`${TAG} files   :`, req.files
    ? Object.entries(req.files).map(([k, arr]) =>
        `${k}: ${arr[0]?.originalname} (${(arr[0]?.size / 1024).toFixed(1)} KB) → ${arr[0]?.path}`
      ).join(' | ')
    : 'none');
  console.log(`${'─'.repeat(60)}`);

  try {
    const userId = req.userId;
    const user   = req.user;

    // ── 1. Guard: duplicate application ──────────────────────────────────────
    console.log(`${TAG} [1/8] Checking for existing application…`);
      const existing = await MentorApplication.findOne({ userId });
      let isResubmission = false;
      if (existing) {
        // allow re-application if previous application was rejected
        if (existing.mentorStatus !== 'rejected') {
          console.warn(`${TAG} ❌ Duplicate — existing status: ${existing.mentorStatus}`);
          return res.status(409).json({
            success: false,
            message: 'You have already submitted a mentor application.',
            status: existing.mentorStatus,
            applicationId: existing._id,
          });
        }
        isResubmission = true;
        console.log(`${TAG} ℹ️  Found previous rejected application — will treat as re-submission`);
      } else {
        console.log(`${TAG} ✅ No duplicate found`);
      }

    // ── 2. Validate resume file ──────────────────────────────────────────────
    console.log(`${TAG} [2/8] Validating resume file…`);
    const resumeFile = req.files?.resume?.[0];
    if (!resumeFile) {
      console.warn(`${TAG} ❌ Missing resume file`);
      return res.status(400).json({ success: false, message: 'Resume PDF is required.' });
    }
    console.log(`${TAG} ✅ Resume: ${resumeFile.originalname} → ${resumeFile.path} (${(resumeFile.size/1024).toFixed(1)} KB)`);

    // ── 3. Handle optional intro video file ─────────────────────────────────
    console.log(`${TAG} [3/8] Checking intro video…`);
    const introVideoFile = req.files?.introVideo?.[0];
    if (introVideoFile) {
      console.log(`${TAG} ✅ Intro video received: ${introVideoFile.originalname} → ${introVideoFile.path} (${(introVideoFile.size / (1024*1024)).toFixed(2)} MB)`);
    } else {
      console.log(`${TAG} ℹ️  No intro video file uploaded (introVideoUrl from body will be used if provided)`);
    }

    // ── 4. Extract body fields ───────────────────────────────────────────────
    console.log(`${TAG} [4/8] Parsing fields…`);
    const { name, experience, achievements, introVideoUrl, githubUrl, linkedinUrl } = req.body;
    let { skills } = req.body;

    if (!experience) {
      console.warn(`${TAG} ❌ Missing required field: experience`);
      return res.status(400).json({ success: false, message: 'Experience field is required.' });
    }

    // skills may arrive as a JSON array string or comma-separated
    if (typeof skills === 'string') {
      try        { skills = JSON.parse(skills); }
      catch (_)  { skills = skills.split(',').map((s) => s.trim()).filter(Boolean); }
    }
    if (!Array.isArray(skills)) skills = [];
    console.log(`${TAG} ✅ Fields parsed — name="${name}" skills=[${skills.join(', ')}] experience.length=${experience.length} introVideoUrl="${introVideoUrl || 'none'}"`);

    // ── 5. Build public URLs ─────────────────────────────────────────────────
    console.log(`${TAG} [5/8] Building public URLs…`);
    const serverUrl = (process.env.SERVER_URL || 'http://localhost:3500').replace(/\/$/, '');

    const resumeUrl       = `${serverUrl}/uploads/resumes/${resumeFile.filename}`;
    const resumeLocalPath = resumeFile.path;

    // Prefer uploaded file path; fall back to provided URL string
    let finalIntroVideoUrl        = introVideoUrl || '';
    let introVideoLocalPath       = '';
    if (introVideoFile) {
      finalIntroVideoUrl    = `${serverUrl}/uploads/intros/${introVideoFile.filename}`;
      introVideoLocalPath   = introVideoFile.path;
      console.log(`${TAG} ✅ Intro video public URL : ${finalIntroVideoUrl}`);
      console.log(`${TAG} ✅ Intro video local path : ${introVideoLocalPath}`);
    } else if (finalIntroVideoUrl) {
      console.log(`${TAG} ℹ️  Using provided introVideoUrl (link): ${finalIntroVideoUrl}`);
    } else {
      console.log(`${TAG} ℹ️  No intro video provided`);
    }
    console.log(`${TAG} ✅ Resume public URL  : ${resumeUrl}`);
    console.log(`${TAG} ✅ Resume local path  : ${resumeLocalPath}`);

    // ── 6. Persist to MongoDB ────────────────────────────────────────────────
    console.log(`${TAG} [6/8] Saving application to MongoDB…`);
    let application;
    if (isResubmission && existing) {
      existing.name = name || user.name || existing.name;
      existing.skills = skills;
      existing.experience = experience;
      existing.achievements = achievements || existing.achievements;
      existing.resumeUrl = resumeUrl;
      existing.resumeLocalPath = resumeLocalPath;
      existing.introVideoUrl = finalIntroVideoUrl || existing.introVideoUrl;
      existing.introVideoLocalPath = introVideoLocalPath || existing.introVideoLocalPath;
      existing.githubUrl = githubUrl || existing.githubUrl;
      existing.linkedinUrl = linkedinUrl || existing.linkedinUrl;
      existing.mentorStatus = 'pending';
      existing.submittedAt = new Date();
      existing.aiEvaluation = {}; // reset previous evaluation
      application = await existing.save();
      console.log(`${TAG} ✅ Existing application updated — _id: ${application._id}`);
    } else {
      application = await MentorApplication.create({
        userId,
        name:                name || user.name || '',
        skills,
        experience,
        achievements:        achievements || '',
        resumeUrl,
        resumeLocalPath,
        introVideoUrl:       finalIntroVideoUrl,
        introVideoLocalPath,
        githubUrl:           githubUrl    || '',
        linkedinUrl:         linkedinUrl  || '',
        mentorStatus:        'pending',
      });
      console.log(`${TAG} ✅ Application saved — _id: ${application._id}`);
    }

    // ── 7. Fire AI evaluation asynchronously ────────────────────────────────
    console.log(`${TAG} [7/8] Triggering async AI evaluation for ${application._id}…`);
    setImmediate(() => runEvaluation(application._id.toString()));
    console.log(`${TAG} ✅ AI evaluation queued (fire-and-forget)`);

    // ── 8. Respond ───────────────────────────────────────────────────────────
    console.log(`${TAG} [8/8] Sending 201 response`);
    console.log(`${'═'.repeat(60)}\n`);
    return res.status(201).json({
      success: true,
      message: 'Mentor application submitted. AI evaluation is running in the background.',
      applicationId:  application._id,
      status:         application.mentorStatus,
      introVideoUrl:  finalIntroVideoUrl || null,
      hasVideoFile:   !!introVideoFile,
    });

  } catch (err) {
    console.error(`${TAG} ❌ Unexpected error:`, err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── GET /mentor-application/my ────────────────────────────────────────────────
const getMyApplication = async (req, res) => {
  const TAG = '[getMyApplication]';
  console.log(`${TAG} userId=${req.userId}`);
  try {
    const application = await MentorApplication.findOne({ userId: req.userId }).select('-resumeLocalPath -introVideoLocalPath');
    if (!application) {
      console.log(`${TAG} No application found for userId=${req.userId}`);
      return res.status(404).json({ success: false, message: 'No mentor application found.' });
    }
    console.log(`${TAG} Found application _id=${application._id} status=${application.mentorStatus} aiScore=${application.aiEvaluation?.finalScore}`);
    return res.json({ success: true, application });
  } catch (err) {
    console.error(`${TAG} Error:`, err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { submitApplication, getMyApplication };

