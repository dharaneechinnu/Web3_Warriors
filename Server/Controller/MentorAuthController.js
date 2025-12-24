const AuthController = require('./AuthController');

// Wrapper controller for mentor-specific behavior
const mentorRegister = async (req, res) => {
  try {
    // enforce mentor role
    req.body.role = 'mentor';
    return await AuthController.register(req, res);
  } catch (err) {
    console.error('Mentor register error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

const mentorLogin = async (req, res) => {
  return AuthController.login(req, res);
}

const generateOtp = async (req, res) => AuthController.gtpOtps(req, res);
const verifyOtp = async (req, res) => AuthController.Verifyotp(req, res);
const resetPwd = async (req, res) => AuthController.resetPassword(req, res);
const resPassword = async (req, res) => AuthController.respassword(req, res);

module.exports = {
  mentorRegister,
  mentorLogin,
  generateOtp,
  verifyOtp,
  resetPwd,
  resPassword
}
