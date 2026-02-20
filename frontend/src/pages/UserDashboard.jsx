import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function UserDashboard() {
    const { user } = useAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/orders/my')
            .then(r => setOrders((r.data.orders || []).slice(0, 3)))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const totalSpent = orders.reduce((s, o) => s + parseFloat(o.total_amount), 0)

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-brown-300 to-brown-500 rounded-full flex items-center justify-center text-3xl text-white shadow-warm">
                    {user?.full_name?.charAt(0) || '👤'}
                </div>
                <div>
                    <h1 className="font-display text-3xl font-bold text-brown-800">
                        Hello, {user?.full_name?.split(' ')[0] || 'there'}! 👋
                    </h1>
                    <p className="text-brown-400">{user?.email}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
                {[
                    { icon: '📦', label: 'Total Orders', value: orders.length },
                    { icon: '💰', label: 'Total Spent', value: `₹${totalSpent.toFixed(0)}` },
                    { icon: '⭐', label: 'Reward Points', value: Math.floor(totalSpent / 10) },
                ].map(s => (
                    <div key={s.label} className="card text-center">
                        <div className="text-3xl mb-2">{s.icon}</div>
                        <p className="font-display text-2xl font-bold text-brown-700">{s.value}</p>
                        <p className="text-brown-400 text-sm">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Links */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
                {[
                    { to: '/my-orders', icon: '🧾', title: 'My Orders', desc: 'Track your delivery' },
                    { to: '/products', icon: '🍫', title: 'Shop Now', desc: 'Explore our sweets' },
                    { to: '/contact', icon: '💬', title: 'Support', desc: 'Get help anytime' }
                ].map(l => (
                    <Link key={l.to} to={l.to}
                        className="card hover:shadow-warm-lg transition-all hover:-translate-y-1 group text-center">
                        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{l.icon}</div>
                        <p className="font-semibold text-brown-700">{l.title}</p>
                        <p className="text-brown-400 text-sm">{l.desc}</p>
                    </Link>
                ))}
            </div>

            {/* Recent Orders */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-xl font-bold text-brown-800">Recent Orders</h2>
                    <Link to="/my-orders" className="text-sm text-brown-400 hover:text-brown-600 transition-colors">View all →</Link>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="card text-center py-10">
                        <p className="text-brown-400">No orders yet. <Link to="/products" className="text-brown-600 font-medium hover:underline">Browse products →</Link></p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map(order => (
                            <div key={order.id} className="card flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-brown-700 text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                                    <p className="text-xs text-brown-400">{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="text-center">
                                    <span className="badge badge-brown capitalize">{order.status}</span>
                                </div>
                                <span className="font-bold text-brown-600">₹{parseFloat(order.total_amount).toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
