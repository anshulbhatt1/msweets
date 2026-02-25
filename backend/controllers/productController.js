const Product = require('../models/Product');
const Category = require('../models/Category');

// GET /api/products
const getProducts = async (req, res) => {
    try {
        const { category, search, sort = 'created_at', order = 'desc', page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = { is_active: true };

        // Category filter (by name or id)
        if (category) {
            let cat = null;
            // Try by ObjectId first
            if (category.match(/^[0-9a-fA-F]{24}$/)) {
                cat = await Category.findById(category);
            }
            if (!cat) {
                cat = await Category.findOne({ name: new RegExp(`^${category}$`, 'i') });
            }
            if (cat) filter.category_id = cat._id;
        }

        // Search filter
        if (search) {
            filter.$or = [
                { name: new RegExp(search, 'i') },
                { description: new RegExp(search, 'i') }
            ];
        }

        const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate('category_id', 'id name')
                .sort(sortObj)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Product.countDocuments(filter)
        ]);

        // Map to match frontend expected shape (categories field)
        const mapped = products.map(p => ({
            ...p,
            id: p._id,
            categories: p.category_id ? { id: p.category_id._id, name: p.category_id.name } : null
        }));

        res.json({
            products: mapped,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
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
        const categories = await Category.find().sort({ name: 1 }).lean();
        const mapped = categories.map(c => ({ ...c, id: c._id }));
        res.json({ categories: mapped });
    } catch (err) {
        console.error('Get categories error:', err);
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
};

// GET /api/products/:id
const getProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        const product = await Product.findOne({ _id: id, is_active: true })
            .populate('category_id', 'id name')
            .lean();

        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        const mapped = {
            ...product,
            id: product._id,
            categories: product.category_id ? { id: product.category_id._id, name: product.category_id.name } : null
        };

        res.json({ product: mapped });
    } catch (err) {
        console.error('Get product error:', err);
        res.status(500).json({ error: 'Failed to fetch product.' });
    }
};

module.exports = { getProducts, getCategories, getProduct };
