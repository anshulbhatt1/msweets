import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 animate-fade-in">
                    <div className="w-10 h-10 border-4 border-brown-300 border-t-brown-600 rounded-full animate-spin" />
                    <p className="text-sm text-brown-400">Loading…</p>
                </div>
            </div>
        )
    }

    if (!user) {
        // Save where user was trying to go, so login can redirect back
        return <Navigate to="/login" state={{ from: location.pathname }} replace />
    }

    return children
}
