const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const Payment = require('../models/Payment');
const InventoryLog = require('../models/InventoryLog');

// ── Products ──────────────────────────────────────────────

const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
            .populate('category_id', 'name')
            .sort({ created_at: -1 })
            .lean();

        const mapped = products.map(p => ({
            ...p,
            id: p._id,
            categories: p.category_id ? { id: p.category_id._id, name: p.category_id.name } : null
        }));

        res.json({ products: mapped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch products.' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category_id, image_url, is_active = true } = req.body;

        const product = await Product.create({
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            category_id,
            image_url,
            is_active
        });

        const result = product.toObject();
        result.id = result._id;
        res.status(201).json({ message: 'Product created.', product: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create product.' });
    }
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, stock, category_id, image_url, is_active, rating } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (price !== undefined) updates.price = parseFloat(price);
        if (stock !== undefined) updates.stock = parseInt(stock);
        if (category_id !== undefined) updates.category_id = category_id;
        if (image_url !== undefined) updates.image_url = image_url;
        if (is_active !== undefined) updates.is_active = is_active;
        if (rating !== undefined) updates.rating = parseFloat(rating);

        const product = await Product.findByIdAndUpdate(id, updates, { new: true }).lean();
        if (!product) return res.status(404).json({ error: 'Product not found.' });

        product.id = product._id;
        res.json({ message: 'Product updated.', product });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update product.' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndUpdate(id, { is_active: false });
        res.json({ message: 'Product deactivated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete product.' });
    }
};

// ── Categories ────────────────────────────────────────────

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 }).lean();
        const mapped = categories.map(c => ({ ...c, id: c._id }));
        res.json({ categories: mapped });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, description, image_url } = req.body;
        if (!name) return res.status(400).json({ error: 'Category name is required.' });

        const category = await Category.create({ name, description, image_url });
        const result = category.toObject();
        result.id = result._id;
        res.status(201).json({ message: 'Category created.', category: result });
    } catch (err) {
        console.error(err);
        if (err.code === 11000) return res.status(400).json({ error: 'Category already exists.' });
        res.status(500).json({ error: 'Failed to create category.' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image_url } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (image_url !== undefined) updates.image_url = image_url;

        const category = await Category.findByIdAndUpdate(id, updates, { new: true }).lean();
        if (!category) return res.status(404).json({ error: 'Category not found.' });

        category.id = category._id;
        res.json({ message: 'Category updated.', category });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update category.' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete category.' });
    }
};

// ── Orders ────────────────────────────────────────────────

const getAllOrders = async (req, res) => {
    try {
        const { status, payment_status, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (status) filter.status = status;
        if (payment_status) filter.payment_status = payment_status;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Order.countDocuments(filter)
        ]);

        // Populate user info and product details
        for (const order of orders) {
            order.id = order._id;
            // Get user info
            const user = await User.findById(order.user_id).select('full_name email').lean();
            order.user_profiles = user ? { full_name: user.full_name, email: user.email } : null;

            // Populate products in items
            for (const item of order.order_items) {
                const product = await Product.findById(item.product_id).select('name price image_url').lean();
                item.products = product ? { name: product.name, price: product.price, image_url: product.image_url } : null;
            }
        }

        res.json({ orders, total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch orders.' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const valid = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];
        if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status.' });

        const order = await Order.findByIdAndUpdate(id, { status }, { new: true }).lean();
        if (!order) return res.status(404).json({ error: 'Order not found.' });

        order.id = order._id;
        res.json({ message: 'Order status updated.', order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update order status.' });
    }
};

// ── Users ─────────────────────────────────────────────────

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ created_at: -1 }).lean();
        const mapped = users.map(u => ({ ...u, id: u._id }));
        res.json({ users: mapped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['customer', 'admin'];
        if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role.' });

        const user = await User.findByIdAndUpdate(id, { role }, { new: true }).lean();
        if (!user) return res.status(404).json({ error: 'User not found.' });

        user.id = user._id;
        res.json({ message: 'User role updated.', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user role.' });
    }
};

// ── Inventory Logs ────────────────────────────────────────

const getInventoryLogs = async (req, res) => {
    try {
        const { product_id, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (product_id) filter.product_id = product_id;

        const [logs, total] = await Promise.all([
            InventoryLog.find(filter)
                .populate('product_id', 'name')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            InventoryLog.countDocuments(filter)
        ]);

        // Map to match frontend expected shape
        const mapped = logs.map(l => ({
            ...l,
            id: l._id,
            products: l.product_id ? { id: l.product_id._id, name: l.product_id.name } : null
        }));

        res.json({ logs: mapped, total });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch inventory logs.' });
    }
};

// ── Reports ───────────────────────────────────────────────

const getSalesSummary = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const since = new Date();
        since.setDate(since.getDate() - parseInt(days));

        const orders = await Order.find({
            payment_status: 'paid',
            created_at: { $gte: since }
        }).select('total_amount status created_at').lean();

        const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.total_amount), 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const totalCustomers = await User.countDocuments({ role: 'customer' });

        // Revenue by day (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentOrders = await Order.find({
            payment_status: 'paid',
            created_at: { $gte: sevenDaysAgo }
        }).select('total_amount created_at').lean();

        const revenueByDay = {};
        recentOrders.forEach(o => {
            const day = new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            revenueByDay[day] = (revenueByDay[day] || 0) + parseFloat(o.total_amount);
        });

        res.json({
            totalRevenue,
            totalOrders,
            totalCustomers,
            avgOrderValue,
            revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch sales summary.' });
    }
};

const getTopProducts = async (req, res) => {
    try {
        // Aggregate order items across all orders
        const result = await Order.aggregate([
            { $unwind: '$order_items' },
            {
                $group: {
                    _id: '$order_items.product_id',
                    total_quantity: { $sum: '$order_items.quantity' },
                    total_revenue: { $sum: { $multiply: ['$order_items.price', '$order_items.quantity'] } }
                }
            },
            { $sort: { total_quantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    id: '$_id',
                    name: '$product.name',
                    image_url: '$product.image_url',
                    price: '$product.price',
                    total_quantity: 1,
                    total_revenue: 1
                }
            }
        ]);

        res.json({ topProducts: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch top products.' });
    }
};

const getLowStock = async (req, res) => {
    try {
        const { threshold = 10 } = req.query;

        const products = await Product.find({
            is_active: true,
            stock: { $lte: parseInt(threshold) }
        })
            .populate('category_id', 'name')
            .sort({ stock: 1 })
            .lean();

        const mapped = products.map(p => ({
            id: p._id,
            name: p.name,
            stock: p.stock,
            image_url: p.image_url,
            categories: p.category_id ? { name: p.category_id.name } : null
        }));

        res.json({ lowStockProducts: mapped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch low stock.' });
    }
};

// ── Payments ──────────────────────────────────────────────

const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate({
                path: 'order_id',
                select: 'user_id total_amount status'
            })
            .sort({ created_at: -1 })
            .limit(100)
            .lean();

        const mapped = payments.map(p => ({
            ...p,
            id: p._id,
            orders: p.order_id ? {
                id: p.order_id._id,
                user_id: p.order_id.user_id,
                total_amount: p.order_id.total_amount,
                status: p.order_id.status
            } : null
        }));

        res.json({ payments: mapped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch payments.' });
    }
};

module.exports = {
    getAllProducts, createProduct, updateProduct, deleteProduct,
    getCategories, createCategory, updateCategory, deleteCategory,
    getAllOrders, updateOrderStatus,
    getAllUsers, updateUserRole,
    getInventoryLogs,
    getSalesSummary, getTopProducts, getLowStock,
    getAllPayments
};
