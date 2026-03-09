const mongoose = require('mongoose');

const MentorshipRequestSchema = new mongoose.Schema({
    mentorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'UsersLogins', 
        required: true 
    },
    learnerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'UsersLogins', 
        required: true 
    },
    slotId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'MentorSlot', 
        required: true 
    },
    topic: { 
        type: String, 
        required: true,
        trim: true 
    },
    message: { 
        type: String, 
        default: '',
        trim: true 
    },
    status: { 
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    rejectReason: { 
        type: String, 
        default: '' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    respondedAt: { 
        type: Date, 
        default: null 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    // ── Web3 / on-chain fields ──────────────────────────────────────────────
    /// Booking ID returned by the SkillPlatform.bookSession() transaction
    onChainBookingId: {
        type: Number,
        default: null
    },
    /// Ethereum transaction hash of the bookSession() call
    txHash: {
        type: String,
        default: null
    },
    /// Session price in wei at the time of booking (for reference / refund display)
    priceWei: {
        type: String,
        default: null
    }
});

MentorshipRequestSchema.index({ mentorId: 1, status: 1 });
MentorshipRequestSchema.index({ learnerId: 1, status: 1 });
MentorshipRequestSchema.index({ slotId: 1 });
MentorshipRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('MentorshipRequest', MentorshipRequestSchema);
