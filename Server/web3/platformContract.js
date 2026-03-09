/**
 * platformContract.js
 * Backend wrapper for SkillPlatform session booking (web3.js v4).
 */

const { getWeb3, getAdminAddress } = require('./web3Provider');
const path = require('path');
const fs   = require('fs');

const artifactPath = path.join(__dirname, '../../build/contracts/SkillPlatform.json');
let CONTRACT_ABI = [];
try {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    CONTRACT_ABI = artifact.abi;
} catch (err) {
    console.error('[platformContract] Could not load SkillPlatform ABI:', err.message);
}

const CONTRACT_ADDRESS = process.env.SKILL_PLATFORM_ADDRESS || '0xf2183627A41c24543b3046A2C89e7bD2dEBaDFc7';

let _contract = null;
function getContract() {
    if (!_contract) {
        const web3 = getWeb3();
        _contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    }
    return _contract;
}

/**
 * Get a session on-chain price and active status by mongo session ID.
 */
async function getSession(mongoSessionId) {
    try {
        const web3       = getWeb3();
        const contract   = getContract();
        const sessionKey = web3.utils.soliditySha3({ type: 'string', value: mongoSessionId });
        const session    = await contract.methods.sessions(sessionKey).call();
        return {
            success:  true,
            mentor:   session.mentor,
            priceWei: session.priceWei.toString(),
            isActive: session.isActive
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Get a booking on-chain details by booking ID.
 */
async function getBooking(bookingId) {
    try {
        const contract = getContract();
        const b = await contract.methods.bookings(bookingId).call();
        const statusMap = ['None', 'Booked', 'Confirmed', 'Cancelled'];
        return {
            success:     true,
            bookingId:   Number(b.bookingId),
            learner:     b.learner,
            mentor:      b.mentor,
            amountPaid:  b.amountPaid.toString(),
            bookedAt:    new Date(Number(b.bookedAt) * 1000).toISOString(),
            sessionTime: new Date(Number(b.sessionTime) * 1000).toISOString(),
            status:      statusMap[Number(b.status)] || 'Unknown'
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Verify a learner's bookSession() transaction on-chain.
 * Called by the backend before trusting the txHash sent from the frontend.
 * @returns {{ success: boolean, bookingId?: number, amountPaid?: string, error?: string }}
 */
async function verifyBookingTransaction(txHash, learnerWallet) {
    try {
        const web3 = getWeb3();
        const receipt = await web3.eth.getTransactionReceipt(txHash);

        if (!receipt) return { success: false, error: 'Transaction not found on-chain' };
        if (!receipt.status) return { success: false, error: 'Transaction reverted on-chain' };

        // keccak256 signature of SessionBooked(uint256,bytes32,address,address,uint256)
        const eventSig = web3.utils.sha3('SessionBooked(uint256,bytes32,address,address,uint256)');
        const log = receipt.logs.find(l => l.topics[0] === eventSig);
        if (!log) return { success: false, error: 'No SessionBooked event found in transaction' };

        // bookingId, sessionKey, learner are indexed (in topics); mentor + amountPaid in data
        const decoded = web3.eth.abi.decodeLog(
            [
                { type: 'uint256', name: 'bookingId',  indexed: true  },
                { type: 'bytes32', name: 'sessionKey', indexed: true  },
                { type: 'address', name: 'learner',    indexed: true  },
                { type: 'address', name: 'mentor',     indexed: false },
                { type: 'uint256', name: 'amountPaid', indexed: false }
            ],
            log.data,
            log.topics.slice(1)
        );

        if (learnerWallet && decoded.learner.toLowerCase() !== learnerWallet.toLowerCase()) {
            return { success: false, error: 'Learner address in event does not match provided wallet' };
        }

        return {
            success:   true,
            bookingId: Number(decoded.bookingId),
            amountPaid: decoded.amountPaid.toString()
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

module.exports = { getSession, getBooking, verifyBookingTransaction };
