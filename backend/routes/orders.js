const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// All order routes require auth
router.use(authMiddleware);

// Customer routes
router.post('/create', orderController.createOrder);
router.get('/my', orderController.getMyOrders);
router.get('/my/:id', orderController.getMyOrder);

module.exports = router;
