import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import ProductGrid from '../components/ProductGrid'
import CategoryFilter from '../components/CategoryFilter'
import SearchBar from '../components/SearchBar'

export default function Products() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({})

    const selectedCat = searchParams.get('category') || null
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')

    const fetchProducts = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page, limit: 12 })
            if (selectedCat) params.set('category', selectedCat)
            if (search) params.set('search', search)

            const res = await api.get(`/products?${params}`)
            setProducts(res.data.products || [])
            setPagination(res.data.pagination || {})
        } catch {
            setProducts([])
        } finally {
            setLoading(false)
        }
    }, [selectedCat, search, page])

    useEffect(() => {
        api.get('/products/categories')
            .then(r => setCategories(r.data.categories || []))
            .catch(() => { })
    }, [])

    useEffect(() => { fetchProducts() }, [fetchProducts])

    const setParam = (key, value) => {
        const p = new URLSearchParams(searchParams)
        if (value) p.set(key, value)
        else p.delete(key)
        p.delete('page') // reset page on filter change
        setSearchParams(p)
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-display text-4xl font-bold text-brown-800">Our Products</h1>
                <p className="text-brown-400 mt-1">
                    Browse our <span className="text-brown-500 font-medium">delicious collection</span> of sweets and treats
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1">
                    <SearchBar value={search} onChange={v => setParam('search', v)} />
                </div>
            </div>

            <div className="mb-6">
                <CategoryFilter
                    categories={categories}
                    selected={selectedCat}
                    onSelect={id => setParam('category', id)}
                />
            </div>

            {/* Results info */}
            {!loading && pagination.total > 0 && (
                <p className="text-brown-400 text-sm mb-4">
                    Showing {products.length} of {pagination.total} products
                </p>
            )}

            <ProductGrid products={products} loading={loading} />

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                        <button key={p}
                            onClick={() => setParam('page', p)}
                            className={`w-10 h-10 rounded-full text-sm font-medium transition-all
                ${p === page ? 'bg-brown-400 text-white shadow-warm' : 'bg-white border border-cream-200 text-brown-600 hover:bg-cream-100'}`}>
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
