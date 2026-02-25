const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const Cart = require('../models/Cart');
const InventoryLog = require('../models/InventoryLog');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/payments/create-razorpay-order
const createRazorpayOrder = async (req, res) => {
    try {
        const { order_id } = req.body;
        if (!order_id) return res.status(400).json({ error: 'Order ID is required.' });

        const order = await Order.findOne({ _id: order_id, user_id: req.user.id });
        if (!order) return res.status(404).json({ error: 'Order not found.' });
        if (order.payment_status === 'paid') return res.status(400).json({ error: 'Order is already paid.' });

        // Idempotency: return existing razorpay order if already created
        if (order.razorpay_order_id) {
            return res.json({
                razorpay_order_id: order.razorpay_order_id,
                amount: Math.round(parseFloat(order.total_amount) * 100),
                currency: 'INR',
                key_id: process.env.RAZORPAY_KEY_ID
            });
        }

        const amountInPaise = Math.round(parseFloat(order.total_amount) * 100);

        const rzpOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${order._id.toString().slice(0, 20)}`,
            notes: { order_id: order._id.toString(), user_id: req.user.id }
        });

        // Save razorpay_order_id
        order.razorpay_order_id = rzpOrder.id;
        await order.save();

        // Create pending payment record
        await Payment.create({
            order_id: order._id,
            amount: order.total_amount,
            status: 'pending'
        });

        res.json({
            razorpay_order_id: rzpOrder.id,
            amount: amountInPaise,
            currency: 'INR',
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error('Create Razorpay order error:', err);
        res.status(500).json({ error: 'Failed to initiate payment.' });
    }
};

// POST /api/payments/verify
const verifyPayment = async (req, res) => {
    try {
        const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment details.' });
        }

        // Verify HMAC-SHA256 signature
        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expected !== razorpay_signature) {
            await Payment.findOneAndUpdate(
                { order_id },
                { status: 'failed' }
            );
            return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
        }

        // Fetch order
        const order = await Order.findOne({ _id: order_id, user_id: req.user.id });
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        // Idempotency
        if (order.payment_status === 'paid') {
            return res.json({ message: 'Payment already processed.', order_id });
        }

        // Update payment record
        await Payment.findOneAndUpdate(
            { order_id },
            {
                razorpay_payment_id,
                razorpay_signature,
                status: 'captured',
                method: 'razorpay'
            }
        );

        // Update order status
        order.status = 'confirmed';
        order.payment_status = 'paid';
        await order.save();

        // Deduct stock & log inventory for each item
        for (const item of order.order_items) {
            await Product.findByIdAndUpdate(item.product_id, {
                $inc: { stock: -item.quantity }
            });

            await InventoryLog.create({
                product_id: item.product_id,
                change_amount: -item.quantity,
                reason: `Sale — Order ${order_id}`
            });
        }

        // Clear cart
        await Cart.findOneAndUpdate(
            { user_id: req.user.id },
            { $set: { items: [] } }
        );

        res.json({ message: 'Payment successful! Your order has been confirmed.', order_id });
    } catch (err) {
        console.error('Verify payment error:', err);
        res.status(500).json({ error: 'Payment verification failed. Please contact support.' });
    }
};

module.exports = { createRazorpayOrder, verifyPayment };
