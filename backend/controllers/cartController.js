const { supabaseAdmin } = require('../config/supabase');

// Helper: get or create cart for user
const getOrCreateCart = async (userId) => {
    let { data: cart } = await supabaseAdmin
        .from('carts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (!cart) {
        const { data: newCart, error } = await supabaseAdmin
            .from('carts')
            .insert({ user_id: userId })
            .select()
            .single();
        if (error) throw error;
        cart = newCart;
    }
    return cart;
};

// GET /api/cart
const getCart = async (req, res) => {
    try {
        const cart = await getOrCreateCart(req.user.id);

        const { data: items, error } = await supabaseAdmin
            .from('cart_items')
            .select(`*, products(id, name, price, stock, image_url, is_active)`)
            .eq('cart_id', cart.id);

        if (error) throw error;

        // Filter out deleted / inactive products
        const validItems = (items || []).filter(item => item.products && item.products.is_active);

        res.json({ cart: { ...cart, items: validItems } });
    } catch (err) {
        console.error('Get cart error:', err);
        res.status(500).json({ error: 'Failed to fetch cart.' });
    }
};

// POST /api/cart/add
const addToCart = async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;

        if (!product_id || parseInt(quantity) < 1) {
            return res.status(400).json({ error: 'Invalid product or quantity.' });
        }

        // Verify product exists and is active
        const { data: product, error: pe } = await supabaseAdmin
            .from('products')
            .select('id, name, stock, is_active, price')
            .eq('id', product_id)
            .single();

        if (pe || !product) return res.status(404).json({ error: 'Product not found.' });
        if (!product.is_active) return res.status(400).json({ error: 'This product is not available.' });

        const cart = await getOrCreateCart(req.user.id);

        // Check existing item in cart
        const { data: existing } = await supabaseAdmin
            .from('cart_items')
            .select('*')
            .eq('cart_id', cart.id)
            .eq('product_id', product_id)
            .maybeSingle();

        const newQty = existing ? existing.quantity + parseInt(quantity) : parseInt(quantity);

        if (newQty > product.stock) {
            return res.status(400).json({ error: `Only ${product.stock} units available.` });
        }

        if (existing) {
            await supabaseAdmin
                .from('cart_items')
                .update({ quantity: newQty })
                .eq('id', existing.id);
        } else {
            await supabaseAdmin.from('cart_items').insert({
                cart_id: cart.id,
                product_id,
                quantity: newQty,
                price: product.price   // snapshot price at time of adding
            });
        }

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

        const { data: item, error: ie } = await supabaseAdmin
            .from('cart_items')
            .select(`*, products(stock, is_active)`)
            .eq('id', cart_item_id)
            .eq('cart_id', cart.id)
            .single();

        if (ie || !item) return res.status(404).json({ error: 'Cart item not found.' });

        if (parseInt(quantity) === 0) {
            await supabaseAdmin.from('cart_items').delete().eq('id', cart_item_id);
            return res.json({ message: 'Item removed from cart.' });
        }

        if (parseInt(quantity) > item.products.stock) {
            return res.status(400).json({ error: `Only ${item.products.stock} units available.` });
        }

        await supabaseAdmin.from('cart_items').update({ quantity: parseInt(quantity) }).eq('id', cart_item_id);

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

        await supabaseAdmin
            .from('cart_items')
            .delete()
            .eq('id', cart_item_id)
            .eq('cart_id', cart.id);

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
        await supabaseAdmin.from('cart_items').delete().eq('cart_id', cart.id);
        res.json({ message: 'Cart cleared.' });
    } catch (err) {
        console.error('Clear cart error:', err);
        res.status(500).json({ error: 'Failed to clear cart.' });
    }
};

module.exports = { getCart, addToCart, updateCart, removeFromCart, clearCart };
