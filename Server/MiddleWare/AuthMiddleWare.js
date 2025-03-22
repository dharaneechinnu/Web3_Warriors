const jwt = require('jsonwebtoken');
const User = require('../Model/UserModel');  // Assuming User model is in the Model folder

const authMiddleware = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];  // Extract token from 'Authorization' header
    
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token using secret key
        req.user = await User.findById(decoded.userId); // Assuming 'userId' is inside the decoded token
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

module.exports = authMiddleware;
