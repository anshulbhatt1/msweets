import { useEffect, useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import api from '../../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminDashboard() {
    const [summary, setSummary] = useState(null)
    const [topProds, setTopProds] = useState([])
    const [lowStock, setLowStock] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get('/admin/reports/sales-summary'),
            api.get('/admin/reports/top-products'),
            api.get('/admin/reports/low-stock?threshold=15')
        ])
            .then(([s, t, l]) => {
                setSummary(s.data)
                setTopProds(t.data.topProducts || [])
                setLowStock(l.data.lowStockProducts || [])
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="flex min-h-screen bg-cream-50">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto p-8">
                <div className="mb-8">
                    <h1 className="font-display text-3xl font-bold text-brown-800">Dashboard</h1>
                    <p className="text-brown-400 mt-1">Sweet Haven Analytics Overview</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {[
                        { icon: '💰', label: 'Revenue (30d)', value: loading ? '…' : `₹${summary?.totalRevenue?.toFixed(0) || 0}`, color: 'from-brown-300 to-brown-500' },
                        { icon: '📦', label: 'Orders (30d)', value: loading ? '…' : summary?.totalOrders || 0, color: 'from-blue-300 to-blue-500' },
                        { icon: '👥', label: 'Customers', value: loading ? '…' : summary?.totalCustomers || 0, color: 'from-rose-300 to-rose-500' },
                        { icon: '⚠️', label: 'Low Stock', value: loading ? '…' : lowStock.length, color: 'from-amber-300 to-amber-500' }
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-2xl p-5 shadow-warm">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl mb-3`}>
                                {s.icon}
                            </div>
                            <p className="font-display text-2xl font-bold text-brown-800">{s.value}</p>
                            <p className="text-brown-400 text-sm">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Revenue Chart */}
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white rounded-2xl p-6 shadow-warm">
                        <h2 className="font-semibold text-brown-800 mb-4">Revenue — Last 7 Days</h2>
                        {loading ? (
                            <div className="skeleton h-48" />
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={summary?.revenueByDay || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f5e0c0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9a6840' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#9a6840' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: '1px solid #eecda0', background: '#fff' }}
                                        formatter={v => [`₹${v}`, 'Revenue']}
                                    />
                                    <Bar dataKey="amount" fill="#b07d50" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Top Products */}
                    <div className="bg-white rounded-2xl p-6 shadow-warm">
                        <h2 className="font-semibold text-brown-800 mb-4">Top Selling Products</h2>
                        {loading ? (
                            <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton h-8" />)}</div>
                        ) : topProds.length === 0 ? (
                            <p className="text-brown-400 text-sm">No sales data yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {topProds.slice(0, 5).map((p, i) => (
                                    <div key={p.id} className="flex items-center gap-3">
                                        <span className="text-brown-300 font-bold text-sm w-5">{i + 1}</span>
                                        {p.image_url && <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-brown-700 truncate">{p.name}</p>
                                            <p className="text-xs text-brown-400">{p.total_quantity} sold</p>
                                        </div>
                                        <span className="text-sm font-bold text-brown-600">₹{p.total_revenue?.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                {lowStock.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                        <h2 className="font-semibold text-amber-700 mb-4 flex items-center gap-2">
                            <span>⚠️</span> Low Stock Alerts ({lowStock.length})
                        </h2>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {lowStock.map(p => (
                                <div key={p.id} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                                    <div>
                                        <p className="text-sm font-medium text-brown-700">{p.name}</p>
                                        <p className="text-xs text-brown-400">{p.categories?.name}</p>
                                    </div>
                                    <span className={`badge ${p.stock === 0 ? 'badge-red' : 'badge-yellow'} shrink-0`}>
                                        {p.stock === 0 ? 'Out' : `${p.stock} left`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
