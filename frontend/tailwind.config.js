/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                brown: {
                    100: '#f5e8d5',
                    200: '#e8cfa8',
                    300: '#d4a97a',
                    400: '#c4956a',  // primary CTA
                    500: '#b07d50',
                    600: '#9a6840',
                    700: '#7a5030',
                    800: '#5c3820',
                    900: '#3d2010',
                },
                cream: {
                    50: '#fdfaf5',
                    100: '#fdf8f0',
                    200: '#faecd8',
                    300: '#f5e0c0',
                    400: '#eecda0',
                    500: '#e8bb80',
                },
                rose: {
                    100: '#fde8e8',
                    200: '#fad5d5',
                    300: '#f5aaaa',
                    400: '#e87878',
                    500: '#d85050',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['"Playfair Display"', 'Georgia', 'serif'],
            },
            boxShadow: {
                'warm': '0 4px 20px -2px rgba(120,60,20,0.10), 0 2px 8px -1px rgba(120,60,20,0.06)',
                'warm-lg': '0 12px 40px -4px rgba(120,60,20,0.18), 0 6px 16px -2px rgba(120,60,20,0.10)',
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
                '4xl': '2rem',
            }
        },
    },
    plugins: [],
}
