const { supabaseAdmin } = require('../config/supabase');

// ── Products ──────────────────────────────────────────────

const getAllProducts = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*, categories(id, name)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ products: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch products.' });
    }
};

const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category_id, image_url, is_active = true } = req.body;

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert({
                name,
                description,
                price: parseFloat(price),
                stock: parseInt(stock) || 0,
                category_id,
                image_url,
                is_active
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Product created.', product: data });
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

        const { data, error } = await supabaseAdmin
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'Product updated.', product: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update product.' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        // Soft delete
        await supabaseAdmin
            .from('products')
            .update({ is_active: false })
            .eq('id', id);
        res.json({ message: 'Product deactivated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete product.' });
    }
};

// ── Categories ────────────────────────────────────────────

const getCategories = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('categories')
            .select('*')
            .order('name');
        if (error) throw error;
        res.json({ categories: data });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, description, image_url } = req.body;
        if (!name) return res.status(400).json({ error: 'Category name is required.' });

        const { data, error } = await supabaseAdmin
            .from('categories')
            .insert({ name, description, image_url })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Category created.', category: data });
    } catch (err) {
        console.error(err);
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

        const { data, error } = await supabaseAdmin
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'Category updated.', category: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update category.' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        await supabaseAdmin.from('categories').delete().eq('id', req.params.id);
        res.json({ message: 'Category deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete category.' });
    }
};

// ── Orders ────────────────────────────────────────────────

const getAllOrders = async (req, res) => {
    try {
        const { status, payment_status, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabaseAdmin
            .from('orders')
            .select(`
        *,
        user_profiles:user_id(full_name, email),
        order_items(*, products(name, price, image_url))
      `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (status) query = query.eq('status', status);
        if (payment_status) query = query.eq('payment_status', payment_status);

        const { data, error, count } = await query;
        if (error) throw error;
        res.json({ orders: data, total: count });
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

        const { data, error } = await supabaseAdmin
            .from('orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'Order status updated.', order: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update order status.' });
    }
};

// ── Users (Admin) ─────────────────────────────────────────

const getAllUsers = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ users: data });
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

        const { data, error } = await supabaseAdmin
            .from('user_profiles')
            .update({ role })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ message: 'User role updated.', user: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user role.' });
    }
};

// ── Inventory Logs ────────────────────────────────────────

const getInventoryLogs = async (req, res) => {
    try {
        const { product_id, page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabaseAdmin
            .from('inventory_logs')
            .select('*, products(id, name)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + parseInt(limit) - 1);

        if (product_id) query = query.eq('product_id', product_id);

        const { data, error, count } = await query;
        if (error) throw error;
        res.json({ logs: data, total: count });
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

        const { data: orders } = await supabaseAdmin
            .from('orders')
            .select('total_amount, status, created_at')
            .gte('created_at', since.toISOString())
            .eq('payment_status', 'paid');

        const totalRevenue = (orders || []).reduce((s, o) => s + parseFloat(o.total_amount), 0);
        const totalOrders = (orders || []).length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const { count: totalCustomers } = await supabaseAdmin
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer');

        // Revenue by day (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentOrders } = await supabaseAdmin
            .from('orders')
            .select('total_amount, created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .eq('payment_status', 'paid');

        const revenueByDay = {};
        (recentOrders || []).forEach(o => {
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
        const { data } = await supabaseAdmin
            .from('order_items')
            .select('product_id, quantity, price, products(id, name, image_url, price)');

        const map = {};
        (data || []).forEach(item => {
            if (!item.products) return;
            const pid = item.product_id;
            if (!map[pid]) map[pid] = { ...item.products, total_quantity: 0, total_revenue: 0 };
            map[pid].total_quantity += item.quantity;
            map[pid].total_revenue += parseFloat(item.price) * item.quantity;
        });

        const topProducts = Object.values(map)
            .sort((a, b) => b.total_quantity - a.total_quantity)
            .slice(0, 10);

        res.json({ topProducts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch top products.' });
    }
};

const getLowStock = async (req, res) => {
    try {
        const { threshold = 10 } = req.query;
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('id, name, stock, image_url, categories(name)')
            .eq('is_active', true)
            .lte('stock', parseInt(threshold))
            .order('stock', { ascending: true });

        if (error) throw error;
        res.json({ lowStockProducts: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch low stock.' });
    }
};

// ── Payments ──────────────────────────────────────────────

const getAllPayments = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('payments')
            .select('*, orders(id, user_id, total_amount, status)')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json({ payments: data });
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
