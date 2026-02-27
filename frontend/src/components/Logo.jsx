/**
 * Manoj Sweets logo — combined MS monogram with hover-to-round effect
 * Hover: badge morphs to circle, scales up, no click needed
 */
export default function Logo({ size = 'md', variant = 'light', className = '' }) {
    const sizes = {
        sm: { w: 36, h: 36 },
        md: { w: 40, h: 40 },
        lg: { w: 56, h: 56 },
    }
    const { w, h } = sizes[size]
    const isDark = variant === 'dark'

    return (
        <div
            className={`inline-flex items-center justify-center shrink-0 overflow-hidden rounded-2xl transition-all duration-300 ease-out hover:rounded-full hover:scale-110 hover:shadow-warm-lg ${className}`}
            role="img"
            aria-label="Manoj Sweets"
            style={{ width: w, height: h }}
        >
            <svg
                width={w}
                height={h}
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="pointer-events-none"
            >
                <defs>
                    <linearGradient id="logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={isDark ? '#9a6840' : '#d4a97a'} />
                        <stop offset="100%" stopColor={isDark ? '#7a5030' : '#b07d50'} />
                    </linearGradient>
                    <linearGradient id="logo-text" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fdfaf5" />
                        <stop offset="100%" stopColor="#f5e8d5" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#logo-bg)" />
                {/* Combined MS monogram — M (custom path) + S (text) */}
                <path d="M10 34V14h4l4 10 4-10h4v20h-4V22l-4 8-4-8v12h-4Z" fill="url(#logo-text)" />
                <text x="28" y="32" textAnchor="start" fill="url(#logo-text)" fontFamily="Playfair Display, Georgia, serif" fontWeight="700" fontSize="22" letterSpacing="-2">S</text>
            </svg>
        </div>
    )
}
