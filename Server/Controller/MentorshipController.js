const MentorshipRequest = require('../Model/MentorshipRequestModel');
const MentorSlot = require('../Model/MentorSlotModel');
const Session = require('../Model/SessionModel');
const User = require('../Model/UserModel');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const notifService = require('../services/notificationService');

let io = null;
exports.setIO = (socketIO) => { io = socketIO; };

// ── LEARNER SENDS MENTORSHIP REQUEST ───────────────────────────────────────────
exports.sendMentorshipRequest = async (req, res) => {
    try {
        const { slotId, topic, message } = req.body;
        const learnerId = req.params.learnerId || req.body.learnerId;

        if (!slotId || !topic || !learnerId) {
            return res.status(400).json({ 
                success: false, 
                message: 'slotId, topic, and learnerId are required' 
            });
        }

        // Validate learner
        const learner = await User.findById(learnerId);
        if (!learner) {
            return res.status(404).json({ 
                success: false, 
                message: 'Learner not found' 
            });
        }

        // Get slot
        const slot = await MentorSlot.findById(slotId).populate('mentorId');
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

        // Check if learner already has a request for this slot
        const existingRequest = await MentorshipRequest.findOne({
            slotId,
            learnerId,
            status: { $ne: 'rejected' }
        });

        if (existingRequest) {
            return res.status(400).json({ 
                success: false, 
                message: 'You already have a pending request for this slot' 
            });
        }

        // Create mentorship request
        const request = new MentorshipRequest({
            mentorId: slot.mentorId,
            learnerId,
            slotId,
            topic,
            message: message || '',
            status: 'pending'
        });

        await request.save();

        // Update slot status to pending
        slot.status = 'pending';
        slot.mentorshipRequestId = request._id;
        slot.updatedAt = new Date();
        await slot.save();

        // Emit real-time notification to mentor
        if (io) {
            io.to(`mentor_${slot.mentorId}`).emit('new_mentorship_request', {
                requestId: request._id,
                learnerName: learner.name,
                topic,
                slotId
            });
        }

        // Persist in-app notification for mentor
        const mentorUserId = slot.mentorId._id || slot.mentorId;
        await notifService.createNotification({
            userId: mentorUserId,
            type: 'booking_request',
            title: '📩 New Session Request',
            message: `${learner.name} wants to book a session on "${topic}"`,
            metadata: { requestId: request._id, learnerId, topic }
        }, io);

        // Send email to mentor
        const mentor = await User.findById(slot.mentorId);
        if (mentor?.email) {
            try {
                await emailService.sendBookingRequestEmail({
                    mentorEmail: mentor.email,
                    mentorName: mentor.name,
                    learnerName: learner.name,
                    topic,
                    message,
                    date: slot.startTime,
                    duration: Math.round((slot.endTime - slot.startTime) / (1000 * 60))
                });
            } catch (err) {
                console.error('Failed to send email:', err);
            }
        }

        res.status(201).json({ 
            success: true, 
            message: 'Mentorship request sent successfully',
            request 
        });
    } catch (error) {
        console.error('sendMentorshipRequest error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET PENDING REQUESTS FOR MENTOR ────────────────────────────────────────────
exports.getPendingRequests = async (req, res) => {
    try {
        const { mentorId } = req.params;

        const mentor = await User.findById(mentorId);
        if (!mentor) {
            return res.status(404).json({ 
                success: false, 
                message: 'Mentor not found' 
            });
        }

        const requests = await MentorshipRequest.find({
            mentorId,
            status: 'pending'
        })
            .populate('learnerId', 'name email profileImage')
            .populate({
                path: 'slotId',
                select: 'startTime endTime'
            })
            .sort({ createdAt: -1 });

        res.json({ 
            success: true, 
            requests 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET MENTOR'S MENTORSHIP REQUESTS (ALL) ────────────────────────────────────
exports.getMentorRequests = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const { status } = req.query;

        const filter = { mentorId };
        if (status) filter.status = status;

        const requests = await MentorshipRequest.find(filter)
            .populate('learnerId', 'name email profileImage')
            .populate({
                path: 'slotId',
                select: 'startTime endTime sessionId',
                populate: {
                    path: 'sessionId',
                    select: 'roomId meetingLink status scheduledAt duration'
                }
            })
            .sort({ createdAt: -1 });

        res.json({ 
            success: true, 
            requests 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── MENTOR ACCEPTS MENTORSHIP REQUEST ──────────────────────────────────────────
exports.acceptMentorshipRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { mentorId } = req.body;

        const request = await MentorshipRequest.findById(requestId).populate('slotId');
        if (!request) {
            return res.status(404).json({ 
                success: false, 
                message: 'Request not found' 
            });
        }

        if (request.mentorId.toString() !== mentorId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'Request is not in pending state' 
            });
        }

        // Update request status
        request.status = 'accepted';
        request.respondedAt = new Date();
        await request.save();

        // Update slot status to booked
        const slot = request.slotId;
        slot.status = 'booked';
        slot.updatedAt = new Date();
        await slot.save();

        // Create session record
        const mentor = await User.findById(mentorId);
        const learner = await User.findById(request.learnerId);

        const roomId = uuidv4();
        const session = new Session({
            mentorId,
            mentorName: mentor.name,
            mentorEmail: mentor.email,
            learnerId: request.learnerId,
            learnerName: learner.name,
            learnerEmail: learner.email,
            title: request.topic,
            topic: request.topic,
            description: request.message,
            date: slot.startTime,
            scheduledAt: slot.startTime,
            duration: Math.round((slot.endTime - slot.startTime) / (1000 * 60)), // duration in minutes
            roomId,
            meetingLink: `/room/${roomId}`,
            slotId: slot._id,
            mentorshipRequestId: request._id,
            status: 'confirmed',
            learnerMessage: request.message
        });

        await session.save();

        // Update slot to link to session
        slot.sessionId = session._id;
        await slot.save();

        // Persist in-app notification for learner
        await notifService.createNotification({
            userId: request.learnerId,
            type: 'booking_accepted',
            title: '✅ Session Confirmed!',
            message: `${mentor.name} accepted your session request for "${request.topic}"`,
            sessionId: session._id,
            metadata: { sessionId: session._id, roomId, mentorName: mentor.name, topic: request.topic }
        }, io);

        // Emit real-time notification to learner
        if (io) {
            io.to(`learner_${request.learnerId}`).emit('mentorship_request_accepted', {
                requestId,
                roomId,
                slotDate: slot.startTime,
                mentorName: mentor.name
            });
        }

        // Send email to learner
        if (learner?.email) {
            try {
                await emailService.sendBookingAcceptedEmail({
                    learnerEmail: learner.email,
                    learnerName: learner.name,
                    mentorName: mentor.name,
                    topic: request.topic,
                    scheduledAt: slot.startTime,
                    duration: Math.round((slot.endTime - slot.startTime) / (1000 * 60)),
                    roomId
                });
            } catch (err) {
                console.error('Failed to send email:', err);
            }
        }

        res.json({ 
            success: true, 
            message: 'Request accepted and session created',
            session 
        });
    } catch (error) {
        console.error('acceptMentorshipRequest error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── MENTOR REJECTS MENTORSHIP REQUEST ──────────────────────────────────────────
exports.rejectMentorshipRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { mentorId, rejectReason } = req.body;

        const request = await MentorshipRequest.findById(requestId).populate('slotId');
        if (!request) {
            return res.status(404).json({ 
                success: false, 
                message: 'Request not found' 
            });
        }

        if (request.mentorId.toString() !== mentorId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: 'Request is not in pending state' 
            });
        }

        // Update request status
        request.status = 'rejected';
        request.rejectReason = rejectReason || '';
        request.respondedAt = new Date();
        await request.save();

        // Reset slot status to available
        const slot = request.slotId;
        slot.status = 'available';
        slot.mentorshipRequestId = null;
        slot.updatedAt = new Date();
        await slot.save();

        // Persist in-app notification for learner
        const mentor = await User.findById(mentorId);
        await notifService.createNotification({
            userId: request.learnerId,
            type: 'booking_rejected',
            title: '❌ Session Request Declined',
            message: `${mentor?.name || 'Mentor'} declined your request for "${request.topic}"${rejectReason ? ': ' + rejectReason : ''}`,
            metadata: { requestId, reason: rejectReason, mentorName: mentor?.name, topic: request.topic }
        }, io);

        // Emit real-time notification to learner
        if (io) {
            io.to(`learner_${request.learnerId}`).emit('mentorship_request_rejected', {
                requestId,
                reason: rejectReason
            });
        }

        // Send email to learner
        const learner = await User.findById(request.learnerId);
        if (learner?.email) {
            try {
                await emailService.sendBookingRejectedEmail({
                    learnerEmail: learner.email,
                    learnerName: learner.name,
                    mentorName: mentor?.name,
                    topic: request.topic,
                    reason: rejectReason
                });
            } catch (err) {
                console.error('Failed to send email:', err);
            }
        }

        res.json({ 
            success: true, 
            message: 'Request rejected' 
        });
    } catch (error) {
        console.error('rejectMentorshipRequest error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET LEARNER'S MENTORSHIP REQUESTS ──────────────────────────────────────────
exports.getLearnerRequests = async (req, res) => {
    try {
        const { learnerId } = req.params;
        const { status } = req.query;

        const filter = { learnerId };
        if (status) filter.status = status;

        const requests = await MentorshipRequest.find(filter)
            .populate('mentorId', 'name email profileImage')
            .populate({
                path: 'slotId',
                select: 'startTime endTime'
            })
            .sort({ createdAt: -1 });

        res.json({ 
            success: true, 
            requests 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
