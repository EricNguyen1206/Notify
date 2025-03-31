import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
    baseURL: BASE_URL
});

const authApi = axios.create({
    baseURL: BASE_URL
});

// Add a request interceptor to include the token
authApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        config.headers.Authorization = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXIxQGV4YW1wbGUuY29tIiwiZXhwIjoxNzQzMDk2ODk2LCJzdWIiOjF9.kRmSx2hPNJ41oyAagoZne62lP4tG0ye2mbEPBjPpA4c`;
    }
    return config;
});

export { BASE_URL, api, authApi };
