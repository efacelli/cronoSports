import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as authApi from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('admin');
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(true);

  // Al montar, verifica que el token siga siendo valido
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .getMe()
      .then((res) => {
        setAdmin(res.data.data);
        localStorage.setItem('admin', JSON.stringify(res.data.data));
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        setAdmin(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    const { token, admin: adminData } = res.data.data;

    localStorage.setItem('token', token);
    localStorage.setItem('admin', JSON.stringify(adminData));
    setAdmin(adminData);

    return adminData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setAdmin(null);
  }, []);

  const value = {
    admin,
    isAuthenticated: Boolean(admin),
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }

  return context;
}
