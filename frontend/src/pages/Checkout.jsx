import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Checkout() {
    const { items, totalAmount, clearCart } = useCart()
    const { user } = useAuth()
    const navigate = useNavigate()

    const DELIVERY_FEE = totalAmount >= 500 ? 0 : 50
    const grandTotal = totalAmount + DELIVERY_FEE

    const [form, setForm] = useState({
        full_name: user?.full_name || '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handlePlaceOrder = async e => {
        e.preventDefault()
        setError('')

        if (items.length === 0) { setError('Your cart is empty.'); return }

        const { full_name, phone, address, city, state, pincode } = form
        if (!full_name || !phone || !address || !city || !state || !pincode) {
            setError('Please fill all required fields.')
            return
        }

        setLoading(true)
        try {
            // 1. Create order on backend (validates stock + price server-side)
            const fullAddress = `${full_name}, ${address}, ${city}, ${state} - ${pincode}, Phone: ${phone}`
            const orderRes = await api.post('/orders/create', {
                address: fullAddress,
                items: items.map(i => ({ id: i.id, quantity: i.quantity })),
                delivery_fee: DELIVERY_FEE
            })
            const order = orderRes.data.order

            // 2. Create Razorpay order
            const payRes = await api.post('/payments/create-razorpay-order', { order_id: order.id })

            // 3. Open Razorpay modal
            const options = {
                key: payRes.data.key_id,
                amount: payRes.data.amount,
                currency: 'INR',
                order_id: payRes.data.razorpay_order_id,
                name: 'Manoj Sweets',
                description: 'Order Payment',
                prefill: { name: full_name, contact: phone, email: user?.email },
                theme: { color: '#b07d50' },
                handler: async (response) => {
                    try {
                        // 4. Verify payment on backend
                        await api.post('/payments/verify', {
                            order_id: order.id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                        clearCart()
                        navigate(`/order-success/${order.id}`)
                    } catch (err) {
                        setError(err.response?.data?.error || 'Payment verification failed.')
                        setLoading(false)
                    }
                },
                modal: { ondismiss: () => setLoading(false) }
            }

            if (!window.Razorpay) {
                // Load Razorpay script dynamically
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script')
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
                    script.onload = resolve
                    script.onerror = reject
                    document.body.appendChild(script)
                })
            }

            const rzp = new window.Razorpay(options)
            rzp.on('payment.failed', () => {
                setError('Payment failed. Please try again.')
                setLoading(false)
            })
            rzp.open()
        } catch (err) {
            setError(err.response?.data?.error || 'Order placement failed. Please try again.')
            setLoading(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="font-display text-3xl font-bold text-brown-800 mb-8">Checkout</h1>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-2">
                    <div className="card">
                        <h2 className="font-semibold text-brown-800 text-lg mb-5 flex items-center gap-2">
                            <span className="w-7 h-7 bg-brown-400 text-white rounded-full flex items-center justify-center text-sm">1</span>
                            Delivery Details
                        </h2>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>
                        )}

                        <form onSubmit={handlePlaceOrder} className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-brown-700 mb-1.5">Full Name *</label>
                                    <input name="full_name" required value={form.full_name} onChange={handleChange} className="input" placeholder="Priya Sharma" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brown-700 mb-1.5">Phone *</label>
                                    <input name="phone" required value={form.phone} onChange={handleChange} className="input" placeholder="+91 98765 43210" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brown-700 mb-1.5">Street Address *</label>
                                <input name="address" required value={form.address} onChange={handleChange} className="input" placeholder="House No., Street, Locality" />
                            </div>
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-brown-700 mb-1.5">City *</label>
                                    <input name="city" required value={form.city} onChange={handleChange} className="input" placeholder="Mumbai" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brown-700 mb-1.5">State *</label>
                                    <input name="state" required value={form.state} onChange={handleChange} className="input" placeholder="Maharashtra" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-brown-700 mb-1.5">Pincode *</label>
                                    <input name="pincode" required value={form.pincode} onChange={handleChange} className="input" placeholder="400001" />
                                </div>
                            </div>

                            <div className="pt-4">
                                <div className="bg-cream-50 rounded-2xl p-4 mb-4 flex items-center gap-3">
                                    <span className="text-2xl">💳</span>
                                    <div>
                                        <p className="font-medium text-brown-700 text-sm">Payment via Razorpay</p>
                                        <p className="text-brown-400 text-xs">UPI, Cards, Net Banking, Wallets</p>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="btn-primary w-full text-base disabled:opacity-60">
                                    {loading ? 'Processing…' : `Pay ₹${grandTotal.toFixed(0)}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="card h-fit sticky top-24">
                    <h2 className="font-semibold text-brown-800 text-lg mb-4">Order Summary</h2>
                    <div className="space-y-3 mb-4">
                        {items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm text-brown-600">
                                <span className="truncate mr-2">{item.name} × {item.quantity}</span>
                                <span className="shrink-0 font-medium">₹{(parseFloat(item.price) * item.quantity).toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                    <hr className="border-cream-200 my-3" />
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-brown-600">
                            <span>Subtotal</span>
                            <span>₹{totalAmount.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between text-brown-600">
                            <span>Delivery</span>
                            <span className={DELIVERY_FEE === 0 ? 'text-green-600 font-medium' : ''}>
                                {DELIVERY_FEE === 0 ? 'FREE' : `₹${DELIVERY_FEE}`}
                            </span>
                        </div>
                    </div>
                    <hr className="border-cream-200 my-3" />
                    <div className="flex justify-between font-bold text-brown-800 text-lg">
                        <span>Total</span>
                        <span className="text-brown-500">₹{grandTotal.toFixed(0)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
