const mongoose = require('mongoose');

const MentorSlotSchema = new mongoose.Schema({
    mentorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    availabilityId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'MentorAvailability',
        default: null
    },
    startTime: { 
        type: Date, 
        required: true // full datetime of slot start
    },
    endTime: { 
        type: Date, 
        required: true // full datetime of slot end
    },
    status: { 
        type: String,
        enum: ['available', 'pending', 'booked'],
        default: 'available'
    },
    mentorshipRequestId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'MentorshipRequest',
        default: null 
    },
    sessionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Session',
        default: null 
    },
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    bookedAt: {
        type: Date,
        default: null
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

MentorSlotSchema.index({ mentorId: 1, status: 1 });
MentorSlotSchema.index({ mentorId: 1, startTime: 1 });
MentorSlotSchema.index({ status: 1 });
MentorSlotSchema.index({ availabilityId: 1 });

module.exports = mongoose.model('MentorSlot', MentorSlotSchema);
