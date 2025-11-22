import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000, // 10 second timeout
  withCredentials: true, // Send cookies with requests
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add request interceptor - no manual token handling needed (httpOnly cookies)
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Cookies are automatically sent with withCredentials: true
    return config;
  },
  (error) => {
    console.error("🚨 Axios Request Error:", error);
    throw error;
  }
);

// Add response interceptor for automatic token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ 
            resolve: (token) => {
              originalRequest.headers = originalRequest.headers || {};
              resolve(apiClient(originalRequest));
            }, 
            reject 
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh token
        await apiClient.post("/auth/refresh");
        
        // Process queued requests
        processQueue(null, null);
        
        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, process queue with error
        processQueue(refreshError, null);
        
        // Redirect to login if we're in the browser
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    // Log other errors in development
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
    
    throw error;
  }
);

export const apiRequest = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.request<T>(config);
  return response.data;
};
