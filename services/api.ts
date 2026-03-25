import axios from 'axios';

const apiHost = window.location.hostname || 'localhost';
const apiProtocol = window.location.protocol || 'http:';
const defaultApiBaseUrl = `${apiProtocol}//${apiHost}:3001/api`;
const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;

const api = axios.create({
    baseURL: viteEnv?.VITE_API_BASE_URL || defaultApiBaseUrl,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
