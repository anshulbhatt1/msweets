const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { supabase, supabaseAdmin } = require('../config/supabase');

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
    // Access token cookie — short lived (15 min)
    res.cookie('access_token', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000  // 15 minutes
    });

    // Refresh token cookie — long lived (30 days)
    res.cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
    });
};

const clearTokenCookies = (res) => {
    res.clearCookie('access_token', COOKIE_OPTIONS);
    res.clearCookie('refresh_token', COOKIE_OPTIONS);
    // Also clear legacy cookie name if exists
    res.clearCookie('auth_token', COOKIE_OPTIONS);
};

// ─── Build clean user object (never leak internal fields) ───
const buildUserResponse = (profile) => ({
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    phone: profile.phone || null,
    role: profile.role || 'customer',
    avatar_url: profile.avatar_url || null,
    address: profile.address || null,
    created_at: profile.created_at
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

        // 1. Create user in Supabase Auth
        let authData, authError;
        try {
            const result = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name, phone } }
            });
            authData = result.data;
            authError = result.error;
        } catch (connErr) {
            console.error('Supabase connection error (signup):', connErr.message);
            const isConnIssue = /fetch failed|ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(connErr.message);
            return res.status(503).json({
                error: isConnIssue
                    ? 'Cannot reach Supabase. Your project may be paused — restore it at supabase.com/dashboard, then try again.'
                    : 'Unable to reach authentication server. Please try again later.'
            });
        }

        if (authError) {
            // Real auth errors: "User already registered", validation, etc.
            const msg = authError.message || 'Signup failed.';
            return res.status(400).json({ error: msg });
        }

        if (!authData.user) {
            return res.status(400).json({ error: 'Signup failed. Please try again.' });
        }

        // 2. Upsert profile (trigger may also create it)
        await supabaseAdmin
            .from('user_profiles')
            .upsert({
                id: authData.user.id,
                email,
                full_name: full_name.trim(),
                phone: phone || null,
                role: 'customer'
            }, { onConflict: 'id' });

        // 3. Fetch clean profile
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        const role = profile?.role || 'customer';

        // 4. Generate tokens
        const accessToken = generateAccessToken(authData.user.id, email, role);
        const refreshToken = generateRefreshToken(authData.user.id, email, role);

        // 5. Set cookies
        setTokenCookies(res, accessToken, refreshToken);

        // 6. Sign out of Supabase client (we manage our own JWT)
        await supabase.auth.signOut().catch(() => { });

        const user = buildUserResponse(profile || {
            id: authData.user.id, email, full_name, phone, role: 'customer'
        });

        res.status(201).json({
            message: 'Account created successfully!',
            token: accessToken,       // for localStorage fallback
            refreshToken,             // for localStorage fallback
            user
        });
    } catch (err) {
        console.error('Signup error:', err);
        const isConnIssue = /fetch failed|ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(err.message);
        res.status(isConnIssue ? 503 : 500).json({
            error: isConnIssue
                ? 'Cannot reach Supabase. Your project may be paused — restore it at supabase.com/dashboard, then try again.'
                : 'Signup failed. Please try again.'
        });
    }
};

