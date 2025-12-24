require('dotenv').config();
const express = require('express');
const router = express.Router();

const mentorCtrl = require('../Controller/MentorAuthController');

router.post('/login', mentorCtrl.mentorLogin);
router.post('/register', mentorCtrl.mentorRegister);
router.post('/generate-otp', mentorCtrl.generateOtp);
router.post('/verify-otp', mentorCtrl.verifyOtp);
router.post('/reset-password', mentorCtrl.resetPwd);
router.patch('/resetpass-otp', mentorCtrl.resPassword);

module.exports = router;
