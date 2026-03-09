/**
 * web3Provider.js
 * ───────────────────────────────────────────────────────────────────────────
 * Creates and exports a singleton web3.js v4 instance with an admin wallet.
 *
 * Reads from .env:
 *   GANACHE_RPC            — JSON-RPC endpoint (default: http://127.0.0.1:7545)
 *   PRIVATE_KEY            — Backend admin wallet private key (hex, with or without 0x)
 *   SKILL_PLATFORM_ADDRESS — Deployed SkillPlatform contract address
 */

const { Web3 } = require('web3');

// ── Configuration ────────────────────────────────────────────────────────────
const RPC_URL  = process.env.GANACHE_RPC || 'http://127.0.0.1:7545';
const PRIV_KEY = process.env.PRIVATE_KEY  || '';

// ── Lazy-initialised singletons ──────────────────────────────────────────────
let _web3        = null;
let _adminAddress = null;

function getWeb3() {
    if (!_web3) {
        _web3 = new Web3(RPC_URL);

        if (PRIV_KEY) {
            const key = PRIV_KEY.startsWith('0x') ? PRIV_KEY : `0x${PRIV_KEY}`;
            const acct = _web3.eth.accounts.wallet.add(key);
            _adminAddress = acct[0].address;
            console.log(`[web3Provider] Admin wallet loaded: ${_adminAddress}`);
        } else {
            console.warn('[web3Provider] PRIVATE_KEY not set — on-chain writes will fail');
        }
    }
    return _web3;
}

function getAdminAddress() {
    if (!_adminAddress) getWeb3(); // triggers wallet setup
    if (!_adminAddress) throw new Error('[web3Provider] PRIVATE_KEY is not configured');
    return _adminAddress;
}

async function checkConnection() {
    try {
        const web3 = getWeb3();
        const blockNumber = await web3.eth.getBlockNumber();
        console.log(`[web3Provider] Connected to ${RPC_URL} — latest block: ${blockNumber}`);
    } catch (err) {
        console.warn(`[web3Provider] Could not connect to ${RPC_URL}: ${err.message}`);
    }
}

module.exports = { getWeb3, getAdminAddress, checkConnection };
