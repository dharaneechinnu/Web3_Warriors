const jwt = require('jsonwebtoken');
const User = require('../Model/UserModel');  // Assuming User model is in the Model folder

const authMiddleware = async (req, res, next) => {
    try {
        // Extract token from 'Authorization' header (Bearer token)
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];  // Bearer <token>
        
        if (!token) {
            return res.status(403).json({ 
                message: 'Access denied. No token provided.',
                success: false 
            });
        }

        // Verify token using ACCESS_TOKEN secret (matching the login controller)
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
        
        // Find user by ID from token
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ 
                message: 'Invalid token. User not found.',
                success: false 
            });
        }

        // Attach user to request object
        req.user = user;
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Token has expired. Please login again.',
                success: false,
                expired: true
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token format.',
                success: false 
            });
        }
        
        return res.status(401).json({ 
            message: 'Token verification failed.',
            success: false 
        });
    }
};

module.exports = authMiddleware;
