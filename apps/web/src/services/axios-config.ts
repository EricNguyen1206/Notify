import axios, { AxiosResponse } from "axios";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to include token from cookies
instance.interceptors.request.use(
  (config) => {
    // Get token from cookie
    const getTokenFromCookie = () => {
      if (typeof document === "undefined") return null;
      const cookies = document.cookie.split(";");
      const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith("token="));
      return tokenCookie ? tokenCookie.split("=")[1] : null;
    };

    const token = getTokenFromCookie();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("🚨 Axios Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === "development") {
      console.error("🚨 Axios Response Error:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
      });
    }
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
