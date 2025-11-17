import { create } from "zustand";

// Auth store is now only for client-side state management
// User data is fetched via TanStack Query and not persisted
interface AuthState {
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  clearAuth: () => {
    // Clear any client-side auth state if needed
    // User data is managed by TanStack Query, not Zustand
  },
}));
