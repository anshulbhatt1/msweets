import { Link } from 'react-router-dom'

export default function AccessDenied() {
    return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full text-center">
                <div className="text-6xl mb-6">🚫</div>
                <h1 className="font-display text-4xl font-bold text-brown-800 mb-4">Access Denied</h1>
                <p className="text-brown-500 mb-8">
                    You don't have permission to access this page. This area is reserved for administrators only.
                </p>
                <div className="flex flex-col gap-3">
                    <Link to="/" className="btn-primary">
                        Return to Home
                    </Link>
                    <Link to="/login" className="btn-secondary">
                        Sign in as different user
                    </Link>
                </div>
            </div>
        </div>
    )
}
