import { create } from 'zustand';
import { UserDto } from '@notify/types';
import { authService } from '@/services/authService';
import { toast } from 'react-toastify';

// Auth store is now only for client-side state management
// User data is fetched via TanStack Query and not persisted
interface AuthState {
  user: UserDto | null;
  loading: boolean;

  clearState: () => void;
  signUp: (username: string, password: string, email: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,

  clearState: () => {
    set({ user: null, loading: false });
  },

  signUp: async (username: string, password: string, email: string) => {
    try {
      set({ loading: true });

      //  gọi api
      await authService.signUp({ username, password, email });

      toast.success('Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập.');
    } catch (error) {
      console.error(error);
      toast.error('Đăng ký không thành công');
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true });

      const { data } = await authService.signIn({ email, password });
      set({ user: data });
      toast.success('Chào mừng bạn quay lại với Notify 🎉');
    } catch (error) {
      console.error(error);
      toast.error('Đăng nhập không thành công!');
    }
  },

  signOut: async () => {
    try {
      get().clearState();
      await authService.signOut();
      toast.success('Logout thành công!');
    } catch (error) {
      console.error(error);
      toast.error('Lỗi xảy ra khi logout. Hãy thử lại!');
    }
  },

  fetchProfile: async () => {
    try {
      set({ loading: true });
      const res = await authService.getProfile();

      set({ user: res.data });
    } catch (error) {
      console.error(error);
      set({ user: null });
      toast.error('Lỗi xảy ra khi lấy dữ liệu người dùng. Hãy thử lại!');
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    try {
      set({ loading: true });
      const { user, fetchProfile } = get();

      if (!user) {
        await fetchProfile();
      }
    } catch (error) {
      console.error(error);
      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
      get().clearState();
    } finally {
      set({ loading: false });
    }
  },
}));
