import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId: string | null;
  login: (token: string, role: string, userId: string) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const storedUserId = localStorage.getItem('userId');
    
    if (token) {
      setIsAuthenticated(true);
      setIsAdmin(role === 'admin');
      setUserId(storedUserId);
      
      setupAuthInterceptor();
    }
  }, []);

  const setupAuthInterceptor = () => {
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          toast.error('Session expired. Please log in again.');
          logout();
          navigate('/');
        }
        return Promise.reject(error);
      }
    );
  };

  const login = (token: string, role: string, id: string) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userId', id);
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    setIsAuthenticated(true);
    setIsAdmin(role === 'admin');
    setUserId(id);
    
    setupAuthInterceptor();
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    
    delete axios.defaults.headers.common['Authorization'];
    
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserId(null);
  };

  const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    return !!token;
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isAdmin, 
      userId, 
      login, 
      logout, 
      checkAuth 
    }}>
      {children}
    </AuthContext.Provider>
  );
};