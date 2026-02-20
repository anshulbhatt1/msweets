export default function QuantityStepper({ value, onChange, min = 1, max = 99 }) {
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={value <= min}
                className="w-8 h-8 rounded-full border border-cream-200 flex items-center justify-center 
                   text-brown-600 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                –
            </button>
            <span className="w-8 text-center font-semibold text-brown-800">{value}</span>
            <button
                onClick={() => onChange(Math.min(max, value + 1))}
                disabled={value >= max}
                className="w-8 h-8 rounded-full border border-cream-200 flex items-center justify-center 
                   text-brown-600 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                +
            </button>
        </div>
    )
}
