import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth()
    const { totalItems } = useCart()
    const navigate = useNavigate()
    const location = useLocation()
    const [menuOpen, setMenuOpen] = useState(false)
    const [profileOpen, setProfileOpen] = useState(false)
    const profileRef = useRef(null)

    // Close profile dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false)
            }
        }
        if (profileOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [profileOpen])

    // Close menus on route change
    useEffect(() => {
        setMenuOpen(false)
        setProfileOpen(false)
    }, [location.pathname])

    const handleLogout = async () => {
        setProfileOpen(false)
        await logout()
        navigate('/')
    }

    const isActive = (path) => location.pathname === path

    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-cream-200 shadow-warm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 bg-gradient-to-br from-brown-300 to-brown-500 rounded-full flex items-center justify-center text-white text-lg shadow-warm group-hover:shadow-warm-lg transition-all">
                            🧁
                        </div>
                        <span className="font-display font-bold text-xl text-brown-700">Sweet Haven</span>
                    </Link>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-1">
                        <NavLink to="/" active={isActive('/')}>Home</NavLink>
                        <NavLink to="/products" active={isActive('/products')}>Products</NavLink>
                        <NavLink to="/about" active={isActive('/about')}>About</NavLink>
                        <NavLink to="/contact" active={isActive('/contact')}>Contact</NavLink>
                        {isAdmin && (
                            <Link to="/admin/dashboard"
                                className="badge badge-brown ml-2 hover:bg-brown-300 hover:text-white transition-colors">
                                Admin
                            </Link>
                        )}
                    </div>

                    {/* Right side icons */}
                    <div className="flex items-center gap-3">
                        {/* Cart */}
                        <Link to="/cart" className="relative p-2 rounded-full hover:bg-cream-100 transition-colors" aria-label="Cart">
                            <svg className="w-6 h-6 text-brown-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-rose-400 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                                    {totalItems > 9 ? '9+' : totalItems}
                                </span>
                            )}
                        </Link>

                        {/* User / auth */}
                        {user ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen(o => !o)}
                                    className="flex items-center gap-2 p-2 rounded-full hover:bg-cream-100 transition-colors"
                                    aria-label="User menu"
                                    aria-expanded={profileOpen}
                                >
                                    <div className="w-8 h-8 bg-brown-300 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                        {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                                    </div>
                                </button>

                                {profileOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-warm-lg border border-cream-200 py-2 z-50 animate-fade-in">
                                        <div className="px-4 py-2">
                                            <p className="text-sm font-medium text-brown-700 truncate">{user.full_name}</p>
                                            <p className="text-xs text-brown-400 truncate">{user.email}</p>
                                        </div>
                                        <hr className="border-cream-200 my-1" />
                                        <DropItem to="/dashboard" label="My Dashboard" icon="📊" />
                                        <DropItem to="/my-orders" label="My Orders" icon="📦" />
                                        {isAdmin && (
                                            <>
                                                <hr className="border-cream-200 my-1" />
                                                <DropItem to="/admin/dashboard" label="Admin Panel" icon="⚙️" />
                                            </>
                                        )}
                                        <hr className="border-cream-200 my-1" />
                                        <button onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                                            <span>🚪</span> Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/login" className="hidden sm:block text-sm font-medium text-brown-600 hover:text-brown-800 transition-colors px-3 py-2">Sign In</Link>
                                <Link to="/signup" className="btn-primary text-sm py-2 px-5">Sign Up</Link>
                            </div>
                        )}

                        {/* Mobile hamburger */}
                        <button className="md:hidden p-2 rounded-full hover:bg-cream-100" onClick={() => setMenuOpen(o => !o)}
                            aria-label="Menu" aria-expanded={menuOpen}>
                            <svg className="w-6 h-6 text-brown-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {menuOpen
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                }
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-cream-200 bg-white px-4 py-3 space-y-1 animate-fade-in">
                    <MobileNavLink to="/" label="Home" />
                    <MobileNavLink to="/products" label="Products" />
                    <MobileNavLink to="/about" label="About" />
                    <MobileNavLink to="/contact" label="Contact" />
                    {!user && (
                        <>
                            <hr className="border-cream-200 my-2" />
                            <MobileNavLink to="/login" label="Sign In" />
                            <MobileNavLink to="/signup" label="Sign Up" />
                        </>
                    )}
                    {isAdmin && <MobileNavLink to="/admin/dashboard" label="Admin Panel" />}
                </div>
            )}
        </nav>
    )
}

function NavLink({ to, children, active }) {
    return (
        <Link to={to}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
        ${active ? 'bg-cream-100 text-brown-700' : 'text-brown-500 hover:bg-cream-100 hover:text-brown-700'}`}>
            {children}
        </Link>
    )
}

function DropItem({ to, label, icon }) {
    return (
        <Link to={to}
            className="block px-4 py-2 text-sm text-brown-700 hover:bg-cream-100 transition-colors flex items-center gap-2">
            {icon && <span>{icon}</span>} {label}
        </Link>
    )
}

function MobileNavLink({ to, label }) {
    return (
        <Link to={to}
            className="block px-3 py-2 rounded-xl text-brown-700 hover:bg-cream-100 font-medium transition-colors">
            {label}
        </Link>
    )
}
