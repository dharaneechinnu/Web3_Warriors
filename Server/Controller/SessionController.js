const Session = require('../Model/SessionModel');
const User = require('../Model/UserModel');

// ─── CREATE SESSION SLOT (Mentor) ─────────────────────────────────────────────
exports.createSession = async (req, res) => {
    try {
        const { mentorId, title, description, topic, date, duration, price, meetingLink } = req.body;

        if (!mentorId || !title || !date || price === undefined) {
            return res.status(400).json({ success: false, message: 'mentorId, title, date, and price are required' });
        }

        const mentor = await User.findById(mentorId);
        if (!mentor || mentor.role !== 'mentor') {
            return res.status(403).json({ success: false, message: 'Only mentors can create sessions' });
        }

        const session = await Session.create({
            mentorId,
            mentorName: mentor.name,
            mentorEmail: mentor.email,
            title,
            description: description || '',
            topic: topic || '',
            date: new Date(date),
            duration: Number(duration) || 60,
            price: Number(price),
            meetingLink: meetingLink || '',
            status: 'available'
        });

        res.status(201).json({ success: true, session });
    } catch (error) {
        console.error('createSession error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET ALL AVAILABLE SESSIONS ───────────────────────────────────────────────
exports.getSessions = async (req, res) => {
    try {
        const { mentorId, status } = req.query;
        const filter = {};

        if (mentorId) filter.mentorId = mentorId;
        if (status) {
            filter.status = status;
        } else {
            filter.status = 'available';
        }

        const sessions = await Session.find(filter).sort({ date: 1 });
        res.json({ success: true, sessions });
    } catch (error) {
        console.error('getSessions error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET MENTOR'S SESSIONS ────────────────────────────────────────────────────
exports.getMentorSessions = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const sessions = await Session.find({ mentorId }).sort({ date: -1 });
        res.json({ success: true, sessions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET LEARNER'S BOOKED SESSIONS ───────────────────────────────────────────
exports.getLearnerSessions = async (req, res) => {
    try {
        const { learnerId } = req.params;
        const sessions = await Session.find({ learnerId }).sort({ date: -1 });
        res.json({ success: true, sessions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET SESSION BY ID ────────────────────────────────────────────────────────
exports.getSessionById = async (req, res) => {
    try {
        const session = await Session.findById(req.params.id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
        res.json({ success: true, session });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── BOOK SESSION (Learner) ───────────────────────────────────────────────────
exports.bookSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { learnerId, learnerNotes } = req.body;

        const session = await Session.findById(id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
        if (session.status !== 'available') {
            return res.status(400).json({ success: false, message: 'Session is not available for booking' });
        }
        if (session.mentorId.toString() === learnerId) {
            return res.status(400).json({ success: false, message: 'Mentors cannot book their own session' });
        }

        const learner = await User.findById(learnerId);
        if (!learner) return res.status(404).json({ success: false, message: 'Learner not found' });

        if ((learner.tokenBalance || 0) < session.price) {
            return res.status(400).json({
                success: false,
                message: `Insufficient tokens. Session costs ${session.price} tokens but you have ${learner.tokenBalance}.`
            });
        }

        // Hold tokens (deduct now, payout to mentor on completion)
        learner.tokenBalance -= session.price;
        learner.transactionHistory.push({
            transactionType: 'spend',
            amount: session.price,
            description: `Session booking: ${session.title} with ${session.mentorName}`,
            timestamp: new Date()
        });
        await learner.save();

        session.learnerId = learnerId;
        session.learnerName = learner.name;
        session.learnerEmail = learner.email;
        session.learnerNotes = learnerNotes || '';
        session.status = 'pending';
        session.updatedAt = new Date();
        await session.save();

        res.json({ success: true, message: 'Session booked. Waiting for mentor confirmation.', session });
    } catch (error) {
        console.error('bookSession error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── ACCEPT BOOKING (Mentor) ──────────────────────────────────────────────────
exports.acceptBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { mentorId, meetingLink, mentorNotes } = req.body;

        const session = await Session.findById(id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
        if (session.mentorId.toString() !== mentorId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        if (session.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Session is not in pending state' });
        }

        session.status = 'confirmed';
        if (meetingLink) session.meetingLink = meetingLink;
        if (mentorNotes) session.mentorNotes = mentorNotes;
        session.updatedAt = new Date();
        await session.save();

        res.json({ success: true, message: 'Booking confirmed', session });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── REJECT BOOKING (Mentor) ──────────────────────────────────────────────────
exports.rejectBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { mentorId, cancelReason } = req.body;

        const session = await Session.findById(id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
        if (session.mentorId.toString() !== mentorId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        if (!['pending', 'confirmed'].includes(session.status)) {
            return res.status(400).json({ success: false, message: 'Cannot reject this session' });
        }

        // Refund learner
        if (session.learnerId) {
            const learner = await User.findById(session.learnerId);
            if (learner) {
                learner.tokenBalance = (learner.tokenBalance || 0) + session.price;
                learner.transactionHistory.push({
                    transactionType: 'earn',
                    amount: session.price,
                    description: `Refund: Session rejected by ${session.mentorName}`,
                    timestamp: new Date()
                });
                await learner.save();
            }
        }

        session.status = 'rejected';
        session.cancelledBy = 'mentor';
        session.cancelReason = cancelReason || '';
        session.cancelledAt = new Date();
        session.updatedAt = new Date();
        // Reset learner fields so the slot can be reused
        session.learnerId = null;
        session.learnerName = null;
        session.learnerEmail = null;
        session.learnerNotes = '';
        session.status = 'available';
        await session.save();

        res.json({ success: true, message: 'Booking rejected and learner refunded' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── MARK COMPLETE (Mentor) ───────────────────────────────────────────────────
exports.completeSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { mentorId } = req.body;

        const session = await Session.findById(id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
        if (session.mentorId.toString() !== mentorId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        if (session.status !== 'confirmed') {
            return res.status(400).json({ success: false, message: 'Session must be confirmed before completing' });
        }

        // Pay mentor
        const mentor = await User.findById(mentorId);
        if (mentor) {
            mentor.tokenBalance = (mentor.tokenBalance || 0) + session.price;
            mentor.transactionHistory.push({
                transactionType: 'earn',
                amount: session.price,
                description: `Session completed: ${session.title} with ${session.learnerName}`,
                timestamp: new Date()
            });
            await mentor.save();
        }

        session.status = 'completed';
        session.completedAt = new Date();
        session.updatedAt = new Date();
        await session.save();

        res.json({ success: true, message: 'Session marked as completed. Tokens released to mentor.', session });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── CANCEL SESSION ───────────────────────────────────────────────────────────
exports.cancelSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role, cancelReason } = req.body;

        const session = await Session.findById(id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

        const isMentor = session.mentorId.toString() === userId;
        const isLearner = session.learnerId?.toString() === userId;

        if (!isMentor && !isLearner) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        if (['completed', 'cancelled'].includes(session.status)) {
            return res.status(400).json({ success: false, message: 'Cannot cancel this session' });
        }

        // Refund learner if tokens were held
        if (session.learnerId && ['pending', 'confirmed'].includes(session.status)) {
            const learner = await User.findById(session.learnerId);
            if (learner) {
                learner.tokenBalance = (learner.tokenBalance || 0) + session.price;
                learner.transactionHistory.push({
                    transactionType: 'earn',
                    amount: session.price,
                    description: `Refund: Session cancelled (${session.title})`,
                    timestamp: new Date()
                });
                await learner.save();
            }
        }

        session.status = 'cancelled';
        session.cancelledBy = isMentor ? 'mentor' : 'learner';
        session.cancelReason = cancelReason || '';
        session.cancelledAt = new Date();
        session.updatedAt = new Date();
        await session.save();

        res.json({ success: true, message: 'Session cancelled and tokens refunded' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── RATE SESSION (Learner) ───────────────────────────────────────────────────
exports.rateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { learnerId, rating, review } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const session = await Session.findById(id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
        if (session.learnerId?.toString() !== learnerId) {
            return res.status(403).json({ success: false, message: 'Only the session learner can rate' });
        }
        if (session.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Can only rate completed sessions' });
        }
        if (session.rating) {
            return res.status(400).json({ success: false, message: 'Session already rated' });
        }

        session.rating = rating;
        session.review = review || '';
        session.ratedAt = new Date();
        await session.save();

        // Update mentor's average rating
        const mentor = await User.findById(session.mentorId);
        if (mentor) {
            mentor.ratings.push({
                userId: learnerId,
                rating,
                review: review || '',
                category: 'mentorship',
                date: new Date()
            });
            const total = mentor.ratings.reduce((sum, r) => sum + r.rating, 0);
            mentor.averageRating = total / mentor.ratings.length;
            await mentor.save();
        }

        res.json({ success: true, message: 'Session rated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── UPDATE SESSION (Mentor) ──────────────────────────────────────────────────
exports.updateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { mentorId, ...updates } = req.body;

        const session = await Session.findById(id);
        if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
        if (session.mentorId.toString() !== mentorId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        if (!['available', 'pending'].includes(session.status)) {
            return res.status(400).json({ success: false, message: 'Cannot edit a confirmed or completed session' });
        }

        if (updates.date) updates.date = new Date(updates.date);
        updates.updatedAt = new Date();

        const updated = await Session.findByIdAndUpdate(id, updates, { new: true });
        res.json({ success: true, session: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
