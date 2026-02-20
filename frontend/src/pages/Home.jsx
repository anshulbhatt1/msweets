import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import ProductGrid from '../components/ProductGrid'

const TESTIMONIALS = [
    { name: 'Priya S.', text: "The Kaju Katli melts in your mouth! Best I've ever had.", avatar: '👩' },
    { name: 'Rahul M.', text: "Ordered the chocolate truffle cake for my daughter's birthday. Absolutely stunning!", avatar: '👨' },
    { name: 'Anita K.', text: "Fast delivery, beautiful packaging, and incredibly fresh. 10/10!", avatar: '👩‍💼' },
]

export default function Home() {
    const [featured, setFeatured] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, catRes] = await Promise.all([
                    api.get('/products?limit=8'),
                    api.get('/products/categories')
                ])
                setFeatured(prodRes.data.products || [])
                setCategories(catRes.data.categories || [])
            } catch {
                // silently fail — show empty
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    return (
        <div>
            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className="relative min-h-[580px] flex items-center overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #fdf0e0 0%, #fae0d0 50%, #f5d0c0 100%)' }}>

                {/* Decorative circles */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-brown-300/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center py-20">
                    <div className="animate-fade-in">
                        <span className="badge badge-brown mb-4">✨ Handcrafted with Love</span>
                        <h1 className="font-display text-5xl sm:text-6xl font-bold text-brown-800 leading-tight mb-6">
                            Sweets that make<br />
                            <span className="text-brown-400">every moment</span><br />
                            special
                        </h1>
                        <p className="text-brown-500 text-lg leading-relaxed mb-8 max-w-md">
                            Premium chocolates, traditional mithais and freshly-baked cakes — crafted with pure ingredients and delivered fresh to your door.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/products" className="btn-primary text-base">
                                Shop Now →
                            </Link>
                            <Link to="/about" className="btn-secondary text-base">
                                Our Story
                            </Link>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-8 mt-10">
                            {[['500+', 'Products'], ['50K+', 'Happy Customers'], ['4.9★', 'Avg Rating']].map(([v, l]) => (
                                <div key={l}>
                                    <p className="font-display font-bold text-2xl text-brown-700">{v}</p>
                                    <p className="text-brown-400 text-sm">{l}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hero visual */}
                    <div className="hidden md:flex justify-center animate-fade-in">
                        <div className="relative">
                            <div className="w-80 h-80 bg-gradient-to-br from-brown-300 to-brown-500 rounded-full flex items-center justify-center text-9xl shadow-warm-lg">
                                🎂
                            </div>
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white rounded-2xl shadow-warm flex items-center justify-center text-4xl">🍫</div>
                            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white rounded-2xl shadow-warm flex items-center justify-center text-4xl">🍬</div>
                            <div className="absolute top-1/2 -right-10 w-16 h-16 bg-rose-100 rounded-xl shadow-warm flex items-center justify-center text-3xl">🧁</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Categories ────────────────────────────────────────── */}
            <section className="py-16 bg-cream-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="font-display text-3xl font-bold text-brown-800 mb-2">Shop by Category</h2>
                        <p className="text-brown-400">Find your perfect sweet treat</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {loading
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="skeleton h-36 rounded-2xl" />
                            ))
                            : categories.slice(0, 5).map(cat => (
                                <Link key={cat.id} to={`/products?category=${cat.id}`}
                                    className="group bg-white rounded-2xl p-6 text-center shadow-warm hover:shadow-warm-lg hover:-translate-y-1 transition-all duration-300">
                                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                                        {cat.image_url ? (
                                            <img src={cat.image_url} alt={cat.name} className="w-12 h-12 mx-auto object-contain" />
                                        ) : '🍰'}
                                    </div>
                                    <p className="font-semibold text-brown-700 text-sm">{cat.name}</p>
                                    <p className="text-brown-400 text-xs mt-1">Explore →</p>
                                </Link>
                            ))
                        }
                    </div>
                </div>
            </section>

            {/* ── Featured Products ─────────────────────────────────── */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h2 className="font-display text-3xl font-bold text-brown-800">Featured Sweets</h2>
                            <p className="text-brown-400 mt-1">Our most-loved creations</p>
                        </div>
                        <Link to="/products" className="btn-outline hidden sm:block">View All →</Link>
                    </div>
                    <ProductGrid products={featured} loading={loading} />
                    <div className="text-center mt-8 sm:hidden">
                        <Link to="/products" className="btn-primary">View All Products</Link>
                    </div>
                </div>
            </section>

            {/* ── Testimonials ─────────────────────────────────────── */}
            <section className="py-16" style={{ background: 'linear-gradient(135deg, #fdf0e0, #fae8d8)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="font-display text-3xl font-bold text-brown-800 mb-2">What Our Customers Say</h2>
                        <div className="flex justify-center gap-1 text-amber-400 text-xl">★★★★★</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TESTIMONIALS.map((t, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-warm animate-fade-in">
                                <div className="flex gap-1 text-amber-400 mb-4">★★★★★</div>
                                <p className="text-brown-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-cream-100 rounded-full flex items-center justify-center text-xl">{t.avatar}</div>
                                    <div>
                                        <p className="font-semibold text-brown-700 text-sm">{t.name}</p>
                                        <p className="text-brown-400 text-xs">Verified Customer</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────── */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="rounded-3xl overflow-hidden p-12 text-center text-white relative"
                        style={{ background: 'linear-gradient(135deg, #c4956a 0%, #b07d50 50%, #e8a0a0 100%)' }}>
                        <div className="absolute inset-0 opacity-10 text-9xl flex items-center justify-center pointer-events-none">🎂</div>
                        <h2 className="font-display text-4xl font-bold mb-4 relative">Ready to treat yourself?</h2>
                        <p className="text-white/80 text-lg mb-8 relative">Order now and enjoy fresh, handcrafted sweets delivered to your door.</p>
                        <Link to="/products" className="inline-block bg-white text-brown-700 font-bold px-10 py-4 rounded-full hover:bg-cream-50 transition-colors shadow-warm-lg">
                            Start Shopping →
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
