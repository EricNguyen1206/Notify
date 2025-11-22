import api from '@/lib/axios';
import {
  ApiMessageResponse,
  ApiResponse,
  SigninRequestDto,
  SignupRequestDto,
  UserDto,
} from '@notify/types';

export const authService = {
  signUp: async (data: SignupRequestDto) => {
    const res = await api.post('/auth/signup', data, { withCredentials: true });

    return res.data;
  },

  signIn: async (data: SigninRequestDto) => {
    const res = await api.post<ApiResponse<UserDto>>('/auth/signin', data, {
      withCredentials: true,
    });
    return res.data;
  },

  signOut: async () => {
    const res = await api.post<ApiMessageResponse>('/auth/signout', { withCredentials: true });
    return res.data;
  },

  getProfile: async (): Promise<ApiResponse<UserDto>> => {
    const res = await api.get<ApiResponse<UserDto>>('/users/profile', { withCredentials: true });
    return res.data;
  },

  refresh: async () => {
    const res = await api.post<ApiResponse<string>>('/auth/refresh', { withCredentials: true });
    return res.data;
  },
};
