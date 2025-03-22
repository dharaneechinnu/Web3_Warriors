require('dotenv').config();
const express = require('express');
const router = express.Router();

const {login,register,resetPassword,Verifyotp,respassword,gtpOtps} =require("../Controller/AuthController")

router.post('/login',login);
router.post('/register',register)
router.post('/generate-otp',gtpOtps)
router.post('/verify-otp',Verifyotp)
router.post('/reset-password',resetPassword)
router.patch('/resetpass-otp',respassword)


module.exports = router;