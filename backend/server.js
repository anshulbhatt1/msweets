require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-New-Access-Token']   // allow frontend to read refreshed tokens
}));

// Body parsers + cookies (BEFORE routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Rate limiting ───────────────────────────────────────────
// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

// Strict limiter for login/signup only (not /me or /refresh)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many auth attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Only apply to login and signup
  skip: (req) => {
    const path = req.path.toLowerCase();
    return path !== '/login' && path !== '/signup';
  }
});

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Sweet Haven Backend running on port ${PORT}`);
  console.log(`🌐 CORS origin: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

  // ── Startup Supabase connectivity check ──
  try {
    const { supabaseAdmin } = require('./config/supabase');
    const { data, error } = await supabaseAdmin.from('user_profiles').select('id').limit(1);
    if (error) {
      console.warn(`⚠️  Supabase connected but query failed: ${error.message}`);
      console.warn(`   Check that your tables exist (run supabase-schema.sql if needed).`);
    } else {
      console.log(`✅ Supabase connected successfully!`);
    }
  } catch (err) {
    console.error(`❌ SUPABASE CONNECTION FAILED!`);
    console.error(`   URL: ${process.env.SUPABASE_URL}`);
    console.error(`   Error: ${err.message}`);
    console.error(`   → Your Supabase project may be PAUSED. Go to https://supabase.com/dashboard to restore it.`);
    console.error(`   → Auth (login/signup) will NOT work until Supabase is reachable.`);
  }
});
