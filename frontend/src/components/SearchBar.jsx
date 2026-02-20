export default function SearchBar({ value, onChange, placeholder = 'Search sweets…' }) {
    return (
        <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-300"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="input pl-12 pr-4"
            />
            {value && (
                <button onClick={() => onChange('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brown-300 hover:text-brown-600 transition-colors">
                    ✕
                </button>
            )}
        </div>
    )
}
