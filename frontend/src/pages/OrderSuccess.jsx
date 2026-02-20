import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered']

export default function OrderSuccess() {
    const { id } = useParams()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get(`/orders/my/${id}`)
            .then(r => setOrder(r.data.order))
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-brown-300 border-t-brown-600 rounded-full animate-spin" />
            </div>
        )
    }

    const stepIndex = order ? STATUS_STEPS.indexOf(order.status) : 0

    return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            {/* Success icon */}
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 animate-fade-in">
                🎉
            </div>
            <h1 className="font-display text-4xl font-bold text-brown-800 mb-3">Order Placed!</h1>
            <p className="text-brown-400 mb-2">Thank you for your order. We'll deliver your sweets soon! 🍰</p>
            {order && <p className="text-brown-500 text-sm font-medium mb-8">Order ID: <span className="font-mono text-xs bg-cream-100 px-2 py-1 rounded">{order.id.slice(0, 8).toUpperCase()}</span></p>}

            {/* Progress tracker */}
            {order && (
                <div className="card mb-8 text-left">
                    <h2 className="font-semibold text-brown-800 mb-5">Order Status</h2>
                    <div className="flex items-center justify-between relative">
                        <div className="absolute top-4 left-4 right-4 h-0.5 bg-cream-200 z-0" />
                        <div
                            className="absolute top-4 left-4 h-0.5 bg-brown-400 z-0 transition-all duration-500"
                            style={{ width: `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                        />
                        {STATUS_STEPS.map((step, i) => (
                            <div key={step} className="flex flex-col items-center z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                  ${i <= stepIndex ? 'bg-brown-400 border-brown-400 text-white' : 'bg-white border-cream-200 text-brown-300'}`}>
                                    {i < stepIndex ? '✓' : i + 1}
                                </div>
                                <span className={`text-xs mt-2 capitalize ${i <= stepIndex ? 'text-brown-600 font-medium' : 'text-brown-300'}`}>
                                    {step}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Order items */}
            {order?.order_items?.length > 0 && (
                <div className="card mb-8 text-left">
                    <h2 className="font-semibold text-brown-800 mb-4">Items Ordered</h2>
                    <div className="space-y-3">
                        {order.order_items.map(item => (
                            <div key={item.id} className="flex items-center justify-between text-sm text-brown-600">
                                <div className="flex items-center gap-3">
                                    {item.products?.image_url && (
                                        <img src={item.products.image_url} alt={item.products.name}
                                            className="w-10 h-10 rounded-lg object-cover" />
                                    )}
                                    <span>{item.products?.name || 'Product'} × {item.quantity}</span>
                                </div>
                                <span className="font-medium">₹{(parseFloat(item.price) * item.quantity).toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                    <hr className="border-cream-200 my-3" />
                    <div className="flex justify-between font-bold text-brown-800">
                        <span>Total Paid</span>
                        <span>₹{parseFloat(order.total_amount).toFixed(0)}</span>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/my-orders" className="btn-primary">View All Orders</Link>
                <Link to="/products" className="btn-secondary">Continue Shopping</Link>
            </div>
        </div>
    )
}
