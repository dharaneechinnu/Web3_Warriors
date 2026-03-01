/**
 * deploy.js  –  Deploy ERC-20 + ERC-721 contracts to Ganache
 * ───────────────────────────────────────────────────────────
 * Usage:
 *   node web3/deploy.js
 *
 * Prerequisites:
 *   1. Ganache running on http://127.0.0.1:7545
 *   2. PRIVATE_KEY set in .env (first Ganache account)
 *
 * After deployment this script prints the addresses.
 * Copy them into your .env as:
 *   TOKEN_CONTRACT_ADDRESS=0x...
 *   NFT_CONTRACT_ADDRESS=0x...
 *
 * NOTE: This script uses pre-compiled bytecode.
 *       If you modify the .sol files, re-compile with Remix or
 *       Hardhat and paste the new bytecode below.
 */
require('dotenv').config();
const { Web3 } = require('web3');

const GANACHE_RPC = process.env.GANACHE_RPC || 'http://127.0.0.1:7545';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

if (!PRIVATE_KEY) {
    console.error('❌  Set PRIVATE_KEY in .env (Ganache account #0 private key)');
    process.exit(1);
}

const web3 = new Web3(new Web3.providers.HttpProvider(GANACHE_RPC));
const key = PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`;
const account = web3.eth.accounts.privateKeyToAccount(key);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const tokenAbi = require('./abi/tokenAbi.json');
const nftAbi   = require('./abi/nftAbi.json');

// ─── BYTECODE ─────────────────────────────────────────────────────────────────
// These are placeholder bytecodes. You MUST replace them with the actual compiled
// bytecode from Remix or Hardhat after compiling the Solidity contracts.
//
// How to get bytecode:
//   1. Open Remix IDE (https://remix.ethereum.org)
//   2. Paste the .sol file content
//   3. Compile with Solidity 0.8.20+
//   4. Go to "Compilation Details" → copy the "object" field from bytecode
//   5. Paste it below (prepend 0x)
//
// For now, we provide a deployment scaffold. Set your actual bytecode here:
const TOKEN_BYTECODE = process.env.TOKEN_BYTECODE || '0x_PASTE_TOKEN_BYTECODE_HERE';
const NFT_BYTECODE   = process.env.NFT_BYTECODE   || '0x_PASTE_NFT_BYTECODE_HERE';

async function deploy() {
    console.log('🚀  Deploying contracts from', account.address);
    console.log('    Ganache RPC:', GANACHE_RPC);

    const balance = await web3.eth.getBalance(account.address);
    console.log('    Account balance:', web3.utils.fromWei(balance, 'ether'), 'ETH\n');

    // ── Deploy ERC-20 Token ──────────────────────────────────────────────────
    if (TOKEN_BYTECODE.includes('PASTE')) {
        console.log('⚠  TOKEN_BYTECODE not set — skipping ERC-20 deployment.');
        console.log('   Compile SkillExchangeToken.sol in Remix and paste bytecode.\n');
    } else {
        try {
            const TokenContract = new web3.eth.Contract(tokenAbi);
            const tokenDeploy = TokenContract.deploy({ data: TOKEN_BYTECODE });
            const gasEstimate = await tokenDeploy.estimateGas({ from: account.address });
            const tokenInstance = await tokenDeploy.send({
                from: account.address,
                gas: Math.round(Number(gasEstimate) * 1.2),
            });
            console.log('✅  ERC-20 Token deployed at:', tokenInstance.options.address);
            console.log('    → Add to .env:  TOKEN_CONTRACT_ADDRESS=' + tokenInstance.options.address);
        } catch (err) {
            console.error('❌  ERC-20 deployment failed:', err.message);
        }
    }

    // ── Deploy ERC-721 NFT ───────────────────────────────────────────────────
    if (NFT_BYTECODE.includes('PASTE')) {
        console.log('⚠  NFT_BYTECODE not set — skipping ERC-721 deployment.');
        console.log('   Compile SkillExchangeNFT.sol in Remix and paste bytecode.\n');
    } else {
        try {
            const NftContract = new web3.eth.Contract(nftAbi);
            const nftDeploy = NftContract.deploy({ data: NFT_BYTECODE });
            const gasEstimate = await nftDeploy.estimateGas({ from: account.address });
            const nftInstance = await nftDeploy.send({
                from: account.address,
                gas: Math.round(Number(gasEstimate) * 1.2),
            });
            console.log('✅  ERC-721 NFT deployed at:', nftInstance.options.address);
            console.log('    → Add to .env:  NFT_CONTRACT_ADDRESS=' + nftInstance.options.address);
        } catch (err) {
            console.error('❌  ERC-721 deployment failed:', err.message);
        }
    }

    console.log('\n🎉  Deployment complete! Update your .env with the contract addresses above.');
}

deploy().catch(err => {
    console.error('Deploy script error:', err);
    process.exit(1);
});
