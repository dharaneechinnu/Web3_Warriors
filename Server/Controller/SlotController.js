const MentorSlot = require('../Model/MentorSlotModel');
const MentorAvailability = require('../Model/MentorAvailabilityModel');
const User = require('../Model/UserModel');

// Helper: Generate 60-minute slots from start to end time
const generateSlots = (date, startTime, endTime, mentorId) => {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentDate = new Date(date);
    currentDate.setHours(startHour, startMin, 0, 0);
    
    const endDateTime = new Date(date);
    endDateTime.setHours(endHour, endMin, 0, 0);
    
    while (currentDate < endDateTime) {
        const slotStart = new Date(currentDate);
        const slotEnd = new Date(currentDate);
        slotEnd.setHours(slotEnd.getHours() + 1); // 60-minute slots
        
        if (slotEnd <= endDateTime) {
            slots.push({
                mentorId,
                availabilityId: null, // Direct slot creation, not from availability
                startTime: new Date(slotStart),
                endTime: new Date(slotEnd),
                status: 'available'
            });
        }
        
        currentDate.setHours(currentDate.getHours() + 1);
    }
    
    return slots;
};

// ── CREATE SLOTS FOR A MENTOR ──────────────────────────────────────────────────
exports.createSlots = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const { date, startTime, endTime } = req.body;

        // Validate inputs
        if (!date || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Date, start time, and end time are required'
            });
        }

        // Validate mentor exists
        const mentor = await User.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        // Generate slots (60 minutes each)
        const slots = generateSlots(date, startTime, endTime, mentorId);

        if (slots.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid time range. End time must be at least 1 hour after start time.'
            });
        }

        // Insert slots into database
        const createdSlots = await MentorSlot.insertMany(slots);

        res.status(201).json({
            success: true,
            message: `Created ${createdSlots.length} time slots`,
            slots: createdSlots
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ── GET AVAILABLE SLOTS FOR A MENTOR ────────────────────────────────────────────
exports.getAvailableSlots = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const { date } = req.query;

        // Validate mentor exists
        const mentor = await User.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        // Build query filter
        const filter = {
            mentorId,
            status: 'available'
        };

        // If date is specified, filter for that date
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            filter.startTime = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        } else {
            // Default: show slots from today onwards (next 30 days)
            const now = new Date();
            const thirtyDaysLater = new Date(now);
            thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
            
            filter.startTime = {
                $gte: now,
                $lte: thirtyDaysLater
            };
        }

        // Fetch slots sorted by start time
        const slots = await MentorSlot.find(filter)
            .sort({ startTime: 1 })
            .lean();

        res.json({
            success: true,
            slots: slots.map(slot => ({
                _id: slot._id,
                date: slot.startTime.toLocaleDateString('en-IN'),
                startTime: slot.startTime.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }),
                endTime: slot.endTime.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }),
                displayText: `${slot.startTime.toLocaleDateString('en-IN')} – ${slot.startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
                startTimeRaw: slot.startTime,
                endTimeRaw: slot.endTime
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ── BOOK A SLOT (Mark as booked) ────────────────────────────────────────────────
exports.bookSlot = async (req, res) => {
    try {
        const { slotId, learnerId } = req.body;

        if (!slotId || !learnerId) {
            return res.status(400).json({
                success: false,
                message: 'Slot ID and learner ID are required'
            });
        }

        // Find and update slot
        const slot = await MentorSlot.findById(slotId);

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found'
            });
        }

        if (slot.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Slot is not available'
            });
        }

        // Mark as booked
        slot.status = 'booked';
        slot.bookedBy = learnerId;
        slot.bookedAt = new Date();
        await slot.save();

        res.json({
            success: true,
            message: 'Slot booked successfully',
            slot
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ── GET ALL SLOTS FOR A MENTOR ──────────────────────────────────────────────────
exports.getMentorSlots = async (req, res) => {
    try {
        const { mentorId } = req.params;

        // Validate mentor exists
        const mentor = await User.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({
                success: false,
                message: 'Mentor not found'
            });
        }

        // Fetch all slots for this mentor
        const slots = await MentorSlot.find({ mentorId })
            .sort({ startTime: -1 });

        res.json({
            success: true,
            slots
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ── DELETE A SLOT ──────────────────────────────────────────────────────────────
exports.deleteSlot = async (req, res) => {
    try {
        const { slotId } = req.params;

        const slot = await MentorSlot.findByIdAndDelete(slotId);

        if (!slot) {
            return res.status(404).json({
                success: false,
                message: 'Slot not found'
            });
        }

        res.json({
            success: true,
            message: 'Slot deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
