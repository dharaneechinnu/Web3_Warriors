const MentorSlot = require('../Model/MentorSlotModel');
const MentorAvailability = require('../Model/MentorAvailabilityModel');
const User = require('../Model/UserModel');

// Helper: Validate that slot date/time is in the future
const validateFutureSlot = (date, startTime) => {
    // Parse provided date and time as IST
    const slotDateTime = parseIST(date, startTime);
    
    // Get current time in IST
    const now = new Date();
    
    console.log(`[validateFutureSlot] Slot: ${slotDateTime.toISOString()}, Now: ${now.toISOString()}`);
    
    // Check if slot start time is in the past
    if (slotDateTime <= now) {
        const dateStr = new Date(slotDateTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short' });
        const timeStr = new Date(slotDateTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', timeStyle: 'short' });
        
        return {
            valid: false,
            message: `Cannot create slots for past date/time (${dateStr} ${timeStr} IST). Please select a future date and time.`
        };
    }
    
    return { valid: true, message: "" };
};

// Helper: parse a "YYYY-MM-DD" + "HH:MM" pair as IST (Asia/Kolkata, UTC+5:30)
// so that a mentor entering "09:00" gets 09:00 IST stored, not 09:00 UTC.
const parseIST = (date, time) => new Date(`${date}T${time}:00+05:30`);

// Helper: Generate 60-minute slots from start to end time
// Parses input times as IST so the stored UTC value correctly reflects
// what the mentor sees on their clock.
const generateSlots = (date, startTime, endTime, mentorId) => {
    const slots = [];

    let cursor  = parseIST(date, startTime);
    const endMs = parseIST(date, endTime).getTime();

    while (cursor.getTime() < endMs) {
        const slotEnd = new Date(cursor.getTime() + 60 * 60000); // +1 hour
        if (slotEnd.getTime() <= endMs) {
            slots.push({
                mentorId,
                availabilityId: null,
                startTime: new Date(cursor),
                endTime:   new Date(slotEnd),
                status: 'available'
            });
        }
        cursor = new Date(cursor.getTime() + 60 * 60000);
    }

    return slots;
};

// Mongoose ObjectId validator (avoids CastError 500s)
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// IST locale helper — used for human-readable display strings
const toIST = (d, opts) => d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', ...opts });

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

        // CRITICAL: Validate that slot is for future date/time (server-side)
        const futureValidation = validateFutureSlot(date, startTime);
        if (!futureValidation.valid) {
            console.log(`[createSlots] Validation failed: ${futureValidation.message}`);
            return res.status(400).json({
                success: false,
                message: futureValidation.message
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
        console.log(`[createSlots] Created ${createdSlots.length} slots for mentor ${mentorId}`);

        res.status(201).json({
            success: true,
            message: `Created ${createdSlots.length} time slots`,
            slots: createdSlots
        });
    } catch (error) {
        console.error('[createSlots] error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ── GET AVAILABLE SLOTS FOR A MENTOR ────────────────────────────────────────────
// IMPORTANT: Only returns slots where endTime > current time (no expired slots)
exports.getAvailableSlots = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const { date } = req.query;

        // Guard: reject non-ObjectId strings before Mongoose CastError
        if (!isValidObjectId(mentorId)) {
            return res.status(400).json({ success: false, message: 'Invalid mentor ID format' });
        }

        // Validate mentor exists
        const mentor = await User.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({ success: false, message: 'Mentor not found' });
        }

        // Get current time in server (ISO format)
        const now = new Date();
        console.log(`[getAvailableSlots] Filtering slots for time ${now.toISOString()}`);

        const filter = { 
            mentorId, 
            status: 'available',
            // CRITICAL: Only show slots where endTime > now (exclude expired slots)
            endTime: { $gt: now }
        };

        if (date) {
            // Filter for a specific IST date — use IST midnight to IST 23:59
            filter.startTime = {
                $gte: parseIST(date, '00:00'),
                $lte: new Date(parseIST(date, '23:59').getTime() + 59000)
            };
        } else {
            // Use start of today (UTC midnight) so slots created for today
            // still appear even if their wall-clock time has already passed.
            // Also extends the window to 90 days for forward-planning mentors.
            const startOfToday = new Date();
            startOfToday.setUTCHours(0, 0, 0, 0);

            const ninetyDaysLater = new Date(startOfToday);
            ninetyDaysLater.setUTCDate(ninetyDaysLater.getUTCDate() + 90);

            filter.startTime = { $gte: startOfToday, $lte: ninetyDaysLater };
        }

        const slots = await MentorSlot.find(filter).sort({ startTime: 1 }).lean();

        console.log(`[getAvailableSlots] Found ${slots.length} non-expired slots for mentor ${mentorId}`);

        res.json({
            success: true,
            count: slots.length,
            slots: slots.map(slot => ({
                _id:         slot._id,
                date:        toIST(slot.startTime, { dateStyle: 'medium' }),
                startTime:   toIST(slot.startTime, { hour: '2-digit', minute: '2-digit', hour12: true }),
                endTime:     toIST(slot.endTime,   { hour: '2-digit', minute: '2-digit', hour12: true }),
                displayText: toIST(slot.startTime, { dateStyle: 'medium', timeStyle: 'short' }),
                startTimeRaw: slot.startTime,
                endTimeRaw:   slot.endTime,
                isExpired: slot.endTime <= now
            }))
        });
    } catch (error) {
        console.error('[getAvailableSlots] error:', error);
        res.status(500).json({ success: false, message: error.message });
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
// Returns ALL slots (including expired) with status indicator - FOR MENTOR DASHBOARD
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

        // Fetch all slots for this mentor (including expired)
        const slots = await MentorSlot.find({ mentorId })
            .sort({ startTime: -1 });

        // Get current time for expiration checking
        const now = new Date();

        // Add expiration status to each slot for frontend display
        const slotsWithStatus = slots.map(slot => ({
            ...slot.toObject(),
            isExpired: slot.endTime <= now,
            displayStatus: slot.endTime <= now ? 'expired' : slot.status
        }));

        res.json({
            success: true,
            count: slots.length,
            slots: slotsWithStatus
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ── CLEANUP EXPIRED SLOTS ──────────────────────────────────────────────────────
// OPTIONAL: Can be called manually or via cron job to clean up database
// Permanently deletes slots where endTime has passed
exports.cleanupExpiredSlots = async (req, res) => {
    try {
        const now = new Date();
        
        // Delete all slots where endTime <= now
        const result = await MentorSlot.deleteMany({
            endTime: { $lte: now }
        });

        console.log(`[cleanupExpiredSlots] Deleted ${result.deletedCount} expired slots at ${now.toISOString()}`);

        res.json({
            success: true,
            message: `Cleaned up ${result.deletedCount} expired slots`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('[cleanupExpiredSlots] error:', error);
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
