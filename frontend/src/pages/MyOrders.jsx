import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const STATUS_COLOR = {
    pending: 'badge-yellow',
    confirmed: 'badge-blue',
    preparing: 'badge-blue',
    shipped: 'badge-brown',
    delivered: 'badge-green',
    cancelled: 'badge-red'
}

export default function MyOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/orders/my')
            .then(r => setOrders(r.data.orders || []))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
                <div className="skeleton h-8 w-48" />
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="font-display text-3xl font-bold text-brown-800 mb-8">My Orders</h1>

            {orders.length === 0 ? (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">📦</div>
                    <h2 className="font-display text-2xl font-bold text-brown-700 mb-2">No orders yet</h2>
                    <p className="text-brown-400 mb-6">Your order history will appear here.</p>
                    <Link to="/products" className="btn-primary">Start Shopping</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="card hover:shadow-warm-lg transition-shadow animate-fade-in">
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                <div>
                                    <p className="text-xs text-brown-400 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                                    <p className="text-sm text-brown-500 mt-0.5">
                                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${STATUS_COLOR[order.status] || 'badge-brown'} capitalize`}>
                                        {order.status}
                                    </span>
                                    <span className={`badge ${order.payment_status === 'paid' ? 'badge-green' : 'badge-red'}`}>
                                        {order.payment_status}
                                    </span>
                                </div>
                            </div>

                            {/* Items */}
                            {order.order_items?.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {order.order_items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-cream-50 rounded-xl px-3 py-1.5 text-sm text-brown-600">
                                            {item.products?.image_url && (
                                                <img src={item.products.image_url} alt="" className="w-6 h-6 rounded object-cover" />
                                            )}
                                            <span>{item.products?.name || 'Item'} × {item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="font-bold text-brown-700 text-lg">₹{parseFloat(order.total_amount).toFixed(0)}</span>
                                <Link to={`/order-success/${order.id}`} className="btn-outline text-sm">
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
