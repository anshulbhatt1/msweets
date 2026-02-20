export default function RatingStars({ rating = 0, count, size = 'sm' }) {
    const stars = Math.round(parseFloat(rating))
    const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' }

    return (
        <div className="flex items-center gap-1">
            <div className={`flex ${sizes[size]}`}>
                {[1, 2, 3, 4, 5].map(i => (
                    <span key={i} className={i <= stars ? 'text-amber-400' : 'text-cream-200'}>★</span>
                ))}
            </div>
            {rating > 0 && <span className="text-brown-500 text-sm font-medium">{parseFloat(rating).toFixed(1)}</span>}
            {count !== undefined && <span className="text-brown-400 text-xs">({count})</span>}
        </div>
    )
}
