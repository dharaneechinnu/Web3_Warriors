/**
 * tokenContract.js
 * ───────────────────────────────────────────────────────────────────────────
 * Stub for token balance helpers.
 * Provides the interface expected by SessionController.js and CourseController.js
 * which both do:  const tokenContractService = require('../web3/tokenContract');
 *
 * Extend this file when you add an ERC-20 SKT token contract.
 */

const CONTRACT_ADDRESS = process.env.SKT_TOKEN_ADDRESS || '';

/**
 * Get the SKT token balance for a wallet address.
 * Returns '0' if no token contract is configured.
 */
async function getBalance(walletAddress) {
    if (!CONTRACT_ADDRESS) return '0';
    // TODO: wire up ERC-20 balanceOf when the SKT token is deployed
    return '0';
}

/**
 * Check if a wallet has at least minAmount SKT tokens.
 */
async function hasBalance(walletAddress, minAmount = 0) {
    const bal = parseFloat(await getBalance(walletAddress));
    return bal >= minAmount;
}

module.exports = { getBalance, hasBalance };
