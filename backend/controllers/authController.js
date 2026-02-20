const jwt = require('jsonwebtoken');
const { supabase, supabaseAdmin } = require('../config/supabase');

// Generate JWT token
const generateToken = (userId, email, role) => {
    return jwt.sign(
        { userId, email, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Set auth cookie
const setAuthCookie = (res, token) => {
    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

// POST /api/auth/signup
const signup = async (req, res) => {
    try {
        const { email, password, full_name, phone } = req.body;

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name, phone }
            }
        });

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        if (!authData.user) {
            return res.status(400).json({ error: 'Signup failed. Please try again.' });
        }

        // The trigger should auto-create user_profiles, but we upsert to ensure it exists
        await supabaseAdmin
            .from('user_profiles')
            .upsert({
                id: authData.user.id,
                email,
                full_name,
                phone: phone || null,
                role: 'customer'
            }, { onConflict: 'id' });

        // Fetch profile
        const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        const token = generateToken(authData.user.id, email, profile?.role || 'customer');
        setAuthCookie(res, token);

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: {
                id: authData.user.id,
                email,
                full_name,
                role: profile?.role || 'customer'
            }
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Signup failed. Please try again.' });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Authenticate with Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // Fetch user profile from our DB
        let { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (!profile) {
            // Profile missing — create it and get the new profile back
            const { data: newProfile, error: upsertError } = await supabaseAdmin
                .from('user_profiles')
                .upsert({
                    id: authData.user.id,
                    email,
                    full_name: authData.user.user_metadata?.full_name || email.split('@')[0],
                    role: 'customer'
                }, { onConflict: 'id' })
                .select()
                .single();

            if (upsertError) {
                console.error('Profile creation error:', upsertError);
                return res.status(500).json({ error: 'Failed to initialize profile.' });
            }
            profile = newProfile;
        }

        const userRole = profile.role || 'customer';
        const token = generateToken(authData.user.id, email, userRole);
        setAuthCookie(res, token);

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: authData.user.id,
                email,
                full_name: profile.full_name || authData.user.user_metadata?.full_name,
                role: userRole
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
};

// POST /api/auth/logout
const logout = async (req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    res.json({ message: 'Logged out successfully' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
    res.json({ user: req.user });
};

module.exports = { signup, login, logout, getMe };
