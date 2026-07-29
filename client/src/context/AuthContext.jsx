import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize and load user profile if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await API.get('/auth/profile');
          if (res.data && res.data.success) {
            setUser(res.data.user);
            setIsAuthenticated(true);
            setToken(storedToken);
          } else {
            // Invalid token
            logout();
          }
        } catch (err) {
          console.error("Auth initialization failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data && res.data.success) {
        const userToken = res.data.token;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(res.data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed. Please try again.';
      return { success: false, error: errorMsg };
    }
  };

  const register = async (formData) => {
    try {
      // Must submit as multipart/form-data for photo uploads
      const res = await API.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.success) {
        const userToken = res.data.token;
        localStorage.setItem('token', userToken);
        setToken(userToken);
        setUser(res.data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registration failed. Please check form details.';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      loading,
      login,
      register,
      logout,
      setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};
