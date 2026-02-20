import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()

    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

    const handleSubmit = async e => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const user = await login(form.email, form.password)
            if (user.role === 'admin') navigate('/admin/dashboard')
            else navigate('/')
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'linear-gradient(135deg, #fdf0e0 0%, #fae0d0 100%)' }}>

            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-brown-300 to-brown-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-warm">
                        🧁
                    </div>
                    <h1 className="font-display text-3xl font-bold text-brown-800">Welcome back!</h1>
                    <p className="text-brown-400 mt-1">Sign in to your Sweet Haven account</p>
                </div>

                <div className="card shadow-warm-lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-brown-700 mb-1.5">Email</label>
                            <input
                                name="email" type="email" required autoComplete="email"
                                value={form.email} onChange={handleChange}
                                className="input" placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-brown-700 mb-1.5">Password</label>
                            <input
                                name="password" type="password" required autoComplete="current-password"
                                value={form.password} onChange={handleChange}
                                className="input" placeholder="••••••••"
                            />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full mt-2 disabled:opacity-60">
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-5 text-center">
                        <p className="text-sm text-brown-500">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-brown-600 font-semibold hover:underline">Sign up free</Link>
                        </p>
                    </div>
                </div>

                <p className="text-center mt-6 text-xs text-brown-400">
                    Admin?{' '}
                    <Link to="/admin/login" className="text-brown-500 hover:underline">Admin login →</Link>
                </p>
            </div>
        </div>
    )
}
