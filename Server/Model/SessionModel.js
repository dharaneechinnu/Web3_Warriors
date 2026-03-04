const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'UsersLogins', required: true },
    mentorName: { type: String, required: true },
    mentorEmail: { type: String },
    learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'UsersLogins', default: null },
    learnerName: { type: String, default: null },
    learnerEmail: { type: String, default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    topic: { type: String, default: '' },
    date: { type: Date, required: false },      // mentor's open-slot date
    scheduledAt: { type: Date, default: null }, // confirmed time set on accept
    duration: { type: Number, default: 60 },    // minutes
    price: { type: Number, default: 0, min: 0 },
    status: {
        type: String,
        enum: ['available', 'requested', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
        default: 'available'
    },

    // ── WebRTC room ────────────────────────────────────────────────────────────
    roomId: { type: String, default: null },    // UUID set when mentor confirms
    meetingLink: { type: String, default: '' }, // /room/:roomId (internal)

    // ── Slot-based mentorship booking ─────────────────────────────────────────
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorSlot', default: null }, // linked slot
    mentorshipRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorshipRequest', default: null }, // request that created this

    // ── Learner-initiated request ──────────────────────────────────────────────
    requestedTimes: [{ type: Date }],           // preferred slots sent by learner
    learnerMessage: { type: String, default: '' }, // learner's request message

    learnerNotes: { type: String, default: '' },
    mentorNotes: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, default: '' },
    ratedAt: { type: Date },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelledBy: { type: String, enum: ['mentor', 'learner', null], default: null },
    cancelReason: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

SessionSchema.index({ mentorId: 1 });
SessionSchema.index({ learnerId: 1 });
SessionSchema.index({ status: 1 });
SessionSchema.index({ date: 1 });

module.exports = mongoose.model('Session', SessionSchema);
