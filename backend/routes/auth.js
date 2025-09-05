const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simple in-memory session for demo (use proper session management in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Default admin credentials (change in production!)
const DEFAULT_ADMIN = {
    username: 'admin',
    password: 'admin123' // Change this immediately!
};

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Simple authentication (implement proper database authentication in production)
        if (username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) {
            const token = jwt.sign(
                { username, role: 'admin' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                token,
                user: { username, role: 'admin' }
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
});

// Verify token middleware
router.get('/verify', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No token provided'
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({
            success: true,
            user: decoded
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid token'
        });
    }
});

module.exports = router;