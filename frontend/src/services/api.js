import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
})

// Attach JWT from localStorage to every request
api.interceptors.request.use(config => {
    const token = localStorage.getItem('sh_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Handle 401 globally — clear session
api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('sh_token')
            // Don't redirect here — let components handle it
        }
        return Promise.reject(err)
    }
)

export default api
