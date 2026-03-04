const MentorAvailability = require('../Model/MentorAvailabilityModel');
const MentorSlot = require('../Model/MentorSlotModel');
const User = require('../Model/UserModel');

// Helper function to convert time string (HH:MM) to minutes
const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

// Helper function to convert minutes to time string (HH:MM)
const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Helper to generate slots for a specific date based on availability
const generateSlotsForDate = async (availability, date) => {
    const slots = [];
    const startMinutes = timeToMinutes(availability.startTime);
    const endMinutes = timeToMinutes(availability.endTime);
    const duration = availability.sessionDuration;

    let currentMinutes = startMinutes;
    while (currentMinutes + duration <= endMinutes) {
        const slotStartTime = new Date(date);
        slotStartTime.setHours(
            Math.floor(currentMinutes / 60),
            currentMinutes % 60,
            0,
            0
        );

        const slotEndTime = new Date(slotStartTime);
        slotEndTime.setMinutes(slotEndTime.getMinutes() + duration);

        slots.push({
            mentorId: availability.mentorId,
            availabilityId: availability._id,
            startTime: slotStartTime,
            endTime: slotEndTime,
            status: 'available'
        });

        currentMinutes += duration;
    }

    return slots;
};

// ── SET/UPDATE MENTOR AVAILABILITY ─────────────────────────────────────────────
exports.setAvailability = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const { dayOfWeek, startTime, endTime, sessionDuration } = req.body;

        // Validate mentor
        const mentor = await User.findById(mentorId);
        if (!mentor || mentor.role !== 'mentor') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only mentors can set availability' 
            });
        }

        // Validate inputs
        if (!dayOfWeek || !startTime || !endTime || !sessionDuration) {
            return res.status(400).json({ 
                success: false, 
                message: 'dayOfWeek, startTime, endTime, and sessionDuration are required' 
            });
        }

        const startMin = timeToMinutes(startTime);
        const endMin = timeToMinutes(endTime);
        if (startMin >= endMin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Start time must be before end time' 
            });
        }

        // Check if availability already exists for this day
        let availability = await MentorAvailability.findOne({
            mentorId,
            dayOfWeek: dayOfWeek.toLowerCase()
        });

        if (availability) {
            // Update existing
            availability.startTime = startTime;
            availability.endTime = endTime;
            availability.sessionDuration = sessionDuration;
            availability.isActive = true;
            availability.updatedAt = new Date();
        } else {
            // Create new
            availability = new MentorAvailability({
                mentorId,
                dayOfWeek: dayOfWeek.toLowerCase(),
                startTime,
                endTime,
                sessionDuration
            });
        }

        await availability.save();

        // Regenerate slots for upcoming occurrences of this day
        await regenerateSlots(mentorId, dayOfWeek.toLowerCase());

        res.status(201).json({ 
            success: true, 
            message: 'Availability set successfully',
            availability 
        });
    } catch (error) {
        console.error('setAvailability error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET MENTOR'S AVAILABILITIES ────────────────────────────────────────────────
exports.getAvailabilities = async (req, res) => {
    try {
        const { mentorId } = req.params;

        const mentor = await User.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({ 
                success: false, 
                message: 'Mentor not found' 
            });
        }

        const availabilities = await MentorAvailability.find({ 
            mentorId,
            isActive: true 
        }).sort({ dayOfWeek: 1 });

        res.json({ 
            success: true, 
            availabilities 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── DELETE AVAILABILITY ────────────────────────────────────────────────────────
exports.deleteAvailability = async (req, res) => {
    try {
        const { availabilityId } = req.params;
        const { mentorId } = req.body;

        const availability = await MentorAvailability.findById(availabilityId);
        if (!availability) {
            return res.status(404).json({ 
                success: false, 
                message: 'Availability not found' 
            });
        }

        if (availability.mentorId.toString() !== mentorId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        availability.isActive = false;
        availability.updatedAt = new Date();
        await availability.save();

        // Delete associated available slots
        await MentorSlot.deleteMany({
            availabilityId: availabilityId,
            status: 'available'
        });

        res.json({ 
            success: true, 
            message: 'Availability deleted' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── REGENERATE SLOTS FOR A DAY ─────────────────────────────────────────────────
const regenerateSlots = async (mentorId, dayOfWeek, daysAhead = 30) => {
    try {
        const availability = await MentorAvailability.findOne({ 
            mentorId, 
            dayOfWeek,
            isActive: true 
        });

        if (!availability) return;

        // Delete existing available slots for this availability
        await MentorSlot.deleteMany({
            availabilityId: availability._id,
            status: 'available'
        });

        // Generate slots for next N occurrences of this day
        const dayMap = {
            'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6,
            'sunday': 0
        };
        const targetDay = dayMap[dayOfWeek];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const newSlots = [];
        for (let i = 0; i < daysAhead; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);

            if (date.getDay() === targetDay) {
                const slotsForDate = await generateSlotsForDate(availability, date);
                newSlots.push(...slotsForDate);
            }
        }

        if (newSlots.length > 0) {
            await MentorSlot.insertMany(newSlots);
        }
    } catch (error) {
        console.error('regenerateSlots error:', error);
    }
};

// ── MANUALLY TRIGGER SLOT GENERATION ───────────────────────────────────────────
exports.generateSlots = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const { daysAhead = 30 } = req.body;

        const mentor = await User.findById(mentorId);
        if (!mentor || mentor.role !== 'mentor') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only mentors can generate slots' 
            });
        }

        // Get all active availabilities
        const availabilities = await MentorAvailability.find({ 
            mentorId,
            isActive: true 
        });

        if (availabilities.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No active availabilities set' 
            });
        }

        // Regenerate for all days
        for (const availability of availabilities) {
            await regenerateSlots(mentorId, availability.dayOfWeek, daysAhead);
        }

        res.json({ 
            success: true, 
            message: `Slots generated for next ${daysAhead} days` 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET AVAILABLE SLOTS FOR A MENTOR ───────────────────────────────────────────
exports.getAvailableSlots = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const { fromDate, toDate } = req.query;

        const mentor = await User.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({ 
                success: false, 
                message: 'Mentor not found' 
            });
        }

        const filter = { mentorId, status: 'available' };

        if (fromDate || toDate) {
            filter.startTime = {};
            if (fromDate) filter.startTime.$gte = new Date(fromDate);
            if (toDate) filter.startTime.$lte = new Date(toDate);
        } else {
            // Default: get slots for next 30 days
            const now = new Date();
            const thirtyDaysLater = new Date(now);
            thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
            filter.startTime = { $gte: now, $lte: thirtyDaysLater };
        }

        const slots = await MentorSlot.find(filter)
            .sort({ startTime: 1 })
            .populate('availabilityId');

        res.json({ 
            success: true, 
            slots 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
