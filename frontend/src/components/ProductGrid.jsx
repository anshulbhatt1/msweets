import ProductCard from './ProductCard'

export default function ProductGrid({ products, loading }) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-warm">
                        <div className="skeleton aspect-square" />
                        <div className="p-4 space-y-2">
                            <div className="skeleton h-4 w-3/4" />
                            <div className="skeleton h-3 w-full" />
                            <div className="skeleton h-3 w-1/2" />
                            <div className="skeleton h-8 w-full mt-2" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (!products || products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-6xl mb-4">🍰</div>
                <h3 className="text-xl font-semibold text-brown-700 mb-2">No products found</h3>
                <p className="text-brown-400 text-sm">Try a different search or category.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map(product => (
                <div key={product.id} className="animate-fade-in">
                    <ProductCard product={product} />
                </div>
            ))}
        </div>
    )
}
