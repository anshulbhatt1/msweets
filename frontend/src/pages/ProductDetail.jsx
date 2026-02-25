import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../context/CartContext'
import RatingStars from '../components/RatingStars'
import QuantityStepper from '../components/QuantityStepper'

const FALLBACK = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80'

export default function ProductDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { addItem } = useCart()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [qty, setQty] = useState(1)
    const [toast, setToast] = useState('')

    useEffect(() => {
        api.get(`/products/${id}`)
            .then(r => setProduct(r.data.product))
            .catch(() => navigate('/products', { replace: true }))
            .finally(() => setLoading(false))
    }, [id, navigate])

    const handleAdd = () => {
        addItem(product, qty)
        setToast(`Added ${qty} × ${product.name} to cart!`)
        setTimeout(() => setToast(''), 3000)
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-10">
                <div className="skeleton aspect-square rounded-3xl" />
                <div className="space-y-4">
                    <div className="skeleton h-8 w-3/4" />
                    <div className="skeleton h-4 w-1/2" />
                    <div className="skeleton h-20 w-full" />
                    <div className="skeleton h-12 w-1/3" />
                </div>
            </div>
        )
    }

    if (!product) return null

    const isOutOfStock = product.stock === 0

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Toast */}
            {toast && (
                <div className="fixed top-20 right-6 z-50 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-warm-lg animate-fade-in flex items-center gap-2">
                    <span>✓</span> {toast}
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-12 items-start">
                {/* Image */}
                <div className="rounded-3xl overflow-hidden shadow-warm-lg aspect-square bg-cream-100">
                    <img
                        src={product.image_url || FALLBACK}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.src = FALLBACK }}
                    />
                </div>

                {/* Info */}
                <div className="animate-fade-in">
                    {product.categories?.name && (
                        <span className="badge badge-brown mb-3">{product.categories.name}</span>
                    )}
                    <h1 className="font-display text-4xl font-bold text-brown-800 mb-3">{product.name}</h1>

                    <RatingStars rating={product.rating} size="md" />

                    <div className="flex items-baseline gap-3 mt-4 mb-6">
                        <span className="font-display text-4xl font-bold text-brown-700">
                            ₹{parseFloat(product.price).toFixed(0)}
                        </span>
                    </div>

                    <p className="text-brown-500 leading-relaxed mb-6">{product.description}</p>

                    {/* Stock */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? 'bg-red-400' : 'bg-green-400'}`} />
                        <span className={`text-sm font-medium ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                            {isOutOfStock ? 'Out of Stock' : `In Stock (${product.stock} left)`}
                        </span>
                    </div>

                    {/* Qty + Add */}
                    {!isOutOfStock && (
                        <div className="flex items-center gap-4 mb-8">
                            <QuantityStepper value={qty} onChange={setQty} min={1} max={product.stock} />
                            <button onClick={handleAdd} className="btn-primary flex-1">
                                🛒 Add to Cart
                            </button>
                        </div>
                    )}

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-3">
                        {[['🚚', 'Free delivery', 'Over ₹500'], ['✨', 'Pure', 'No preservatives'], ['📦', 'Gift ready', 'Beautiful packaging']].map(([icon, title, sub]) => (
                            <div key={title} className="bg-cream-50 rounded-2xl p-4 text-center">
                                <div className="text-2xl mb-1">{icon}</div>
                                <p className="text-xs font-semibold text-brown-700">{title}</p>
                                <p className="text-xs text-brown-400">{sub}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
