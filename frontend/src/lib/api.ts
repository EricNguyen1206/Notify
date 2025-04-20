import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

// SSR cookie access

export const BASE_URL = 'http://localhost:8080/api/v1';

// Get the JWT token from cookies
export function getAuthToken(): string | null {
    if (typeof document === 'undefined') {
        return null; // Not in browser environment
    }

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'jwt') {
            return value;
        }
    }

    return null;
}

class ApiUtils {
    private static getAxiosInstance(): AxiosInstance {
        const token = Cookies.get('token'); // get token from client cookies

        const instance = axios.create({
            baseURL: BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        });

        return instance;
    }

    static async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        const instance = this.getAxiosInstance();

        return instance.get<T>(url, config);
    }

    static async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        const instance = this.getAxiosInstance();

        return instance.post<T>(url, data, config);
    }

    static async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        const instance = this.getAxiosInstance();

        return instance.put<T>(url, data, config);
    }

    static async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        const instance = this.getAxiosInstance();

        return instance.delete<T>(url, config);
    }
}

export default ApiUtils;
