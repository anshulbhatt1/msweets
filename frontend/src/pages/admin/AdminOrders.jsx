import { useEffect, useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import api from '../../services/api'

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled']

const STATUS_COLOR = {
    pending: 'badge-yellow',
    confirmed: 'badge-blue',
    preparing: 'badge-blue',
    shipped: 'badge-brown',
    delivered: 'badge-green',
    cancelled: 'badge-red'
}

export default function AdminOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [toast, setToast] = useState('')
    const [expanded, setExpanded] = useState(null)

    const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 3000) }

    const load = async () => {
        setLoading(true)
        try {
            const url = filter ? `/admin/orders?status=${filter}` : '/admin/orders'
            const res = await api.get(url)
            setOrders(res.data.orders || [])
        } catch { }
        setLoading(false)
    }

    useEffect(() => { load() }, [filter])

    const updateStatus = async (orderId, status) => {
        try {
            await api.put(`/admin/orders/${orderId}/status`, { status })
            showToast(`Order status updated to "${status}"`)
            load()
        } catch (err) {
            showToast(err.response?.data?.error || 'Update failed.')
        }
    }

    return (
        <div className="flex min-h-screen bg-cream-50">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto p-8">

                {toast && (
                    <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-warm-lg animate-fade-in">
                        ✓ {toast}
                    </div>
                )}

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-brown-800">Orders</h1>
                        <p className="text-brown-400 mt-1">{orders.length} orders</p>
                    </div>
                    {/* Filter */}
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setFilter('')}
                            className={`btn-outline text-sm ${!filter ? 'bg-brown-400 text-white border-brown-400' : ''}`}>All</button>
                        {STATUS_OPTIONS.map(s => (
                            <button key={s} onClick={() => setFilter(s)}
                                className={`btn-outline text-sm capitalize ${filter === s ? 'bg-brown-400 text-white border-brown-400' : ''}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">📦</div>
                        <p className="text-brown-400">No orders found.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map(order => (
                            <div key={order.id} className="bg-white rounded-2xl shadow-warm overflow-hidden">
                                {/* Header row */}
                                <div className="flex flex-wrap items-center gap-4 px-5 py-4 cursor-pointer hover:bg-cream-50 transition-colors"
                                    onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-mono text-xs text-brown-400">#{order.id.slice(0, 8).toUpperCase()}</p>
                                        <p className="font-medium text-brown-800 text-sm mt-0.5">
                                            {order.user_profiles?.full_name || 'Customer'} &nbsp;·&nbsp;
                                            <span className="text-brown-400 font-normal">{order.user_profiles?.email}</span>
                                        </p>
                                        <p className="text-xs text-brown-400">
                                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`badge ${STATUS_COLOR[order.status] || 'badge-brown'} capitalize`}>
                                            {order.status}
                                        </span>
                                        <span className={`badge ${order.payment_status === 'paid' ? 'badge-green' : 'badge-yellow'}`}>
                                            {order.payment_status}
                                        </span>
                                        <span className="font-bold text-brown-700">₹{parseFloat(order.total_amount).toFixed(0)}</span>
                                        <span className="text-brown-300 text-sm">{expanded === order.id ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {/* Expanded details */}
                                {expanded === order.id && (
                                    <div className="border-t border-cream-100 px-5 py-4 bg-cream-50 animate-fade-in">
                                        {/* Items */}
                                        {order.order_items?.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-xs font-semibold text-brown-500 uppercase mb-2">Items</p>
                                                <div className="space-y-1">
                                                    {order.order_items.map(item => (
                                                        <div key={item.id} className="flex justify-between text-sm text-brown-600">
                                                            <span>{item.products?.name || 'Item'} × {item.quantity}</span>
                                                            <span className="font-medium">₹{(parseFloat(item.price) * item.quantity).toFixed(0)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Shipping address */}
                                        {order.shipping_address && (
                                            <div className="mb-4">
                                                <p className="text-xs font-semibold text-brown-500 uppercase mb-1">Shipping Address</p>
                                                <p className="text-sm text-brown-600">
                                                    {order.shipping_address.full_name}, {order.shipping_address.address}, {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                                                </p>
                                            </div>
                                        )}

                                        {/* Status Updater */}
                                        <div>
                                            <p className="text-xs font-semibold text-brown-500 uppercase mb-2">Update Status</p>
                                            <div className="flex flex-wrap gap-2">
                                                {STATUS_OPTIONS.map(s => (
                                                    <button key={s} onClick={() => updateStatus(order.id, s)}
                                                        disabled={order.status === s}
                                                        className={`btn-outline text-xs capitalize ${order.status === s ? 'bg-brown-400 text-white border-brown-400 cursor-default' : ''}`}>
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
