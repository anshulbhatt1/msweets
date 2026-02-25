import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api, { tokenManager } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const initRan = useRef(false)

    // ─── Initialize: verify session on mount ─────────────────
    useEffect(() => {
        // Prevent double-run in React 18 strict mode
        if (initRan.current) return
        initRan.current = true

        const initAuth = async () => {
            const token = tokenManager.getAccessToken()
            const refreshToken = tokenManager.getRefreshToken()

            if (!token && !refreshToken) {
                // No tokens at all — user is not logged in
                setUser(null)
                setLoading(false)
                return
            }

            try {
                // Try /auth/me — middleware will silently refresh if access token expired
                const res = await api.get('/auth/me')
                setUser(res.data.user)
                tokenManager.setUser(res.data.user)
            } catch (err) {
                console.warn('Session validation failed:', err?.response?.data?.error || err.message)

                // Try explicit refresh if /me failed
                if (refreshToken) {
                    try {
                        const refreshRes = await api.post('/auth/refresh', { refreshToken })
                        const { token: newToken, refreshToken: newRefresh, user: u } = refreshRes.data
                        tokenManager.setTokens(newToken, newRefresh)
                        tokenManager.setUser(u)
                        setUser(u)
                    } catch {
                        // Both access and refresh failed — truly logged out
                        tokenManager.clear()
                        setUser(null)
                    }
                } else {
                    tokenManager.clear()
                    setUser(null)
                }
            } finally {
                setLoading(false)
            }
        }

        initAuth()
    }, [])

    // ─── Listen for forced session expiry from API interceptor ─
    useEffect(() => {
        const handleSessionExpired = () => {
            setUser(null)
            tokenManager.clear()
        }
        window.addEventListener('auth:session-expired', handleSessionExpired)
        return () => window.removeEventListener('auth:session-expired', handleSessionExpired)
    }, [])

    // ─── Login ───────────────────────────────────────────────
    const login = useCallback(async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        const { token, refreshToken, user: u } = res.data

        tokenManager.setTokens(token, refreshToken)
        tokenManager.setUser(u)
        setUser(u)

        return u
    }, [])

    // ─── Signup ──────────────────────────────────────────────
    const signup = useCallback(async (email, password, full_name, phone) => {
        const res = await api.post('/auth/signup', { email, password, full_name, phone })
        const { token, refreshToken, user: u } = res.data

        tokenManager.setTokens(token, refreshToken)
        tokenManager.setUser(u)
        setUser(u)

        return u
    }, [])

    // ─── Logout ──────────────────────────────────────────────
    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout')
        } catch {
            // Even if server call fails, clear local state
        }
        tokenManager.clear()
        setUser(null)
    }, [])

    // ─── Update profile (no re-login needed) ──────────────────
    const updateProfile = useCallback(async (updates) => {
        const res = await api.put('/auth/profile', updates)
        const updatedUser = res.data.user
        tokenManager.setUser(updatedUser)
        setUser(updatedUser)
        return updatedUser
    }, [])

    // ─── Change password ─────────────────────────────────────
    const changePassword = useCallback(async (currentPassword, newPassword) => {
        await api.put('/auth/change-password', { currentPassword, newPassword })
    }, [])

    // ─── Refresh user data from server ───────────────────────
    const refreshUser = useCallback(async () => {
        try {
            const res = await api.get('/auth/me')
            tokenManager.setUser(res.data.user)
            setUser(res.data.user)
            return res.data.user
        } catch {
            return null
        }
    }, [])

    // ─── Derived state ───────────────────────────────────────
    const isAdmin = user?.role === 'admin'
    const isLoggedIn = !!user

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAdmin,
            isLoggedIn,
            login,
            signup,
            logout,
            updateProfile,
            changePassword,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
    return ctx
}
