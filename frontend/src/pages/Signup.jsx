import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function Signup() {
    const { signup, isLoggedIn } = useAuth()
    const navigate = useNavigate()

    const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // If already logged in, redirect
    useEffect(() => {
        if (isLoggedIn) navigate('/', { replace: true })
    }, [isLoggedIn, navigate])

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleSubmit = async e => {
        e.preventDefault()
        setError('')

        if (!form.full_name.trim()) {
            setError('Please enter your full name.')
            return
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }
        if (form.password !== form.confirm) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)
        try {
            await signup(form.email, form.password, form.full_name, form.phone)
            navigate('/', { replace: true })
        } catch (err) {
            setError(err.response?.data?.error || 'Signup failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{ background: 'linear-gradient(135deg, #fdf0e0 0%, #fae0d0 100%)' }}>
            <div className="w-full max-w-md animate-fade-in">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Logo size="lg" variant="light" />
                    </div>
                    <h1 className="font-display text-3xl font-bold text-brown-800">Create account</h1>
                    <p className="text-brown-400 mt-1">Join the Manoj Sweets family</p>
                </div>

                <div className="card shadow-warm-lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="signup-name" className="block text-sm font-medium text-brown-700 mb-1.5">Full Name</label>
                            <input id="signup-name" name="full_name" type="text" required value={form.full_name}
                                onChange={handleChange} className="input" placeholder="Priya Sharma" autoComplete="name" />
                        </div>
                        <div>
                            <label htmlFor="signup-email" className="block text-sm font-medium text-brown-700 mb-1.5">Email</label>
                            <input id="signup-email" name="email" type="email" required value={form.email}
                                onChange={handleChange} className="input" placeholder="priya@example.com" autoComplete="email" />
                        </div>
                        <div>
                            <label htmlFor="signup-phone" className="block text-sm font-medium text-brown-700 mb-1.5">Phone (optional)</label>
                            <input id="signup-phone" name="phone" type="tel" value={form.phone}
                                onChange={handleChange} className="input" placeholder="+91 98765 43210" autoComplete="tel" />
                        </div>
                        <div>
                            <label htmlFor="signup-password" className="block text-sm font-medium text-brown-700 mb-1.5">Password</label>
                            <input id="signup-password" name="password" type="password" required value={form.password}
                                onChange={handleChange} className="input" placeholder="Min. 6 characters" autoComplete="new-password" />
                        </div>
                        <div>
                            <label htmlFor="signup-confirm" className="block text-sm font-medium text-brown-700 mb-1.5">Confirm Password</label>
                            <input id="signup-confirm" name="confirm" type="password" required value={form.confirm}
                                onChange={handleChange} className="input" placeholder="••••••••" autoComplete="new-password" />
                        </div>

                        <button type="submit" disabled={loading}
                            className="btn-primary w-full mt-2 disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account…
                                </>
                            ) : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-5 text-center">
                        <p className="text-sm text-brown-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-brown-600 font-semibold hover:underline">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
