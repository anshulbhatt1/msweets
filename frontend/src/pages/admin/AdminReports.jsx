import { useEffect, useState } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import api from '../../services/api'
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

const COLORS = ['#b07d50', '#e8a0a0', '#8cb4d5', '#a8d5a2', '#f5c56a']

export default function AdminReports() {
    const [summary, setSummary] = useState(null)
    const [topProds, setTopProds] = useState([])
    const [lowStock, setLowStock] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            api.get('/admin/reports/sales-summary'),
            api.get('/admin/reports/top-products?limit=10'),
            api.get('/admin/reports/low-stock?threshold=20')
        ])
            .then(([s, t, l]) => {
                setSummary(s.data)
                setTopProds(t.data.topProducts || [])
                setLowStock(l.data.lowStockProducts || [])
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [])

    const pieData = topProds.slice(0, 5).map(p => ({
        name: p.name,
        value: parseFloat(p.total_revenue || 0)
    }))

    return (
        <div className="flex min-h-screen bg-cream-50">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto p-8">
                <div className="mb-8">
                    <h1 className="font-display text-3xl font-bold text-brown-800">Reports & Analytics</h1>
                    <p className="text-brown-400 mt-1">Business performance overview</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {[
                        { label: 'Total Revenue', value: loading ? '…' : `₹${(summary?.totalRevenue || 0).toFixed(0)}`, icon: '💰', change: '+12%' },
                        { label: 'Total Orders', value: loading ? '…' : summary?.totalOrders || 0, icon: '📦', change: '+8%' },
                        { label: 'Avg Order Value', value: loading ? '…' : `₹${(summary?.avgOrderValue || 0).toFixed(0)}`, icon: '📊', change: '+3%' },
                        { label: 'Revenue 7d', value: loading ? '…' : `₹${(summary?.revenueByDay || []).reduce((s, d) => s + parseFloat(d.amount || 0), 0).toFixed(0)}`, icon: '📅', change: '' }
                    ].map(k => (
                        <div key={k.label} className="bg-white rounded-2xl p-5 shadow-warm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl">{k.icon}</span>
                                {k.change && <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">{k.change}</span>}
                            </div>
                            <p className="font-display text-2xl font-bold text-brown-800">{k.value}</p>
                            <p className="text-brown-400 text-sm">{k.label}</p>
                        </div>
                    ))}
                </div>

                {/* Charts row */}
                <div className="grid lg:grid-cols-2 gap-6 mb-6">
                    {/* Revenue over 7 days */}
                    <div className="bg-white rounded-2xl p-6 shadow-warm">
                        <h2 className="font-semibold text-brown-800 mb-4">Daily Revenue (Last 7 Days)</h2>
                        {loading ? <div className="skeleton h-56" /> : (
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={summary?.revenueByDay || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f5e0c0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9a6840' }} />
                                    <YAxis tick={{ fontSize: 11, fill: '#9a6840' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 12, border: '1px solid #eecda0' }}
                                        formatter={v => [`₹${v}`, 'Revenue']}
                                    />
                                    <Line type="monotone" dataKey="amount" stroke="#b07d50" strokeWidth={2.5} dot={{ r: 4, fill: '#b07d50' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Revenue by product pie */}
                    <div className="bg-white rounded-2xl p-6 shadow-warm">
                        <h2 className="font-semibold text-brown-800 mb-4">Revenue Share — Top 5 Products</h2>
                        {loading ? <div className="skeleton h-56" /> : pieData.length === 0 ? (
                            <div className="flex items-center justify-center h-56 text-brown-400">No data yet</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name.slice(0, 10)} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={v => [`₹${v.toFixed(0)}`, 'Revenue']} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Top Products table */}
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-warm">
                        <h2 className="font-semibold text-brown-800 mb-4">Top Selling Products</h2>
                        {loading ? <div className="skeleton h-48" /> : topProds.length === 0 ? (
                            <p className="text-brown-400 text-sm">No sales data yet.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={topProds.slice(0, 6)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f5e0c0" />
                                    <XAxis type="number" tick={{ fontSize: 10, fill: '#9a6840' }} />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: '#9a6840' }} />
                                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #eecda0' }} />
                                    <Bar dataKey="total_quantity" fill="#b07d50" radius={[0, 6, 6, 0]} name="Units Sold" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Low stock */}
                    <div className="bg-white rounded-2xl p-6 shadow-warm">
                        <h2 className="font-semibold text-brown-800 mb-4">Low Stock Alert</h2>
                        {loading ? <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="skeleton h-10" />)}</div> : lowStock.length === 0 ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <span>✅</span>
                                <span className="text-sm">All products have sufficient stock!</span>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {lowStock.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                                        <div>
                                            <p className="text-sm font-medium text-brown-700">{p.name}</p>
                                            <p className="text-xs text-brown-400">{p.categories?.name}</p>
                                        </div>
                                        <span className={`badge ${p.stock === 0 ? 'badge-red' : 'badge-yellow'}`}>
                                            {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
