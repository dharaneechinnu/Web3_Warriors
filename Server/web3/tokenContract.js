/**
 * ERC-20 Token Contract wrapper
 * ─────────────────────────────
 * Every method returns   { success, txHash?, data?, error? }
 * so controllers can use a consistent pattern.
 */
const { web3, adminAccount } = require('./web3Provider');
const { TOKEN_CONTRACT_ADDRESS } = require('./contractAddress');
const tokenAbi = require('./abi/tokenAbi.json');

const GAS = 500_000;

// ── Contract instance ────────────────────────────────────────────────────────
const tokenContract = new web3.eth.Contract(tokenAbi, TOKEN_CONTRACT_ADDRESS);

// ── Helpers ─────────────────────────────────────────────────────────────────
function toWei(amount) {
    return web3.utils.toWei(String(amount), 'ether');
}

function fromWei(weiAmount) {
    return parseFloat(web3.utils.fromWei(String(weiAmount), 'ether'));
}

// ── Register user (mint 10 SET) ──────────────────────────────────────────────
async function registerUser(walletAddress) {
    try {
        const tx = await tokenContract.methods
            .registerUser(walletAddress)
            .send({ from: adminAccount, gas: GAS });
        console.log(`[tokenContract] registerUser → tx ${tx.transactionHash}`);
        return { success: true, txHash: tx.transactionHash };
    } catch (err) {
        console.error('[tokenContract] registerUser error:', err.message);
        return { success: false, error: err.message };
    }
}

// ── Transfer for course purchase ─────────────────────────────────────────────
async function transferForCourse(learnerWallet, mentorWallet, amount) {
    try {
        const tx = await tokenContract.methods
            .transferForCourse(learnerWallet, mentorWallet, toWei(amount))
            .send({ from: adminAccount, gas: GAS });
        console.log(`[tokenContract] transferForCourse → tx ${tx.transactionHash}`);
        return { success: true, txHash: tx.transactionHash };
    } catch (err) {
        console.error('[tokenContract] transferForCourse error:', err.message);
        return { success: false, error: err.message };
    }
}

// ── Transfer for mentorship / session booking ────────────────────────────────
async function transferForMentorship(learnerWallet, mentorWallet, amount) {
    try {
        const tx = await tokenContract.methods
            .transferForMentorship(learnerWallet, mentorWallet, toWei(amount))
            .send({ from: adminAccount, gas: GAS });
        console.log(`[tokenContract] transferForMentorship → tx ${tx.transactionHash}`);
        return { success: true, txHash: tx.transactionHash };
    } catch (err) {
        console.error('[tokenContract] transferForMentorship error:', err.message);
        return { success: false, error: err.message };
    }
}

// ── Reward user (challenge win, quiz, etc.) ──────────────────────────────────
async function rewardUser(walletAddress, amount, reason = '') {
    try {
        const tx = await tokenContract.methods
            .rewardUser(walletAddress, toWei(amount), reason)
            .send({ from: adminAccount, gas: GAS });
        console.log(`[tokenContract] rewardUser → tx ${tx.transactionHash}`);
        return { success: true, txHash: tx.transactionHash };
    } catch (err) {
        console.error('[tokenContract] rewardUser error:', err.message);
        return { success: false, error: err.message };
    }
}

// ── Read on-chain balance ────────────────────────────────────────────────────
async function getBalance(walletAddress) {
    try {
        const raw = await tokenContract.methods.balanceOf(walletAddress).call();
        return { success: true, balance: fromWei(raw) };
    } catch (err) {
        console.error('[tokenContract] getBalance error:', err.message);
        return { success: false, error: err.message };
    }
}

module.exports = {
    tokenContract,
    registerUser,
    transferForCourse,
    transferForMentorship,
    rewardUser,
    getBalance,
    toWei,
    fromWei,
};
