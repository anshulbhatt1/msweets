import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
    const { signup } = useAuth()
    const navigate = useNavigate()

    const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleSubmit = async e => {
        e.preventDefault()
        setError('')
        if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
        setLoading(true)
        try {
            await signup(form.email, form.password, form.full_name, form.phone)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.error || 'Signup failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12"
            style={{ background: 'linear-gradient(135deg, #fdf0e0 0%, #fae0d0 100%)' }}>
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-brown-300 to-brown-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-warm">
                        🧁
                    </div>
                    <h1 className="font-display text-3xl font-bold text-brown-800">Create account</h1>
                    <p className="text-brown-400 mt-1">Join the Sweet Haven family</p>
                </div>

                <div className="card shadow-warm-lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-brown-700 mb-1.5">Full Name</label>
                            <input name="full_name" type="text" required value={form.full_name}
                                onChange={handleChange} className="input" placeholder="Priya Sharma" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brown-700 mb-1.5">Email</label>
                            <input name="email" type="email" required value={form.email}
                                onChange={handleChange} className="input" placeholder="priya@example.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brown-700 mb-1.5">Phone (optional)</label>
                            <input name="phone" type="tel" value={form.phone}
                                onChange={handleChange} className="input" placeholder="+91 98765 43210" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brown-700 mb-1.5">Password</label>
                            <input name="password" type="password" required value={form.password}
                                onChange={handleChange} className="input" placeholder="Min. 6 characters" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brown-700 mb-1.5">Confirm Password</label>
                            <input name="confirm" type="password" required value={form.confirm}
                                onChange={handleChange} className="input" placeholder="••••••••" />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
                            {loading ? 'Creating account…' : 'Create Account'}
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
