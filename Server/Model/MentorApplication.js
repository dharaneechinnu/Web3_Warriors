const mongoose = require('mongoose');

const aiEvaluationSchema = new mongoose.Schema(
  {
    githubScore:     { type: Number, default: 0 },
    linkedinScore:   { type: Number, default: 0 },
    resumeScore:     { type: Number, default: 0 },
    introVideoScore: { type: Number, default: 0 },
    finalScore:      { type: Number, default: 0 },
    recommendation:  { type: String, enum: ['approve', 'review', 'reject'], default: 'review' },
    reason:          { type: String, default: '' },
    evaluatedAt:     { type: Date, default: null },
    // Gemini Vision video analysis breakdown
    videoAnalysis: {
      presentationScore:  { type: Number, default: 0 },
      communicationScore: { type: Number, default: 0 },
      contentScore:       { type: Number, default: 0 },
      overallVideoScore:  { type: Number, default: 0 },
      feedback:           { type: String, default: '' },
      method:             { type: String, default: '' },
    },
  },
  { _id: false }
);

const mentorApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UsersLogins',
      required: true,
      unique: true,
    },
    name:         { type: String, required: true, trim: true },
    skills:       [{ type: String, trim: true }],
    experience:   { type: String, required: true },
    achievements: { type: String, default: '' },
    resumeUrl:       { type: String, required: true },       // public URL served via /uploads
    resumeLocalPath: { type: String, default: '' },           // local disk path for pdf-parse
    introVideoUrl:   { type: String, default: '' },           // public URL (link or uploaded)
    introVideoLocalPath: { type: String, default: '' },       // local disk path for analysis
    githubUrl:    { type: String, default: '' },
    linkedinUrl:  { type: String, default: '' },
    mentorStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    aiEvaluation: { type: aiEvaluationSchema, default: () => ({}) },
    submittedAt:  { type: Date, default: Date.now },
    reviewedAt:   { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MentorApplication', mentorApplicationSchema);
