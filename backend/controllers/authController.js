const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Token helpers ──────────────────────────────────────────
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const generateAccessToken = (userId, email, role) => {
    return jwt.sign(
        { userId, email, role, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_EXPIRY }
    );
};

const generateRefreshToken = (userId, email, role) => {
    return jwt.sign(
        { userId, email, role, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: REFRESH_EXPIRY }
    );
};

// ─── Cookie helpers ─────────────────────────────────────────
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
    res.cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 30 * 24 * 60 * 60 * 1000
    });
};

const clearTokenCookies = (res) => {
    res.clearCookie('access_token', COOKIE_OPTIONS);
    res.clearCookie('refresh_token', COOKIE_OPTIONS);
    res.clearCookie('auth_token', COOKIE_OPTIONS);
};

// ─── Build clean user response ──────────────────────────────
const buildUserResponse = (user) => ({
    id: user._id,
    email: user.email,
    full_name: user.full_name,
    phone: user.phone || null,
    role: user.role || 'customer',
    avatar_url: user.avatar_url || null,
    address: user.address || null,
    created_at: user.created_at
});

// ─── POST /api/auth/signup ──────────────────────────────────
const signup = async (req, res) => {
    try {
        const { email, password, full_name, phone } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ error: 'Email, password and full name are required.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        // Check if user already exists
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }

        // Create user (password is auto-hashed by pre-save hook)
        const user = await User.create({
            email: email.toLowerCase(),
            password,
            full_name: full_name.trim(),
            phone: phone || null,
            role: 'customer'
        });

        const accessToken = generateAccessToken(user._id, user.email, user.role);
        const refreshToken = generateRefreshToken(user._id, user.email, user.role);

        setTokenCookies(res, accessToken, refreshToken);

        res.status(201).json({
            message: 'Account created successfully!',
            token: accessToken,
            refreshToken,
            user: buildUserResponse(user)
        });
    } catch (err) {
        console.error('Signup error:', err);
        if (err.code === 11000) {
            return res.status(400).json({ error: 'An account with this email already exists.' });
        }
        res.status(500).json({ error: 'Signup failed. Please try again.' });
    }
};

// ─── POST /api/auth/login ───────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user and include password field
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const accessToken = generateAccessToken(user._id, user.email, user.role);
        const refreshToken = generateRefreshToken(user._id, user.email, user.role);

        setTokenCookies(res, accessToken, refreshToken);

        res.json({
            message: 'Login successful',
            token: accessToken,
            refreshToken,
            user: buildUserResponse(user)
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
};

// ─── POST /api/auth/refresh ─────────────────────────────────
const refresh = async (req, res) => {
    try {
        let refreshTokenStr = req.cookies?.refresh_token || req.body?.refreshToken || null;

        if (!refreshTokenStr && req.headers.authorization?.startsWith('Refresh ')) {
            refreshTokenStr = req.headers.authorization.split(' ')[1];
        }

        if (!refreshTokenStr) {
            return res.status(401).json({ error: 'No refresh token provided.' });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshTokenStr, process.env.JWT_SECRET);
        } catch (err) {
            clearTokenCookies(res);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Session expired. Please login again.' });
            }
            return res.status(401).json({ error: 'Invalid refresh token. Please login again.' });
        }

        if (decoded.type !== 'refresh') {
            return res.status(401).json({ error: 'Invalid token type.' });
        }

        // Fetch latest user (role may have changed)
        const user = await User.findById(decoded.userId);
        if (!user) {
            clearTokenCookies(res);
            return res.status(401).json({ error: 'Account not found. Please login again.' });
        }

        const newAccessToken = generateAccessToken(user._id, user.email, user.role);
        const newRefreshToken = generateRefreshToken(user._id, user.email, user.role);

        setTokenCookies(res, newAccessToken, newRefreshToken);

        res.json({
            message: 'Token refreshed',
            token: newAccessToken,
            refreshToken: newRefreshToken,
            user: buildUserResponse(user)
        });
    } catch (err) {
        console.error('Refresh error:', err);
        clearTokenCookies(res);
        res.status(500).json({ error: 'Token refresh failed.' });
    }
};

// ─── POST /api/auth/logout ──────────────────────────────────
const logout = async (req, res) => {
    clearTokenCookies(res);
    res.json({ message: 'Logged out successfully.' });
};

// ─── GET /api/auth/me ───────────────────────────────────────
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated.' });
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        res.json({ user: buildUserResponse(user) });
    } catch (err) {
        console.error('GetMe error:', err);
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
};

// ─── PUT /api/auth/profile ──────────────────────────────────
const updateProfile = async (req, res) => {
    try {
        const { full_name, phone, address } = req.body;
        const updates = {};

        if (full_name !== undefined) updates.full_name = full_name.trim();
        if (phone !== undefined) updates.phone = phone;
        if (address !== undefined) updates.address = address;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
        if (!user) return res.status(404).json({ error: 'User not found.' });

        res.json({ message: 'Profile updated.', user: buildUserResponse(user) });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
};

// ─── PUT /api/auth/change-password ──────────────────────────
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required.' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters.' });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        user.password = newPassword; // pre-save hook will hash it
        await user.save();

        res.json({ message: 'Password changed successfully.' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Failed to change password.' });
    }
};

module.exports = { signup, login, refresh, logout, getMe, updateProfile, changePassword };
