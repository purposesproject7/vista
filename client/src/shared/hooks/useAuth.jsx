// src/shared/hooks/useAuth.jsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { MOCK_USERS } from '../utils/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for mock user in localStorage (dev mode)
    const mockUser = localStorage.getItem('mockUser');
    if (mockUser) {
      setUser(JSON.parse(mockUser));
      setLoading(false);
      return;
    }

    // Check if user is logged in (check token in localStorage)
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      // TODO: Replace with actual API call
      // For now, use mock data
      if (token.startsWith('mock-token')) {
        const userType = token.replace('mock-token-', '');
        setUser(MOCK_USERS[userType]);
      }
    } catch (err) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('mockUser');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    // TODO: Replace with actual API call
    // Mock login for development
    const mockUser = MOCK_USERS.faculty;
    localStorage.setItem('authToken', 'mock-token-faculty');
    localStorage.setItem('mockUser', JSON.stringify(mockUser));
    setUser(mockUser);
    return { user: mockUser, token: 'mock-token-faculty' };
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('mockUser');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
