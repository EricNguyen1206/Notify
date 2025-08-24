import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type User = {
  id: number
  email: string
  username: string
  avatar?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
  setUser: (user: User) => void
  setIsAuthenticated: (isAuthenticated: boolean) => void
  setToken: (token: string) => void
  clearAuth: () => void
  getTokenFromCookie: () => string | null
}
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      setUser: (user: User) => set({ user }),
      setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
      setToken: (token: string) => set({ token }),
      clearAuth: () => {
        // Clear cookie
        document.cookie = 'token=; path=/; max-age=0'
        // Reset Zustand state
        set({ user: null, isAuthenticated: false, token: null })
      },
      
      getTokenFromCookie: () => {
        if (typeof document === 'undefined') return null
        const cookies = document.cookie.split(';')
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='))
        return tokenCookie ? tokenCookie.split('=')[1] : null
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)
