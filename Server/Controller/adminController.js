const MentorApplication = require('../Model/MentorApplication');
const User              = require('../Model/UserModel');
const { runEvaluation } = require('../services/aiMentorEvaluation');

// ── GET /api/admin/mentors/pending  (supports ?status=pending|approved|rejected) ──
const getPendingMentors = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status filter.' });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [applications, total] = await Promise.all([
      MentorApplication.find({ mentorStatus: status })
        .populate('userId', 'name email role averageRating')
        .select('-resumeLocalPath')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      MentorApplication.countDocuments({ mentorStatus: status }),
    ]);

    return res.json({
      success: true,
      total,
      page:  Number(page),
      pages: Math.ceil(total / Number(limit)),
      applications,
    });
  } catch (err) {
    console.error('[adminController] getPendingMentors:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── GET /api/admin/mentors/:id ────────────────────────────────────────────────
const getMentorApplicationById = async (req, res) => {
  try {
    const application = await MentorApplication.findById(req.params.id)
      .populate('userId', 'name email role averageRating skills bio experience linkedin github')
      .select('-resumeLocalPath');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    return res.json({ success: true, application });
  } catch (err) {
    console.error('[adminController] getMentorApplicationById:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── PATCH /api/admin/mentor/:id/approve ───────────────────────────────────────
const approveMentor = async (req, res) => {
  try {
    const application = await MentorApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    application.mentorStatus = 'approved';
    application.reviewedAt   = new Date();
    await application.save();

    // Ensure the linked user account has role='mentor'
    await User.findByIdAndUpdate(application.userId, { role: 'mentor' });

    // send approval email to the applicant (best-effort)
    try {
      const applicant = await User.findById(application.userId).select('name email');
      if (applicant && applicant.email) {
        const emailService = require('../services/emailService');
        const sent = await emailService.sendMentorApprovalEmail({ mentorEmail: applicant.email, mentorName: applicant.name || 'Mentor' });
        if (sent) console.log(`[adminController] Approval email sent to ${applicant.email}`);
        else console.warn(`[adminController] Failed to send approval email to ${applicant.email}`);
      }
    } catch (emailErr) {
      console.error('[adminController] Error while sending approval email:', emailErr.message);
    }

    return res.json({
      success: true,
      message: 'Mentor application approved successfully.',
      applicationId:  application._id,
      mentorStatus:   application.mentorStatus,
    });
  } catch (err) {
    console.error('[adminController] approveMentor:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── PATCH /api/admin/mentor/:id/reject ────────────────────────────────────────
const rejectMentor = async (req, res) => {
  try {
    const application = await MentorApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // allow admin to pass an optional reason for rejection
    const { reason } = req.body || {};

    application.mentorStatus = 'rejected';
    application.reviewedAt   = new Date();
    await application.save();

    // notify applicant via email (best-effort)
    try {
      const User = require('../Model/UserModel');
      const applicant = await User.findById(application.userId).select('name email');
      if (applicant && applicant.email) {
        const emailService = require('../services/emailService');
        const sent = await emailService.sendMentorRejectionEmail({
          mentorEmail: applicant.email,
          mentorName:  applicant.name || 'Applicant',
          reason,
        });
        if (sent) console.log(`[adminController] Rejection email sent to ${applicant.email}`);
        else console.warn(`[adminController] Failed to send rejection email to ${applicant.email}`);
      } else {
        console.warn('[adminController] Applicant email not found — skipping email');
      }
    } catch (emailErr) {
      console.error('[adminController] Error while sending rejection email:', emailErr.message);
    }

    return res.json({
      success: true,
      message: 'Mentor application rejected.',
      applicationId:  application._id,
      mentorStatus:   application.mentorStatus,
    });
  } catch (err) {
    console.error('[adminController] rejectMentor:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── POST /api/admin/mentor/:id/re-evaluate ────────────────────────────────────
const retriggerEvaluation = async (req, res) => {
  try {
    const application = await MentorApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    // Pass forceEvaluation=true to bypass redundancy check and re-analyze video
    setImmediate(() => runEvaluation(application._id.toString(), true));

    return res.json({ success: true, message: 'AI re-evaluation triggered (forced).' });
  } catch (err) {
    console.error('[adminController] retriggerEvaluation:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  getPendingMentors,
  getMentorApplicationById,
  approveMentor,
  rejectMentor,
  retriggerEvaluation,
};
