const Razorpay = require('razorpay');
const crypto = require('crypto');
const { supabaseAdmin } = require('../config/supabase');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// POST /api/payments/create-razorpay-order
const createRazorpayOrder = async (req, res) => {
    try {
        const { order_id } = req.body;
        if (!order_id) return res.status(400).json({ error: 'Order ID is required.' });

        // Fetch order — use server-side amount only
        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', order_id)
            .eq('user_id', req.user.id)
            .single();

        if (error || !order) return res.status(404).json({ error: 'Order not found.' });
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
            receipt: `rcpt_${order_id.slice(0, 20)}`,
            notes: { order_id, user_id: req.user.id }
        });

        // Save razorpay_order_id on our orders table
        await supabaseAdmin
            .from('orders')
            .update({ razorpay_order_id: rzpOrder.id })
            .eq('id', order_id);

        // Create pending payment record
        await supabaseAdmin.from('payments').insert({
            order_id,
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
            await supabaseAdmin
                .from('payments')
                .update({ status: 'failed' })
                .eq('order_id', order_id);
            return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
        }

        // Fetch order with items
        const { data: order, error: oe } = await supabaseAdmin
            .from('orders')
            .select(`*, order_items(*, products(id, stock))`)
            .eq('id', order_id)
            .eq('user_id', req.user.id)
            .single();

        if (oe || !order) return res.status(404).json({ error: 'Order not found.' });

        // Idempotency
        if (order.payment_status === 'paid') {
            return res.json({ message: 'Payment already processed.', order_id });
        }

        // Update payment record
        await supabaseAdmin
            .from('payments')
            .update({
                razorpay_payment_id,
                razorpay_signature,
                status: 'captured',
                method: 'razorpay'
            })
            .eq('order_id', order_id);

        // Update order
        await supabaseAdmin
            .from('orders')
            .update({ status: 'confirmed', payment_status: 'paid' })
            .eq('id', order_id);

        // Reduce stock & log inventory
        for (const item of order.order_items) {
            const product = item.products;
            if (!product) continue;
            const newStock = Math.max(0, product.stock - item.quantity);

            await supabaseAdmin
                .from('products')
                .update({ stock: newStock })
                .eq('id', item.product_id);

            await supabaseAdmin.from('inventory_logs').insert({
                product_id: item.product_id,
                change_amount: -item.quantity,
                reason: `Sale — Order ${order_id}`
            });
        }

        // Clear cart
        const { data: cart } = await supabaseAdmin
            .from('carts')
            .select('id')
            .eq('user_id', req.user.id)
            .maybeSingle();

        if (cart) {
            await supabaseAdmin.from('cart_items').delete().eq('cart_id', cart.id);
        }

        res.json({ message: 'Payment successful! Your order has been confirmed.', order_id });
    } catch (err) {
        console.error('Verify payment error:', err);
        res.status(500).json({ error: 'Payment verification failed. Please contact support.' });
    }
};

module.exports = { createRazorpayOrder, verifyPayment };
