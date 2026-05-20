import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    const storedUser = localStorage.getItem('admin_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setIsLoading(false);
  }, []);

  // Ensure admin API requests always send the current token
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use((config) => {
      const url = config.url ?? '';
      if (url.includes('/api/admin') || url.includes('/admin/')) {
        const t = token ?? localStorage.getItem('admin_token');
        if (t) config.headers.Authorization = `Bearer ${t}`;
      }
      return config;
    });
    return () => { axios.interceptors.request.eject(reqInterceptor); };
  }, [token]);

  // On 401/403 from admin API (except login), clear auth so user can log in again and get a fresh token
  useEffect(() => {
    const resInterceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        const status = err.response?.status;
        const url = err.config?.url ?? '';
        const isAdminApi = url.includes('/api/admin') || url.includes('/admin/');
        const isLogin = url.includes('/admin/login');
        if ((status === 401 || status === 403) && isAdminApi && !isLogin) {
          setToken(null);
          setUser(null);
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          delete axios.defaults.headers.common['Authorization'];
        }
        return Promise.reject(err);
      }
    );
    return () => { axios.interceptors.response.eject(resInterceptor); };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/admin/login`, {
        username,
        password
      });

      const { token: newToken, user: newUser } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      
      localStorage.setItem('admin_token', newToken);
      localStorage.setItem('admin_user', JSON.stringify(newUser));
      
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || !error.response) {
        throw new Error('Cannot reach server. Is the backend running at ' + API_BASE_URL + '?');
      }
      const msg = error.response?.data?.error || error.response?.data?.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};