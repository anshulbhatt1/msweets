const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.use(authMiddleware);

// Create Razorpay order
router.post('/create-razorpay-order', paymentController.createRazorpayOrder);

// Verify payment after success
router.post('/verify', paymentController.verifyPayment);

module.exports = router;
