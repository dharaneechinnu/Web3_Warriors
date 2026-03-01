const express = require('express');
const router = express.Router();
const { getWallet, transferTokens, getEarnings, getOnChainBalance, getUserNFTs } = require('../Controller/WalletController');

// GET /wallet/earnings/:userId - earnings breakdown (must be before /:userId)
router.get('/earnings/:userId', getEarnings);

// GET /wallet/token-balance/:userId - on-chain token balance
router.get('/token-balance/:userId', getOnChainBalance);

// GET /wallet/nfts/:userId - user's NFTs from blockchain
router.get('/nfts/:userId', getUserNFTs);

// GET /wallet/:userId        - wallet balance + transaction history
router.get('/:userId', getWallet);

// POST /wallet/transfer      - transfer tokens
router.post('/transfer', transferTokens);

module.exports = router;
