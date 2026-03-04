const mongoose = require('mongoose');

const MentorAvailabilitySchema = new mongoose.Schema({
    mentorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    dayOfWeek: { 
        type: String, 
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        required: true 
    },
    startTime: { 
        type: String, 
        required: true // format: "HH:MM" (24-hour)
    },
    endTime: { 
        type: String, 
        required: true // format: "HH:MM" (24-hour)
    },
    sessionDuration: { 
        type: Number, 
        required: true, // in minutes (30, 45, 60, 90, 120)
        enum: [30, 45, 60, 90, 120]
    },
    isActive: { 
        type: Boolean, 
        default: true 
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

// Ensure only one availability per day per mentor
MentorAvailabilitySchema.index({ mentorId: 1, dayOfWeek: 1 }, { unique: true });
MentorAvailabilitySchema.index({ mentorId: 1, isActive: 1 });

module.exports = mongoose.model('MentorAvailability', MentorAvailabilitySchema);
