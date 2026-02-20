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
        const { name, description, price, stock, category_id, image_url, slug, is_active = true } = req.body;

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert({
                name,
                description,
                price: parseFloat(price),
                stock: parseInt(stock) || 0,
                category_id,
                image_url,
                slug: slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
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
        const { name, description, price, stock, category_id, image_url, slug, is_active } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (price !== undefined) updates.price = parseFloat(price);
        if (stock !== undefined) updates.stock = parseInt(stock);
        if (category_id !== undefined) updates.category_id = category_id;
        if (image_url !== undefined) updates.image_url = image_url;
        if (slug !== undefined) updates.slug = slug;
        if (is_active !== undefined) updates.is_active = is_active;

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
        order_items(*, products(name, price))
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
            .select('id, name, stock, categories(name)')
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

// ── Reviews ───────────────────────────────────────────────

const getReviews = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('reviews')
            .select(`*, products(name), user_profiles(full_name)`)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        res.json({ reviews: data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch reviews.' });
    }
};

module.exports = {
    getAllProducts, createProduct, updateProduct, deleteProduct,
    getCategories, createCategory, deleteCategory,
    getAllOrders, updateOrderStatus,
    getSalesSummary, getTopProducts, getLowStock,
    getReviews
};
