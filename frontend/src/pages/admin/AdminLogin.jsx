import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminLogin() {
    const { login, logout } = useAuth()
    const navigate = useNavigate()

    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async e => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { role } = await login(form.email, form.password)
            if (role !== 'admin') {
                // Not an admin — log them back out cleanly via context
                await logout()
                setError('Access denied. This portal is for admins only.')
            } else {
                navigate('/admin/dashboard')
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-brown-800 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brown-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-warm-lg">
                        🧁
                    </div>
                    <h1 className="font-display text-3xl font-bold text-white">Admin Portal</h1>
                    <p className="text-brown-300 mt-1">Sweet Haven Management</p>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-warm-lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-brown-700 mb-1.5">Admin Email</label>
                            <input name="email" type="email" required value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                className="input" placeholder="admin@sweethaven.in" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brown-700 mb-1.5">Password</label>
                            <input name="password" type="password" required value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                className="input" placeholder="••••••••" />
                        </div>
                        <button type="submit" disabled={loading}
                            className="btn-primary w-full mt-2 disabled:opacity-60">
                            {loading ? 'Signing in…' : 'Sign In to Admin'}
                        </button>
                    </form>
                    <div className="mt-4 text-center">
                        <Link to="/" className="text-sm text-brown-400 hover:text-brown-600 transition-colors">
                            ← Back to Store
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
