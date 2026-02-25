const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Helper: get or create cart for user
const getOrCreateCart = async (userId) => {
    let cart = await Cart.findOne({ user_id: userId });
    if (!cart) {
        cart = await Cart.create({ user_id: userId, items: [] });
    }
    return cart;
};

// GET /api/cart
const getCart = async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.id);

        // Populate product details in cart items
        await cart.populate('items.product_id', 'id name price stock image_url is_active');

        // Filter out deleted/inactive products
        const validItems = cart.items
            .filter(item => item.product_id && item.product_id.is_active)
            .map(item => ({
                _id: item._id,
                id: item._id,
                product_id: item.product_id._id,
                quantity: item.quantity,
                price: item.price,
                products: {
                    id: item.product_id._id,
                    name: item.product_id.name,
                    price: item.product_id.price,
                    stock: item.product_id.stock,
                    image_url: item.product_id.image_url,
                    is_active: item.product_id.is_active
                }
            }));

        res.json({
            cart: {
                id: cart._id,
                user_id: cart.user_id,
                items: validItems
            }
        });
    } catch (err) {
        console.error('Get cart error:', err);
        res.status(500).json({ error: 'Failed to fetch cart.' });
    }
};

// POST /api/cart/add
const addToCart = async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;

        if (!product_id || parseInt(quantity) < 1 || !isValidId(product_id)) {
            return res.status(400).json({ error: 'Invalid product or quantity.' });
        }

        const product = await Product.findById(product_id);
        if (!product) return res.status(404).json({ error: 'Product not found.' });
        if (!product.is_active) return res.status(400).json({ error: 'This product is not available.' });

        const cart = await getOrCreateCart(req.user.id);

        // Check if already in cart
        const existingIdx = cart.items.findIndex(
            item => item.product_id.toString() === product_id.toString()
        );

        const newQty = existingIdx >= 0
            ? cart.items[existingIdx].quantity + parseInt(quantity)
            : parseInt(quantity);

        if (newQty > product.stock) {
            return res.status(400).json({ error: `Only ${product.stock} units available.` });
        }

        if (existingIdx >= 0) {
            cart.items[existingIdx].quantity = newQty;
        } else {
            cart.items.push({
                product_id,
                quantity: newQty,
                price: product.price
            });
        }

        await cart.save();
        res.json({ message: `${product.name} added to cart.` });
    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(500).json({ error: 'Failed to add item to cart.' });
    }
};

// PUT /api/cart/update
const updateCart = async (req, res) => {
    try {
        const { cart_item_id, quantity } = req.body;

        if (!cart_item_id || quantity === undefined || parseInt(quantity) < 0) {
            return res.status(400).json({ error: 'Invalid cart item or quantity.' });
        }

        const cart = await getOrCreateCart(req.user.id);
        const itemIdx = cart.items.findIndex(i => i._id.toString() === cart_item_id);

        if (itemIdx < 0) return res.status(404).json({ error: 'Cart item not found.' });

        if (parseInt(quantity) === 0) {
            cart.items.splice(itemIdx, 1);
            await cart.save();
            return res.json({ message: 'Item removed from cart.' });
        }

        // Check stock
        const product = await Product.findById(cart.items[itemIdx].product_id);
        if (product && parseInt(quantity) > product.stock) {
            return res.status(400).json({ error: `Only ${product.stock} units available.` });
        }

        cart.items[itemIdx].quantity = parseInt(quantity);
        await cart.save();

        res.json({ message: 'Cart updated.' });
    } catch (err) {
        console.error('Update cart error:', err);
        res.status(500).json({ error: 'Failed to update cart.' });
    }
};

// DELETE /api/cart/remove
const removeFromCart = async (req, res) => {
    try {
        const { cart_item_id } = req.body;
        if (!cart_item_id) return res.status(400).json({ error: 'Cart item ID required.' });

        const cart = await getOrCreateCart(req.user.id);
        cart.items = cart.items.filter(i => i._id.toString() !== cart_item_id);
        await cart.save();

        res.json({ message: 'Item removed from cart.' });
    } catch (err) {
        console.error('Remove from cart error:', err);
        res.status(500).json({ error: 'Failed to remove item.' });
    }
};

// DELETE /api/cart/clear
const clearCart = async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.id);
        cart.items = [];
        await cart.save();
        res.json({ message: 'Cart cleared.' });
    } catch (err) {
        console.error('Clear cart error:', err);
        res.status(500).json({ error: 'Failed to clear cart.' });
    }
};

module.exports = { getCart, addToCart, updateCart, removeFromCart, clearCart };
