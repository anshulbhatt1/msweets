const { supabaseAdmin } = require('../config/supabase');

// GET /api/products
const getProducts = async (req, res) => {
    try {
        const { category, search, sort = 'created_at', order = 'desc', page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = supabaseAdmin
            .from('products')
            .select(`*, categories(id, name)`, { count: 'exact' })
            .eq('is_active', true);

        if (category) {
            // category can be a name or id
            const { data: cat } = await supabaseAdmin
                .from('categories')
                .select('id')
                .or(`name.ilike.${category},id.eq.${category}`)
                .maybeSingle();
            if (cat) query = query.eq('category_id', cat.id);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        query = query
            .order(sort, { ascending: order === 'asc' })
            .range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        res.json({
            products: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                pages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('Get products error:', err);
        res.status(500).json({ error: 'Failed to fetch products.' });
    }
};

// GET /api/products/categories
const getCategories = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('categories')
            .select('*')
            .order('name');
        if (error) throw error;
        res.json({ categories: data });
    } catch (err) {
        console.error('Get categories error:', err);
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
};

// GET /api/products/:id
const getProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const { data: product, error } = await supabaseAdmin
            .from('products')
            .select(`*, categories(id, name)`)
            .eq('id', id)
            .eq('is_active', true)
            .single();

        if (error || !product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Fetch product images
        const { data: images } = await supabaseAdmin
            .from('product_images')
            .select('*')
            .eq('product_id', id);

        // Fetch reviews with joined user profile
        const { data: reviews } = await supabaseAdmin
            .from('reviews')
            .select(`*, user_profiles:user_id(full_name)`)
            .eq('product_id', id)
            .order('created_at', { ascending: false })
            .limit(10);

        res.json({ product: { ...product, images: images || [], reviews: reviews || [] } });
    } catch (err) {
        console.error('Get product error:', err);
        res.status(500).json({ error: 'Failed to fetch product.' });
    }
};

module.exports = { getProducts, getCategories, getProduct };
