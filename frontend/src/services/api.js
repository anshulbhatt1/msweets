import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
})

// ─── Token management ───────────────────────────────────────
const TOKEN_KEY = 'sh_token'
const REFRESH_KEY = 'sh_refresh_token'
const USER_KEY = 'sh_user'

export const tokenManager = {
    getAccessToken: () => localStorage.getItem(TOKEN_KEY),
    getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
    getUser: () => {
        try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
    },

    setTokens: (accessToken, refreshToken) => {
        if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken)
        if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
    },

    setUser: (user) => {
        if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
        else localStorage.removeItem(USER_KEY)
    },

    clear: () => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem(USER_KEY)
    }
}

// ─── Request interceptor ────────────────────────────────────
// Attach access token to every request
api.interceptors.request.use(config => {
    const token = tokenManager.getAccessToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// ─── Response interceptor ───────────────────────────────────
// 1. Pick up silently-refreshed tokens from the X-New-Access-Token header
// 2. On 401, attempt silent refresh before failing
let isRefreshing = false
let refreshQueue = []

const processQueue = (error, token = null) => {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error)
        else resolve(token)
    })
    refreshQueue = []
}

api.interceptors.response.use(
    // ── Success handler ──
    response => {
        // If the backend issued a new access token via header, save it
        const newToken = response.headers['x-new-access-token']
        if (newToken) {
            tokenManager.setTokens(newToken, null)
        }
        return response
    },

    // ── Error handler ──
    async error => {
        const originalRequest = error.config

        // Only attempt refresh on 401 errors (not on login/signup/refresh itself)
        const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/signup') ||
            originalRequest.url?.includes('/auth/refresh')

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            // If already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject })
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`
                    return api(originalRequest)
                }).catch(err => {
                    return Promise.reject(err)
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                // Attempt silent refresh
                const refreshToken = tokenManager.getRefreshToken()
                const res = await axios.post('/api/auth/refresh', {
                    refreshToken
                }, { withCredentials: true })

                const { token: newAccessToken, refreshToken: newRefreshToken, user } = res.data

                tokenManager.setTokens(newAccessToken, newRefreshToken)
                if (user) tokenManager.setUser(user)

                // Retry the original request with new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

                processQueue(null, newAccessToken)

                return api(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)

                // Refresh failed — full logout
                tokenManager.clear()

                // Dispatch a custom event so AuthContext can react
                window.dispatchEvent(new CustomEvent('auth:session-expired'))

                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

export default api
