const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// POST /api/auth/signup
router.post(
    '/signup',
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('full_name').notEmpty().trim().withMessage('Full name required')
    ],
    validate,
    authController.signup
);

// POST /api/auth/login
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        body('password').notEmpty().withMessage('Password required')
    ],
    validate,
    authController.login
);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// GET /api/auth/me - get current user info
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
