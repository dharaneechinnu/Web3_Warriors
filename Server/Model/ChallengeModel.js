const mongoose = require('mongoose');

const ChallengeSubmissionSchema = new mongoose.Schema({
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'UsersLogins', required: true },
    learnerName: { type: String, required: true },
    learnerEmail: { type: String },
    submissionText: { type: String },
    submissionUrl: { type: String },
    fileUrl: { type: String },
    fileName: { type: String },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['submitted', 'reviewed', 'rewarded'], default: 'submitted' },
    rank: { type: Number, default: null },
    rewardTokens: { type: Number, default: 0 },
    feedback: { type: String },
    score: { type: Number, min: 0, max: 100 },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UsersLogins' }
});

const ChallengeSchema = new mongoose.Schema({
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'UsersLogins', required: true },
    mentorName: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, default: 'general' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'expert'], default: 'medium' },
    deadline: { type: Date, required: true },
    rewardTokens: { type: Number, required: true, default: 100, min: 0 },
    maxParticipants: { type: Number, default: 0 }, // 0 = unlimited
    status: { type: String, enum: ['draft', 'published', 'closed', 'completed'], default: 'draft' },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UsersLogins' }],
    submissions: [ChallengeSubmissionSchema],
    tags: [{ type: String }],
    requirements: { type: String },
    judgingCriteria: { type: String },
    prizeDistribution: {
        first: { type: Number, default: 50 },
        second: { type: Number, default: 30 },
        third: { type: Number, default: 20 }
    },
    rewardsDistributed: { type: Boolean, default: false },
    thumbnail: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

ChallengeSchema.index({ mentorId: 1 });
ChallengeSchema.index({ status: 1 });
ChallengeSchema.index({ deadline: 1 });

module.exports = mongoose.model('Challenge', ChallengeSchema);
