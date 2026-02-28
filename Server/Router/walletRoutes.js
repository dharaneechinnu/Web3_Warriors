const express = require('express');
const router = express.Router();
const { getWallet, transferTokens, getEarnings } = require('../Controller/WalletController');

// GET /wallet/:userId        - wallet balance + transaction history
router.get('/:userId', getWallet);

// GET /wallet/earnings/:userId - earnings breakdown
router.get('/earnings/:userId', getEarnings);

// POST /wallet/transfer      - transfer tokens
router.post('/transfer', transferTokens);

module.exports = router;
