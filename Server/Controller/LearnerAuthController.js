const AuthController = require('./AuthController');

// Wrapper controller for learner-specific behavior
const learnerRegister = async (req, res) => {
  try {
    // enforce learner role
    req.body.role = 'learner';
    return await AuthController.register(req, res);
  } catch (err) {
    console.error('Learner register error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

const learnerLogin = async (req, res) => {
  return AuthController.login(req, res);
}

const generateOtp = async (req, res) => AuthController.gtpOtps(req, res);
const verifyOtp = async (req, res) => AuthController.Verifyotp(req, res);
const resetPwd = async (req, res) => AuthController.resetPassword(req, res);
const resPassword = async (req, res) => AuthController.respassword(req, res);

module.exports = {
  learnerRegister,
  learnerLogin,
  generateOtp,
  verifyOtp,
  resetPwd,
  resPassword
}
