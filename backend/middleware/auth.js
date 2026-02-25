const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Cookie helpers (shared with authController) ────────────
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
};

const setTokenCookies = (res, accessToken) => {
    res.cookie('access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000
    });
};

// ─── Auth Middleware ─────────────────────────────────────────
const authMiddleware = async (req, res, next) => {
    try {
        // 1. Get access token from cookie or Authorization header
        let accessToken = req.cookies?.access_token || null;

        if (!accessToken && req.headers.authorization?.startsWith('Bearer ')) {
            accessToken = req.headers.authorization.split(' ')[1];
        }

        // 2. Try verifying access token
        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

                if (decoded.type && decoded.type !== 'access') {
                    return res.status(401).json({ error: 'Invalid token type.', code: 'INVALID_TOKEN' });
                }

                // Fetch user from MongoDB
                const user = await User.findById(decoded.userId);
                if (!user) {
                    return res.status(401).json({ error: 'User not found.', code: 'INVALID_TOKEN' });
                }

                req.user = {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    profile: user
                };
                return next();
            } catch (err) {
                if (err.name !== 'TokenExpiredError') {
                    return res.status(401).json({
                        error: 'Invalid session. Please login again.',
                        code: 'INVALID_TOKEN'
                    });
                }
                // Access token expired — fall through to try refresh
            }
        }

        // 3. Try refreshing with refresh token
        const refreshToken = req.cookies?.refresh_token || null;

        if (!refreshToken) {
            return res.status(401).json({
                error: 'Authentication required. Please login.',
                code: 'NO_TOKEN'
            });
        }

        let refreshDecoded;
        try {
            refreshDecoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                error: 'Session expired. Please login again.',
                code: 'SESSION_EXPIRED'
            });
        }

        if (refreshDecoded.type !== 'refresh') {
            return res.status(401).json({ error: 'Invalid token.', code: 'INVALID_TOKEN' });
        }

        // Fetch user from MongoDB
        const user = await User.findById(refreshDecoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'Account not found.', code: 'INVALID_TOKEN' });
        }

        req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
            profile: user
        };

        // Issue new access token silently
        const newAccessToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
                type: 'access'
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
        );

        setTokenCookies(res, newAccessToken);
        res.setHeader('X-New-Access-Token', newAccessToken);

        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Authentication error.' });
    }
};

// ─── Admin Middleware ────────────────────────────────────────
const adminMiddleware = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
};

// ─── Role Middleware (generic) ───────────────────────────────
const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

module.exports = { authMiddleware, adminMiddleware, roleMiddleware };
