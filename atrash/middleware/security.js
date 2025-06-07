const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Generate random tokens
exports.generateToken = () => crypto.randomBytes(32).toString('hex');

// Verify JWT middleware
exports.authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1] || 
                 req.query.token || 
                 req.cookies.token;
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ success: false, message: 'Invalid token.' });
    }
};

// CSRF protection middleware
exports.csrfProtection = (req, res, next) => {
    const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
    
    if (!csrfToken || csrfToken !== req.session.csrfToken) {
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid CSRF token' 
        });
    }
    next();
};