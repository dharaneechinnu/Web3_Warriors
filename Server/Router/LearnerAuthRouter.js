require('dotenv').config();
const express = require('express');
const router = express.Router();

const learnerCtrl = require('../Controller/LearnerAuthController');

router.post('/login', learnerCtrl.learnerLogin);
router.post('/register', learnerCtrl.learnerRegister);
router.post('/generate-otp', learnerCtrl.generateOtp);
router.post('/verify-otp', learnerCtrl.verifyOtp);
router.post('/reset-password', learnerCtrl.resetPwd);
router.patch('/resetpass-otp', learnerCtrl.resPassword);

module.exports = router;
