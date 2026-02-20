export default function CategoryFilter({ categories, selected, onSelect }) {
    return (
        <div className="flex flex-wrap gap-2">
            <button
                onClick={() => onSelect(null)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
          ${!selected ? 'bg-brown-400 text-white shadow-warm' : 'bg-white text-brown-600 border border-cream-200 hover:bg-cream-100'}`}
            >
                All
            </button>
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => onSelect(cat.id)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
            ${selected === cat.id ? 'bg-brown-400 text-white shadow-warm' : 'bg-white text-brown-600 border border-cream-200 hover:bg-cream-100'}`}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    )
}
