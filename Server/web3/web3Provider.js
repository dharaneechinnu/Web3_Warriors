/**
 * Web3 Provider  –  Ganache local blockchain
 * ───────────────────────────────────────────
 * • Connects to Ganache RPC
 * • Loads the admin private key from .env
 * • Exposes   { web3, adminAccount }
 *
 * Env vars required:
 *   GANACHE_RPC       (default http://127.0.0.1:7545)
 *   PRIVATE_KEY       Ganache account private key (with or without 0x prefix)
 */
const { Web3 } = require('web3');

const GANACHE_RPC  = process.env.GANACHE_RPC  || 'http://127.0.0.1:7545';
const PRIVATE_KEY  = process.env.PRIVATE_KEY  || '';

// ── Validate ─────────────────────────────────────────────────────────────────
if (!PRIVATE_KEY) {
    console.warn('[web3Provider] ⚠  PRIVATE_KEY not set in .env – blockchain calls will fail.');
}

// ── Create Web3 instance ─────────────────────────────────────────────────────
const web3 = new Web3(new Web3.providers.HttpProvider(GANACHE_RPC));

// ── Derive account from private key ──────────────────────────────────────────
let adminAccount = null;
if (PRIVATE_KEY) {
    try {
        const key = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
        // Validate: must be 0x + 64 hex chars
        if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
            throw new Error('Key must be 64 hex characters (with or without 0x prefix).');
        }
        const acct = web3.eth.accounts.privateKeyToAccount(key);
        web3.eth.accounts.wallet.add(acct);
        web3.eth.defaultAccount = acct.address;
        adminAccount = acct.address;
        console.log(`[web3Provider] ✓  Admin account loaded: ${adminAccount}`);
    } catch (err) {
        console.error(`[web3Provider] ⚠  Invalid PRIVATE_KEY in .env: ${err.message}`);
        console.error('[web3Provider]    Get it from Ganache → click key icon on Account #0');
    }
}

// ── Health-check helper ──────────────────────────────────────────────────────
async function checkConnection() {
    try {
        const blockNumber = await web3.eth.getBlockNumber();
        console.log(`[web3Provider] ✓  Connected to Ganache – block #${blockNumber}`);
        return true;
    } catch (err) {
        console.error('[web3Provider] ✗  Cannot reach Ganache:', err.message);
        return false;
    }
}

module.exports = { web3, adminAccount, checkConnection };
