const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const InventoryLog = require('../models/InventoryLog');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/orders/create
const createOrder = async (req, res) => {
    try {
        const { address, items: frontendItems, delivery_fee } = req.body;
        const userId = req.user.id;

        // Optionally update user address
        if (address) {
            await User.findByIdAndUpdate(userId, { address });
        }

        let orderItemsSource = [];

        // If frontend sends items directly (from localStorage cart)
        if (frontendItems && frontendItems.length > 0) {
            orderItemsSource = frontendItems;
        } else {
            // Fallback: use server-side cart
            const cart = await Cart.findOne({ user_id: userId });
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ error: 'Your cart is empty.' });
            }

            await cart.populate('items.product_id', 'name price stock is_active');

            orderItemsSource = cart.items.map(ci => ({
                id: ci.product_id._id.toString(),
                quantity: ci.quantity
            }));
        }

        // Validate items — always use server-side price
        let total = 0;
        const orderItemsData = [];
        const errors = [];

        for (const item of orderItemsSource) {
            const productId = item.id || item.product_id || item._id;
            const qty = parseInt(item.quantity);

            if (!productId || !isValidId(productId)) {
                errors.push('Invalid product. Please refresh your cart and try again.');
                continue;
            }

            const product = await Product.findById(productId);

            if (!product || !product.is_active) {
                errors.push('A product is no longer available.');
                continue;
            }
            if (qty > product.stock) {
                errors.push(`"${product.name}" only has ${product.stock} units left.`);
                continue;
            }

            const serverPrice = parseFloat(product.price);
            total += serverPrice * qty;
            orderItemsData.push({
                product_id: product._id,
                quantity: qty,
                price: serverPrice
            });
        }

        if (errors.length > 0) return res.status(400).json({ error: errors.join(' ') });
        if (orderItemsData.length === 0) return res.status(400).json({ error: 'No valid items in cart.' });

        // Calculate delivery fee server-side (₹50 if subtotal < ₹500, else free)
        const serverDeliveryFee = total >= 500 ? 0 : 50;
        const grandTotal = total + serverDeliveryFee;

        // Create order with embedded items
        const order = await Order.create({
            user_id: userId,
            status: 'pending',
            payment_status: 'unpaid',
            total_amount: grandTotal,
            delivery_fee: serverDeliveryFee,
            order_items: orderItemsData
        });

        // Deduct stock and log inventory
        for (const item of orderItemsData) {
            await Product.findByIdAndUpdate(item.product_id, {
                $inc: { stock: -item.quantity }
            });

            await InventoryLog.create({
                product_id: item.product_id,
                change_amount: -item.quantity,
                reason: `Order ${order._id.toString().slice(0, 8)}`
            });
        }

        // Clear server-side cart
        await Cart.findOneAndUpdate(
            { user_id: userId },
            { $set: { items: [] } }
        );

        // Return order with id field
        const orderResponse = order.toObject();
        orderResponse.id = orderResponse._id;

        res.status(201).json({ message: 'Order created successfully.', order: orderResponse });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ error: 'Failed to create order.' });
    }
};

// GET /api/orders/my
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user_id: req.user.id })
            .sort({ created_at: -1 })
            .lean();

        // Populate product details in order items
        for (const order of orders) {
            order.id = order._id;
            for (const item of order.order_items) {
                const product = await Product.findById(item.product_id).select('name image_url price').lean();
                item.products = product ? { id: product._id, name: product.name, image_url: product.image_url, price: product.price } : null;
            }
        }

        res.json({ orders: orders || [] });
    } catch (err) {
        console.error('Get my orders error:', err);
        res.status(500).json({ error: 'Failed to fetch orders.' });
    }
};

// GET /api/orders/my/:id
const getMyOrder = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(404).json({ error: 'Order not found.' });
        }

        const order = await Order.findOne({ _id: id, user_id: req.user.id }).lean();
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        order.id = order._id;

        // Populate products in items
        for (const item of order.order_items) {
            const product = await Product.findById(item.product_id).select('name image_url price').lean();
            item.products = product ? { id: product._id, name: product.name, image_url: product.image_url, price: product.price } : null;
        }

        // Get related payments
        const Payment = require('../models/Payment');
        order.payments = await Payment.find({ order_id: order._id }).lean();

        res.json({ order });
    } catch (err) {
        console.error('Get order error:', err);
        res.status(500).json({ error: 'Failed to fetch order.' });
    }
};

module.exports = { createOrder, getMyOrders, getMyOrder };
