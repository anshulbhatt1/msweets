const { supabaseAdmin } = require('../config/supabase');

// POST /api/orders/create
const createOrder = async (req, res) => {
    try {
        const { address, items: frontendItems } = req.body;
        const userId = req.user.id;

        // Optionally update user address on profile
        if (address) {
            await supabaseAdmin
                .from('user_profiles')
                .update({ address })
                .eq('id', userId);
        }

        let orderItemsSource = [];

        // If frontend sends items directly (from localStorage cart)
        if (frontendItems && frontendItems.length > 0) {
            orderItemsSource = frontendItems;
        } else {
            // Fallback: use server-side cart
            const { data: cart } = await supabaseAdmin
                .from('carts')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();

            if (!cart) return res.status(400).json({ error: 'Your cart is empty.' });

            const { data: cartItems } = await supabaseAdmin
                .from('cart_items')
                .select(`*, products(id, name, price, stock, is_active)`)
                .eq('cart_id', cart.id);

            if (!cartItems || cartItems.length === 0) {
                return res.status(400).json({ error: 'Your cart is empty.' });
            }

            orderItemsSource = cartItems.map(ci => ({
                id: ci.products.id,
                quantity: ci.quantity
            }));
        }

        // Validate items — always use server-side price, never trust frontend
        let total = 0;
        const orderItemsData = [];
        const errors = [];

        for (const item of orderItemsSource) {
            const productId = item.id || item.product_id;
            const qty = parseInt(item.quantity);

            const { data: product, error: pe } = await supabaseAdmin
                .from('products')
                .select('id, name, price, stock, is_active')
                .eq('id', productId)
                .single();

            if (pe || !product || !product.is_active) {
                errors.push(`A product is no longer available.`);
                continue;
            }
            if (qty > product.stock) {
                errors.push(`"${product.name}" only has ${product.stock} units left.`);
                continue;
            }
            const serverPrice = parseFloat(product.price);
            total += serverPrice * qty;
            orderItemsData.push({
                product_id: product.id,
                quantity: qty,
                price: serverPrice
            });
        }

        if (errors.length > 0) return res.status(400).json({ error: errors.join(' ') });
        if (orderItemsData.length === 0) return res.status(400).json({ error: 'No valid items in cart.' });

        // Create order
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: userId,
                status: 'pending',
                payment_status: 'unpaid',
                total_amount: total
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // Insert order items
        const itemsWithOrderId = orderItemsData.map(i => ({ ...i, order_id: order.id }));
        await supabaseAdmin.from('order_items').insert(itemsWithOrderId);

        // Deduct stock for each product
        for (const item of orderItemsData) {
            const { data: prod } = await supabaseAdmin
                .from('products')
                .select('stock')
                .eq('id', item.product_id)
                .single();

            if (prod) {
                const newStock = prod.stock - item.quantity;
                await supabaseAdmin
                    .from('products')
                    .update({ stock: Math.max(0, newStock) })
                    .eq('id', item.product_id);

                // Log inventory change
                await supabaseAdmin.from('inventory_logs').insert({
                    product_id: item.product_id,
                    change_amount: -item.quantity,
                    reason: `Order ${order.id.slice(0, 8)}`
                });
            }
        }

        // Clear server-side cart if it exists
        const { data: cart } = await supabaseAdmin
            .from('carts')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        if (cart) {
            await supabaseAdmin.from('cart_items').delete().eq('cart_id', cart.id);
        }

        res.status(201).json({ message: 'Order created successfully.', order });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ error: 'Failed to create order.' });
    }
};

// GET /api/orders/my
const getMyOrders = async (req, res) => {
    try {
        const { data: orders, error } = await supabaseAdmin
            .from('orders')
            .select(`*, order_items(*, products(id, name, image_url, price))`)
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
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
        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select(`*, order_items(*, products(id, name, image_url, price)), payments(*)`)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .single();

        if (error || !order) return res.status(404).json({ error: 'Order not found.' });
        res.json({ order });
    } catch (err) {
        console.error('Get order error:', err);
        res.status(500).json({ error: 'Failed to fetch order.' });
    }
};

module.exports = { createOrder, getMyOrders, getMyOrder };
