import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // On mount, verify session with backend
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('sh_token')
            if (token) {
                try {
                    const res = await api.get('/auth/me')
                    setUser(res.data.user)
                } catch (err) {
                    console.error('Session validation failed:', err)
                    localStorage.removeItem('sh_token')
                    localStorage.removeItem('sh_user')
                    setUser(null)
                }
            } else {
                setUser(null)
            }
            setLoading(false)
        }
        initAuth()
    }, [])

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        const { token, user: u } = res.data
        localStorage.setItem('sh_token', token)
        localStorage.setItem('sh_user', JSON.stringify(u))
        setUser(u)
        return u
    }

    const signup = async (email, password, full_name, phone) => {
        const res = await api.post('/auth/signup', { email, password, full_name, phone })
        const { token, user: u } = res.data
        localStorage.setItem('sh_token', token)
        localStorage.setItem('sh_user', JSON.stringify(u))
        setUser(u)
        return u
    }

    const logout = async () => {
        try { await api.post('/auth/logout') } catch { }
        localStorage.removeItem('sh_token')
        localStorage.removeItem('sh_user')
        setUser(null)
    }

    const isAdmin = user?.role === 'admin'
    const isLoggedIn = !!user

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, isAdmin, isLoggedIn }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
