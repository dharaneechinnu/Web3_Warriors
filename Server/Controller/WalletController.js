const User = require('../Model/UserModel');

// GET /wallet/:userId - Get wallet data (balance + transaction history)
exports.getWallet = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('name email tokenBalance transactionHistory role');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const sorted = (user.transactionHistory || [])
            .slice()
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const totalEarned = sorted
            .filter(t => t.transactionType === 'earn')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalSpent = sorted
            .filter(t => t.transactionType === 'spend')
            .reduce((sum, t) => sum + t.amount, 0);

        res.json({
            success: true,
            wallet: {
                userId: user._id,
                name: user.name,
                email: user.email,
                balance: user.tokenBalance || 0,
                totalEarned,
                totalSpent,
                transactions: sorted
            }
        });
    } catch (error) {
        console.error('getWallet error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /wallet/transfer - Transfer tokens between users
exports.transferTokens = async (req, res) => {
    try {
        const { senderId, recipientId, amount, description } = req.body;

        if (!senderId || !recipientId || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'senderId, recipientId, and a positive amount are required' });
        }

        if (senderId === recipientId) {
            return res.status(400).json({ success: false, message: 'Cannot transfer tokens to yourself' });
        }

        const sender = await User.findById(senderId);
        const recipient = await User.findById(recipientId);

        if (!sender) return res.status(404).json({ success: false, message: 'Sender not found' });
        if (!recipient) return res.status(404).json({ success: false, message: 'Recipient not found' });

        if ((sender.tokenBalance || 0) < amount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. You have ${sender.tokenBalance} tokens.`
            });
        }

        const desc = description || `Transfer to ${recipient.name}`;
        const now = new Date();

        sender.tokenBalance -= amount;
        sender.transactionHistory.push({
            transactionType: 'spend',
            amount,
            description: desc,
            timestamp: now
        });

        recipient.tokenBalance = (recipient.tokenBalance || 0) + amount;
        recipient.transactionHistory.push({
            transactionType: 'earn',
            amount,
            description: `Transfer from ${sender.name}`,
            timestamp: now
        });

        await Promise.all([sender.save(), recipient.save()]);

        res.json({
            success: true,
            message: `Successfully transferred ${amount} tokens to ${recipient.name}`,
            newBalance: sender.tokenBalance
        });
    } catch (error) {
        console.error('transferTokens error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /wallet/earnings/:userId - Get earnings breakdown by source
exports.getEarnings = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('tokenBalance transactionHistory');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const transactions = user.transactionHistory || [];

        const earned = transactions.filter(t => t.transactionType === 'earn');

        const courseEarnings = earned
            .filter(t => t.description && t.description.toLowerCase().includes('enroll'))
            .reduce((sum, t) => sum + t.amount, 0);

        const quizEarnings = earned
            .filter(t => t.description && t.description.toLowerCase().includes('quiz'))
            .reduce((sum, t) => sum + t.amount, 0);

        const mentorshipEarnings = earned
            .filter(t => t.description && (t.description.toLowerCase().includes('mentorship') || t.description.toLowerCase().includes('session')))
            .reduce((sum, t) => sum + t.amount, 0);

        const challengeEarnings = earned
            .filter(t => t.description && t.description.toLowerCase().includes('challenge'))
            .reduce((sum, t) => sum + t.amount, 0);

        const otherEarnings = earned
            .filter(t => {
                const d = (t.description || '').toLowerCase();
                return !d.includes('enroll') && !d.includes('quiz') && !d.includes('mentorship') && !d.includes('session') && !d.includes('challenge');
            })
            .reduce((sum, t) => sum + t.amount, 0);

        res.json({
            success: true,
            earnings: {
                total: earned.reduce((sum, t) => sum + t.amount, 0),
                course: courseEarnings,
                quiz: quizEarnings,
                mentorship: mentorshipEarnings,
                challenge: challengeEarnings,
                other: otherEarnings
            },
            currentBalance: user.tokenBalance || 0
        });
    } catch (error) {
        console.error('getEarnings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
