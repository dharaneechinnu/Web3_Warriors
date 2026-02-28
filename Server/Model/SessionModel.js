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
    date: { type: Date, required: true },
    duration: { type: Number, default: 60 }, // in minutes
    price: { type: Number, required: true, min: 0 }, // token cost
    status: {
        type: String,
        enum: ['available', 'pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
        default: 'available'
    },
    meetingLink: { type: String, default: '' },
    learnerNotes: { type: String, default: '' }, // notes from learner when booking
    mentorNotes: { type: String, default: '' },  // notes from mentor
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
