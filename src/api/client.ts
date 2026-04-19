import axios from 'axios'

const BASE_URL = 'https://api.veritascorporation.co/api/v1'
const TOKEN_KEY = 'sb_admin_token'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only redirect on 401 if NOT on the login page (to avoid clearing error messages)
    if (err.response?.status === 401 && window.location.pathname !== '/signin') {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/signin'
    }
    return Promise.reject(err)
  }
)

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const BASE_MEDIA = 'https://api.veritascorporation.co'
