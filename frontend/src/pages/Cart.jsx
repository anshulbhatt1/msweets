import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import QuantityStepper from '../components/QuantityStepper'

const FALLBACK = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200&q=80'
const DELIVERY_FEE = 50
const FREE_DELIVERY_THRESHOLD = 500

export default function Cart() {
    const { items, updateItem, removeItem, clearCart, totalAmount, isEmpty } = useCart()
    const navigate = useNavigate()

    const deliveryFee = totalAmount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
    const grandTotal = totalAmount + deliveryFee

    if (isEmpty) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-24 text-center">
                <div className="text-7xl mb-6">🛒</div>
                <h2 className="font-display text-3xl font-bold text-brown-800 mb-3">Your cart is empty</h2>
                <p className="text-brown-400 mb-8">Looks like you haven't added anything yet.</p>
                <Link to="/products" className="btn-primary">Browse Products</Link>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="font-display text-3xl font-bold text-brown-800">Shopping Cart</h1>
                <button onClick={clearCart} className="text-sm text-red-400 hover:text-red-600 transition-colors">
                    Clear All
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl p-5 shadow-warm flex gap-4 animate-fade-in">
                            <img
                                src={item.image_url || FALLBACK}
                                alt={item.name}
                                className="w-24 h-24 rounded-xl object-cover shrink-0"
                                onError={e => { e.target.src = FALLBACK }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold text-brown-800 leading-tight">{item.name}</h3>
                                        {item.categories?.name && (
                                            <span className="text-xs text-brown-400">{item.categories.name}</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-rose-300 hover:text-rose-500 transition-colors shrink-0 p-1"
                                        aria-label="Remove"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <QuantityStepper
                                        value={item.quantity}
                                        onChange={qty => updateItem(item.id, qty)}
                                        min={1}
                                        max={item.stock || 99}
                                    />
                                    <span className="font-bold text-brown-700 text-lg">
                                        ₹{(parseFloat(item.price) * item.quantity).toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl p-6 shadow-warm sticky top-24">
                        <h2 className="font-display text-xl font-bold text-brown-800 mb-5">Order Summary</h2>

                        <div className="space-y-3 mb-5">
                            <div className="flex justify-between text-sm text-brown-600">
                                <span>Subtotal ({items.length} items)</span>
                                <span>₹{totalAmount.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-brown-600">
                                <span>Delivery</span>
                                <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                                </span>
                            </div>
                            {deliveryFee > 0 && (
                                <p className="text-xs text-brown-400">
                                    Add ₹{(FREE_DELIVERY_THRESHOLD - totalAmount).toFixed(0)} more for free delivery
                                </p>
                            )}
                        </div>

                        <div className="border-t border-cream-200 pt-4 mb-6">
                            <div className="flex justify-between font-bold text-brown-800 text-lg">
                                <span>Total</span>
                                <span className="text-brown-500">₹{grandTotal.toFixed(0)}</span>
                            </div>
                        </div>

                        <button onClick={() => navigate('/checkout')} className="btn-primary w-full text-center mb-3">
                            Proceed to Checkout
                        </button>
                        <Link to="/products" className="block text-center text-sm text-brown-400 hover:text-brown-600 transition-colors">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
