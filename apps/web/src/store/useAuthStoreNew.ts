import { create } from "zustand";
import { authService } from "@/services/authService";
import { toast } from "react-toastify";
import { UserDto } from "@notify/types";

export interface AuthState {
    accessToken: string | null;
    user: UserDto | null;
    loading: boolean;
  
    setAccessToken: (accessToken: string) => void;
    clearState: () => void;
    signUp: (
      username: string,
      password: string,
      email: string,
      firstName: string,
      lastName: string
    ) => Promise<void>;
    signIn: (username: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    getProfile: () => Promise<void>;
    refresh: () => Promise<void>;
  }

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,

  setAccessToken: (accessToken) => {
    set({ accessToken });
  },
  clearState: () => {
    set({ accessToken: null, user: null, loading: false });
  },

  signUp: async (username, password, email, firstName, lastName) => {
    try {
      set({ loading: true });

      //  gọi api
      await authService.signUp({
        username,
        password,
        email,
      });

      toast.success("Đăng ký thành công! Bạn sẽ được chuyển sang trang đăng nhập.");
    } catch (error) {
      console.error(error);
      toast.error("Đăng ký không thành công");
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true });

      const { success, message } = await authService.signIn({
        email,
        password,
      });

      if (!success) {
        toast.error(message);
        return;
      }

      await get().getProfile();
      toast.success("Chào mừng bạn quay lại với Moji 🎉");
    } catch (error) {
      console.error(error);
      toast.error("Đăng nhập không thành công!");
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      get().clearState();
      await authService.signOut();
      toast.success("Logout thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi xảy ra khi logout. Hãy thử lại!");
    }
  },

  getProfile: async () => {
    try {
      set({ loading: true });
      const {data} = await authService.getProfile();

      set({ user: data });
    } catch (error) {
      console.error(error);
      set({ user: null, accessToken: null });
      toast.error("Lỗi xảy ra khi lấy dữ liệu người dùng. Hãy thử lại!");
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    try {
      set({ loading: true });
      const { user, getProfile, setAccessToken } = get();
      const {success} = await authService.refresh();
      if (!success) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        get().clearState();
      }
    } catch (error) {
      console.error(error);
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
      get().clearState();
    } finally {
      set({ loading: false });
    }
  },
}));