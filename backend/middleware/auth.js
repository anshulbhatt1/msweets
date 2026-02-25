const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

// ─── Extract token from request ─────────────────────────────
const extractAccessToken = (req) => {
    // 1. Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    // 2. httpOnly cookie (access_token)
    if (req.cookies?.access_token) {
        return req.cookies.access_token;
    }
    // 3. Legacy cookie name
    if (req.cookies?.auth_token) {
        return req.cookies.auth_token;
    }
    return null;
};

const extractRefreshToken = (req) => {
    if (req.cookies?.refresh_token) {
        return req.cookies.refresh_token;
    }
    return null;
};

// ─── Cookie helpers (reused from authController) ────────────
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
};

const setTokenCookies = (res, accessToken, refreshToken) => {
    res.cookie('access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000
    });
    if (refreshToken) {
        res.cookie('refresh_token', refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 30 * 24 * 60 * 60 * 1000
        });
    }
};

// ─── Attach user profile to request ─────────────────────────
const attachUser = async (req, decoded) => {
    const { data: profile, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', decoded.userId)
        .single();

    if (error || !profile) return false;

    req.user = {
        id: decoded.userId,
        email: decoded.email || profile.email,
        role: profile.role || 'customer',
        profile
    };
    return true;
};

// ─── Main auth middleware ────────────────────────────────────
// Verifies access token, and if expired tries silent refresh
const authMiddleware = async (req, res, next) => {
    try {
        const accessToken = extractAccessToken(req);

        // ── Try access token first ──
        if (accessToken) {
            try {
                const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

                // Reject if someone uses a refresh token in place of access
                if (decoded.type === 'refresh') {
                    return res.status(401).json({ error: 'Invalid token. Please login again.' });
                }

                const ok = await attachUser(req, decoded);
                if (!ok) {
                    return res.status(401).json({ error: 'Account not found. Please login again.' });
                }
                return next();
            } catch (err) {
                // If anything other than expired, fall through to refresh
                if (err.name !== 'TokenExpiredError') {
                    // Truly invalid token
                    return res.status(401).json({
                        error: 'Invalid session. Please login again.',
                        code: 'INVALID_TOKEN'
                    });
                }
                // Access token expired — fall through to try refresh
            }
        }

        // ── Try silent refresh via refresh token ──
        const refreshTokenStr = extractRefreshToken(req);
        if (!refreshTokenStr) {
            return res.status(401).json({
                error: 'Authentication required. Please login.',
                code: 'NO_TOKEN'
            });
        }

        let refreshDecoded;
        try {
            refreshDecoded = jwt.verify(refreshTokenStr, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                error: 'Session expired. Please login again.',
                code: 'REFRESH_EXPIRED'
            });
        }

        if (refreshDecoded.type !== 'refresh') {
            return res.status(401).json({
                error: 'Invalid session. Please login again.',
                code: 'INVALID_REFRESH'
            });
        }

        // Fetch profile for fresh role data
        const ok = await attachUser(req, refreshDecoded);
        if (!ok) {
            return res.status(401).json({
                error: 'Account not found. Please login again.',
                code: 'ACCOUNT_GONE'
            });
        }

        // Issue new access token silently (piggyback on this response)
        const newAccessToken = jwt.sign(
            {
                userId: refreshDecoded.userId,
                email: req.user.email,
                role: req.user.role,
                type: 'access'
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
        );

        // Set new access token cookie on the response
        setTokenCookies(res, newAccessToken);

        // Also put new token in response header so frontend can update localStorage
        res.setHeader('X-New-Access-Token', newAccessToken);

        return next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Authentication error.' });
    }
};

// ─── Admin middleware ────────────────────────────────────────
const adminMiddleware = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required.' });
    }
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
};

// ─── Role-based middleware ───────────────────────────────────
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
