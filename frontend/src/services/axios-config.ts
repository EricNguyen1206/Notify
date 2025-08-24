import axios, { AxiosResponse } from 'axios';

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Add request interceptor to include token from cookies
instance.interceptors.request.use(
  (config) => {
    // Get token from cookie
    const getTokenFromCookie = () => {
      if (typeof document === 'undefined') return null;
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
      return tokenCookie ? tokenCookie.split('=')[1] : null;
    };

    const token = getTokenFromCookie();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// This function matches Orval's mutator signature
export const axiosInstance = <T>({
  url,
  method,
  ...config
}: {
  url: string;
  method: string;
  [key: string]: any;
}): Promise<AxiosResponse<T>> => {
  return instance({
    url,
    method,
    ...config,
  });
};
