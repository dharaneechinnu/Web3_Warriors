const jwt  = require('jsonwebtoken');
const User = require('../Model/UserModel');

/**
 * Admin-only authentication middleware.
 * Verifies the Bearer JWT and confirms the user has role === 'admin'.
 */
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token      = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(403).json({ message: 'Access denied. No token provided.', success: false });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
    const user    = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.', success: false });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        message: 'Access denied. Admin privileges required.',
        success: false,
      });
    }

    req.user      = user;
    req.userId    = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired. Please login again.', success: false, expired: true });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token format.', success: false });
    }
    return res.status(401).json({ message: 'Token verification failed.', success: false });
  }
};

module.exports = adminAuth;
