const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

// Verify JWT token from Authorization header or httpOnly cookie
const authMiddleware = async (req, res, next) => {
    try {
        let token = null;

        // Check Authorization header first
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        // Fallback to httpOnly cookie
        if (!token && req.cookies && req.cookies.auth_token) {
            token = req.cookies.auth_token;
        }

        if (!token) {
            return res.status(401).json({ error: 'Authentication required. Please login.' });
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch fresh user profile from DB
        const { data: profile, error } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', decoded.userId)
            .single();

        if (error || !profile) {
            return res.status(401).json({ error: 'User profile not found. Please login again.' });
        }

        // Attach user info to request
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: profile.role || 'customer',
            profile
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Session expired. Please login again.' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token. Please login again.' });
        }
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Authentication error.' });
    }
};

// Require admin role
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
};

// Require specific role(s)
const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }
        next();
    };
};

module.exports = { authMiddleware, adminMiddleware, roleMiddleware };
