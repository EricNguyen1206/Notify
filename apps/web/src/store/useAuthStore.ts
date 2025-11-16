import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = {
  id: string;
  email: string;
  username: string;
  avatar?: string;
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  updateUser: (user: User) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user: User) => set({ user }),
      updateUser: (user: User) => set({ user }),
      setIsAuthenticated: (isAuthenticated: boolean) => set({ isAuthenticated }),
      clearAuth: () => {
        // Reset Zustand state
        // Note: Cookies are cleared by backend on signout
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage", // localStorage key
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      // Skip hydration during SSR
      // skipHydration: true,
    }
  )
);
