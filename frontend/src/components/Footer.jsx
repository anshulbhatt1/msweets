import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Footer() {
    return (
        <footer className="bg-brown-800 text-cream-100 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <Logo size="md" variant="dark" />
                            <span className="font-display font-bold text-2xl text-white">Manoj Sweets</span>
                        </div>
                        <p className="text-cream-200 text-sm leading-relaxed max-w-xs">
                            Handcrafted sweets, chocolates and cakes made with pure ingredients and lots of love. Delivered fresh to your doorstep.
                        </p>
                        <div className="flex gap-3 mt-5">
                            {['📸', '📘', '🐦'].map((icon, i) => (
                                <button key={i} className="w-9 h-9 bg-brown-700 hover:bg-brown-500 rounded-full flex items-center justify-center text-sm transition-colors">
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm text-cream-200">
                            {[['/', 'Home'], ['/products', 'Products'], ['/about', 'About Us'], ['/contact', 'Contact']].map(([to, label]) => (
                                <li key={to}><Link to={to} className="hover:text-brown-300 transition-colors">{label}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Customer support */}
                    <div>
                        <h4 className="font-semibold text-white mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-cream-200">
                            <li><Link to="/my-orders" className="hover:text-brown-300 transition-colors">Track Order</Link></li>
                            <li><Link to="/contact" className="hover:text-brown-300 transition-colors">Help Center</Link></li>
                            <li><a href="mailto:hello@sweethaven.in" className="hover:text-brown-300 transition-colors">hello@sweethaven.in</a></li>
                            <li><a href="tel:+919876543210" className="hover:text-brown-300 transition-colors">+91 98765 43210</a></li>
                        </ul>
                    </div>
                </div>

                <hr className="border-brown-700 my-8" />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-cream-300">
                    <p>© 2026 Manoj Sweets. Made with ❤️ for sweet lovers.</p>
                    <div className="flex gap-4">
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
