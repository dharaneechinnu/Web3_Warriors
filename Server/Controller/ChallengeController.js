const Challenge = require('../Model/ChallengeModel');
const User = require('../Model/UserModel');
const notifService = require('../services/notificationService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// io reference (set from Server.js)
let io = null;
exports.setIO = (ioInstance) => { io = ioInstance; };

// Ensure upload dir exists
const uploadDir = path.join(__dirname, '../uploads/challenges');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ─── CREATE ───────────────────────────────────────────────────────────────────
exports.createChallenge = async (req, res) => {
    try {
        const {
            mentorId, mentorName, title, description, category,
            difficulty, deadline, rewardTokens, maxParticipants,
            requirements, judgingCriteria, tags, prizeDistribution
        } = req.body;

        if (!mentorId || !title || !description || !deadline || rewardTokens === undefined) {
            return res.status(400).json({ success: false, message: 'mentorId, title, description, deadline and rewardTokens are required' });
        }

        const mentor = await User.findById(mentorId);
        if (!mentor || mentor.role !== 'mentor') {
            return res.status(403).json({ success: false, message: 'Only mentors can create challenges' });
        }

        const challenge = await Challenge.create({
            mentorId,
            mentorName: mentorName || mentor.name,
            title,
            description,
            category: category || 'general',
            difficulty: difficulty || 'medium',
            deadline: new Date(deadline),
            rewardTokens: Number(rewardTokens),
            maxParticipants: Number(maxParticipants) || 0,
            requirements: requirements || '',
            judgingCriteria: judgingCriteria || '',
            tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
            prizeDistribution: prizeDistribution || { first: 50, second: 30, third: 20 },
            onChainChallengeId: Math.floor(Date.now() / 1000), // Unix timestamp as uint256 on-chain ID
            status: 'draft'
        });

        res.status(201).json({ success: true, challenge });
    } catch (error) {
        console.error('createChallenge error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET ALL PUBLISHED ────────────────────────────────────────────────────────
exports.getChallenges = async (req, res) => {
    try {
        const { category, difficulty, status } = req.query;
        const filter = {};

        // Default: published; allow override for mentor to see all
        filter.status = status || 'published';
        if (category) filter.category = category;
        if (difficulty) filter.difficulty = difficulty;

        const challenges = await Challenge.find(filter)
            .select('-submissions.learnerId -submissions.submissionUrl -submissions.fileUrl')
            .sort({ createdAt: -1 });

        const enriched = challenges.map(c => ({
            ...c.toObject(),
            participantCount: c.participants.length,
            submissionCount: c.submissions.length,
            isExpired: new Date(c.deadline) < new Date()
        }));

        res.json({ success: true, challenges: enriched });
    } catch (error) {
        console.error('getChallenges error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET MENTOR'S CHALLENGES ──────────────────────────────────────────────────
exports.getMentorChallenges = async (req, res) => {
    try {
        const { mentorId } = req.params;
        const challenges = await Challenge.find({ mentorId }).sort({ createdAt: -1 });

        const enriched = challenges.map(c => ({
            ...c.toObject(),
            participantCount: c.participants.length,
            submissionCount: c.submissions.length,
            isExpired: new Date(c.deadline) < new Date()
        }));

        res.json({ success: true, challenges: enriched });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
exports.getChallengeById = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

        res.json({
            success: true,
            challenge: {
                ...challenge.toObject(),
                participantCount: challenge.participants.length,
                submissionCount: challenge.submissions.length,
                isExpired: new Date(challenge.deadline) < new Date()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
exports.updateChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const { mentorId, ...updates } = req.body;

        const challenge = await Challenge.findById(id);
        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
        if (challenge.mentorId.toString() !== mentorId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        if (challenge.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Cannot edit a completed challenge' });
        }

        if (updates.deadline) updates.deadline = new Date(updates.deadline);
        if (updates.tags && !Array.isArray(updates.tags)) {
            updates.tags = updates.tags.split(',').map(t => t.trim());
        }
        updates.updatedAt = new Date();

        const updated = await Challenge.findByIdAndUpdate(id, updates, { new: true });
        res.json({ success: true, challenge: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
exports.deleteChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const { mentorId } = req.body;

        const challenge = await Challenge.findById(id);
        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
        if (challenge.mentorId.toString() !== mentorId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await Challenge.findByIdAndDelete(id);
        res.json({ success: true, message: 'Challenge deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── PUBLISH / CLOSE ─────────────────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { mentorId, status } = req.body;

        if (!['published', 'closed', 'draft'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const challenge = await Challenge.findById(id);
        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
        if (challenge.mentorId.toString() !== mentorId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        challenge.status = status;
        challenge.updatedAt = new Date();
        await challenge.save();

        res.json({ success: true, challenge });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── JOIN CHALLENGE ───────────────────────────────────────────────────────────
exports.joinChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const { learnerId } = req.body;

        const challenge = await Challenge.findById(id);
        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
        if (challenge.status !== 'published') {
            return res.status(400).json({ success: false, message: 'Challenge is not open for participation' });
        }
        if (new Date(challenge.deadline) < new Date()) {
            return res.status(400).json({ success: false, message: 'Challenge deadline has passed' });
        }
        if (challenge.participants.some(p => p.toString() === learnerId)) {
            return res.status(400).json({ success: false, message: 'You have already joined this challenge' });
        }
        if (challenge.maxParticipants > 0 && challenge.participants.length >= challenge.maxParticipants) {
            return res.status(400).json({ success: false, message: 'Challenge is full' });
        }

        challenge.participants.push(learnerId);
        await challenge.save();

        res.json({ success: true, message: 'Successfully joined the challenge' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── SUBMIT TO CHALLENGE ──────────────────────────────────────────────────────
exports.submitChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const { learnerId, learnerName, learnerEmail, submissionText, submissionUrl } = req.body;

        const challenge = await Challenge.findById(id);
        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
        if (challenge.status !== 'published') {
            return res.status(400).json({ success: false, message: 'Challenge is not accepting submissions' });
        }
        if (new Date(challenge.deadline) < new Date()) {
            return res.status(400).json({ success: false, message: 'Challenge deadline has passed' });
        }
        if (!challenge.participants.some(p => p.toString() === learnerId)) {
            return res.status(400).json({ success: false, message: 'You must join the challenge before submitting' });
        }

        // Fetch actual user name from DB
        const learnerUser = await User.findById(learnerId).select('name email');
        const actualName = learnerUser ? (learnerUser.name || learnerUser.email || 'Learner') : (learnerName || 'Learner');
        const actualEmail = learnerUser ? (learnerUser.email || '') : (learnerEmail || '');

        // Check if already submitted — block duplicate submissions
        const existing = challenge.submissions.find(s => s.learnerId.toString() === learnerId);
        if (existing) {
            return res.status(400).json({ success: false, message: 'You have already submitted for this challenge. Only one submission is allowed.' });
        } else {
            const submission = {
                learnerId,
                learnerName: actualName,
                learnerEmail: actualEmail,
                submissionText: submissionText || '',
                submissionUrl: submissionUrl || '',
                fileUrl: req.file ? `/uploads/challenges/${req.file.filename}` : '',
                fileName: req.file ? req.file.originalname : '',
                submittedAt: new Date(),
                status: 'submitted'
            };
            challenge.submissions.push(submission);
        }

        await challenge.save();

        // Notify mentor about new submission
        notifService.createNotification({
            userId: challenge.mentorId,
            type: 'challenge_submission',
            title: 'New Challenge Submission',
            message: `${actualName} submitted to "${challenge.title}"`,
            metadata: { challengeId: challenge._id, learnerId }
        }, io);

        res.json({ success: true, message: 'Submission received successfully' });
    } catch (error) {
        console.error('submitChallenge error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET SUBMISSIONS (mentor view) ───────────────────────────────────────────
exports.getSubmissions = async (req, res) => {
    try {
        const { id } = req.params;
        const { mentorId } = req.query;

        const challenge = await Challenge.findById(id);
        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
        if (challenge.mentorId.toString() !== mentorId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const submissions = challenge.submissions
            .slice()
            .sort((a, b) => (a.rank || 999) - (b.rank || 999));

        res.json({ success: true, submissions, totalSubmissions: submissions.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── RANK SUBMISSION ─────────────────────────────────────────────────────────
exports.rankSubmission = async (req, res) => {
    try {
        const { id, submissionId } = req.params;
        const { mentorId, rank, score, feedback } = req.body;

        const challenge = await Challenge.findById(id);
        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
        if (challenge.mentorId.toString() !== mentorId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const submission = challenge.submissions.id(submissionId);
        if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

        submission.rank = rank;
        submission.score = score;
        submission.feedback = feedback || '';
        submission.status = 'reviewed';
        submission.reviewedAt = new Date();
        submission.reviewedBy = mentorId;

        await challenge.save();

        // Notify learner about ranking
        notifService.createNotification({
            userId: submission.learnerId,
            type: 'challenge_ranked',
            title: `Challenge Ranked #${rank}`,
            message: `Your submission to "${challenge.title}" was ranked #${rank}${score ? ` with score ${score}` : ''}`,
            metadata: { challengeId: challenge._id, rank, score }
        }, io);

        res.json({ success: true, message: 'Submission ranked', submission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── DISTRIBUTE REWARDS ───────────────────────────────────────────────────────
exports.distributeRewards = async (req, res) => {
    try {
        const { id } = req.params;
        const { mentorId } = req.body;

        const challenge = await Challenge.findById(id);
        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });
        if (challenge.mentorId.toString() !== mentorId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }
        if (challenge.rewardsDistributed) {
            return res.status(400).json({ success: false, message: 'Rewards already distributed' });
        }

        // Accept any positive integer rank (1, 2, 3, or even just 1 for a single winner)
        const rankedSubs = challenge.submissions
            .filter(s => s.rank && Number.isInteger(s.rank) && s.rank >= 1)
            .sort((a, b) => a.rank - b.rank);

        if (rankedSubs.length === 0) {
            return res.status(400).json({ success: false, message: 'No ranked submissions found. Rank at least one submission before announcing winners.' });
        }

        // Build prize map dynamically:
        //   - If only 1 winner (rank 1 only) → they get 100% of rewardTokens
        //   - If 2 winners (ranks 1 & 2) → proportionally split first+second %
        //   - If 3+ winners → use configured prizeDistribution percentages
        let prizeMap = {};
        const presentRanks = rankedSubs.map(s => s.rank);
        const pd = challenge.prizeDistribution;

        if (presentRanks.length === 1) {
            prizeMap[presentRanks[0]] = challenge.rewardTokens;
        } else if (presentRanks.includes(1) && presentRanks.includes(2) && !presentRanks.includes(3)) {
            // 2 winners: re-weight first+second proportionally
            const total = pd.first + pd.second;
            prizeMap[1] = Math.round(challenge.rewardTokens * pd.first  / total);
            prizeMap[2] = Math.round(challenge.rewardTokens * pd.second / total);
        } else {
            prizeMap[1] = Math.round(challenge.rewardTokens * pd.first   / 100);
            prizeMap[2] = Math.round(challenge.rewardTokens * pd.second  / 100);
            prizeMap[3] = Math.round(challenge.rewardTokens * pd.third   / 100);
        }

        for (const sub of rankedSubs) {
            const tokens = prizeMap[sub.rank] || 0;
            if (tokens > 0) {
                sub.rewardTokens = tokens;
                sub.status = 'rewarded';

                const learner = await User.findById(sub.learnerId);
                if (learner) {
                    learner.tokenBalance = (learner.tokenBalance || 0) + tokens;
                    learner.transactionHistory.push({
                        transactionType: 'challenge_win',
                        amount: tokens,
                        description: `🏆 Contest Win: ${challenge.title} (Rank #${sub.rank})`,
                        timestamp: new Date()
                    });
                    await learner.save();
                    sub._walletAddress = learner.UserWalletAddress || null;
                }
            }
        }

        challenge.rewardsDistributed = true;
        challenge.status = 'completed';
        challenge.winnerAnnouncedAt = new Date();
        challenge.updatedAt = new Date();
        await challenge.save();

        // Notify all winners about their rewards
        for (const sub of rankedSubs) {
            const tokens = sub.rewardTokens || 0;
            if (tokens > 0) {
                notifService.createNotification({
                    userId: sub.learnerId,
                    type: 'challenge_reward',
                    title: `🏆 You won ${tokens} tokens!`,
                    message: `Congratulations! You placed #${sub.rank} in "${challenge.title}" and earned ${tokens} tokens.`,
                    metadata: { challengeId: challenge._id, rank: sub.rank, tokens }
                }, io);
            }
        }

        // Build winners payload for frontend on-chain transfers
        const winners = rankedSubs.map(s => ({
            learnerId: s.learnerId,
            learnerName: s.learnerName,
            rank: s.rank,
            tokens: s.rewardTokens || 0,
            walletAddress: s._walletAddress || null
        }));

        res.json({
            success: true,
            message: 'Rewards distributed successfully',
            distributed: rankedSubs.length,
            winners,
            onChainChallengeId: challenge.onChainChallengeId
        });
    } catch (error) {
        console.error('distributeRewards error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
    try {
        const { id } = req.params;
        const challenge = await Challenge.findById(id);
        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

        // Fetch real names from User model for all participants
        const learnerIds = challenge.submissions.map(s => s.learnerId);
        const users = await User.find({ _id: { $in: learnerIds } }).select('name email').lean();
        const userMap = {};
        users.forEach(u => { userMap[u._id.toString()] = u.name || u.email || 'Learner'; });

        const ranked = challenge.submissions
            .filter(s => s.rank)
            .sort((a, b) => a.rank - b.rank)
            .map(s => ({
                rank: s.rank,
                learnerName: userMap[s.learnerId.toString()] || s.learnerName,
                learnerId: s.learnerId,
                score: s.score,
                rewardTokens: s.rewardTokens,
                submittedAt: s.submittedAt,
                status: s.status
            }));

        const unranked = challenge.submissions
            .filter(s => !s.rank)
            .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))
            .map(s => ({
                rank: null,
                learnerName: userMap[s.learnerId.toString()] || s.learnerName,
                learnerId: s.learnerId,
                score: s.score,
                submittedAt: s.submittedAt
            }));

        // Also fetch participant names (for showing all joined users)
        const participantUsers = await User.find({ _id: { $in: challenge.participants } }).select('name email').lean();
        const participants = participantUsers.map(u => ({
            _id: u._id,
            name: u.name || u.email || 'Learner'
        }));

        res.json({
            success: true,
            leaderboard: [...ranked, ...unranked],
            participants,
            totalParticipants: challenge.participants.length,
            totalSubmissions: challenge.submissions.length
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── RECORD ON-CHAIN TX HASH FOR WINNER ──────────────────────────────────────
exports.winnerTxHash = async (req, res) => {
    try {
        const { id } = req.params;
        const { learnerId, txHash, mentorId } = req.body;
        if (!learnerId || !txHash) {
            return res.status(400).json({ message: 'learnerId and txHash are required' });
        }

        const challenge = await Challenge.findById(id);
        if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
        if (challenge.mentorId.toString() !== mentorId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Attach txHash to the most recent challenge_win transaction for this challenge
        const learner = await User.findById(learnerId);
        if (learner) {
            for (let i = learner.transactionHistory.length - 1; i >= 0; i--) {
                const tx = learner.transactionHistory[i];
                if (tx.transactionType === 'challenge_win' && tx.description?.includes(challenge.title)) {
                    tx.txHash = txHash;
                    break;
                }
            }
            await learner.save();
        }

        res.json({ success: true });
    } catch (err) {
        console.error('winnerTxHash error:', err);
        res.status(500).json({ message: err.message });
    }
};

// ─── LEARNER: Check join/submission status ────────────────────────────────────
exports.getLearnerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { learnerId } = req.query;

        const challenge = await Challenge.findById(id);
        if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

        const joined = challenge.participants.some(p => p.toString() === learnerId);
        const submission = challenge.submissions.find(s => s.learnerId.toString() === learnerId);

        res.json({
            success: true,
            joined,
            submission: submission ? {
                _id: submission._id,
                submittedAt: submission.submittedAt,
                status: submission.status,
                rank: submission.rank,
                score: submission.score,
                feedback: submission.feedback,
                rewardTokens: submission.rewardTokens
            } : null
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