// ─── POST /api/auth/login ───────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // 1. Authenticate via Supabase Auth
        let authData, authError;
        try {
            const result = await supabase.auth.signInWithPassword({
                email, password
            });
            authData = result.data;
            authError = result.error;
        } catch (connErr) {
            console.error('Supabase connection error (login):', connErr.message);
            const isConnIssue = /fetch failed|ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(connErr.message);
            return res.status(503).json({
                error: isConnIssue
                    ? 'Cannot reach Supabase. Your project may be paused — restore it at supabase.com/dashboard, then try again.'
                    : 'Unable to reach authentication server. Please try again later.'
            });
        }

        if (authError) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // 2. Get or create profile
        let { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (!profile) {
            const { data: newProfile } = await supabaseAdmin
                .from('user_profiles')
                .upsert({
                    id: authData.user.id,
                    email,
                    full_name: authData.user.user_metadata?.full_name || email.split('@')[0],
                    role: 'customer'
                }, { onConflict: 'id' })
                .select()
                .single();
            profile = newProfile;
        }

        if (!profile) {
            return res.status(500).json({ error: 'Failed to load your profile.' });
        }

        const role = profile.role || 'customer';

        // 3. Generate tokens
        const accessToken = generateAccessToken(authData.user.id, email, role);
        const refreshToken = generateRefreshToken(authData.user.id, email, role);

        // 4. Set cookies
        setTokenCookies(res, accessToken, refreshToken);

        // 5. Sign out of Supabase client to avoid shared state
        await supabase.auth.signOut().catch(() => { });

        const user = buildUserResponse(profile);

        res.json({
            message: 'Login successful',
            token: accessToken,
            refreshToken,
            user
        });
    } catch (err) {
        console.error('Login error:', err);
        const isConnIssue = /fetch failed|ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(err.message);
        res.status(isConnIssue ? 503 : 500).json({
            error: isConnIssue
                ? 'Cannot reach Supabase. Your project may be paused — restore it at supabase.com/dashboard, then try again.'
                : 'Login failed. Please try again.'
        });
    }
};

// ─── POST /api/auth/refresh ─────────────────────────────────
// Silent token refresh — called by frontend when access token expires
const refresh = async (req, res) => {
    try {
        // 1. Get refresh token from cookie or body
        let refreshTokenStr = null;

        if (req.cookies?.refresh_token) {
            refreshTokenStr = req.cookies.refresh_token;
        } else if (req.body?.refreshToken) {
            refreshTokenStr = req.body.refreshToken;
        } else if (req.headers.authorization?.startsWith('Refresh ')) {
            refreshTokenStr = req.headers.authorization.split(' ')[1];
        }

        if (!refreshTokenStr) {
            return res.status(401).json({ error: 'No refresh token provided.' });
        }

        // 2. Verify refresh token
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

        // 3. Fetch latest profile (role may have changed!)
        const { data: profile, error } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', decoded.userId)
            .single();

        if (error || !profile) {
            clearTokenCookies(res);
            return res.status(401).json({ error: 'Account not found. Please login again.' });
        }

        const role = profile.role || 'customer';

        // 4. Issue new tokens
        const newAccessToken = generateAccessToken(decoded.userId, profile.email, role);
        const newRefreshToken = generateRefreshToken(decoded.userId, profile.email, role);

        setTokenCookies(res, newAccessToken, newRefreshToken);

        const user = buildUserResponse(profile);

        res.json({
            message: 'Token refreshed',
            token: newAccessToken,
            refreshToken: newRefreshToken,
            user
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
    // Sign out Supabase auth (best-effort)
    await supabase.auth.signOut().catch(() => { });
    res.json({ message: 'Logged out successfully.' });
};

// ─── GET /api/auth/me ───────────────────────────────────────
// Returns the currently authenticated user (from middleware)
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated.' });
        }

        const user = buildUserResponse(req.user.profile);
        res.json({ user });
    } catch (err) {
        console.error('GetMe error:', err);
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
};

// ─── PUT /api/auth/profile ──────────────────────────────────
// Update current user's profile
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

        const { data: profile, error } = await supabaseAdmin
            .from('user_profiles')
            .update(updates)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        const user = buildUserResponse(profile);
        res.json({ message: 'Profile updated.', user });
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

        // Verify current password by attempting login
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: req.user.email,
            password: currentPassword
        });

        if (authError) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        // Update password via admin client
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            req.user.id,
            { password: newPassword }
        );

        if (updateError) {
            return res.status(500).json({ error: 'Failed to update password.' });
        }

        // Sign out supabase client
        await supabase.auth.signOut().catch(() => { });

        res.json({ message: 'Password changed successfully.' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ error: 'Failed to change password.' });
    }
};

module.exports = { signup, login, refresh, logout, getMe, updateProfile, changePassword };
