import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL
});

// Adjunta el token JWT (si existe) a cada request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Si el token expiro o es invalido, limpia la sesion y redirige al login
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/login');

      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');

        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
export { API_BASE_URL };
