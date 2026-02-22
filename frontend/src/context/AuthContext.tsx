
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState } from '../types';

interface AuthContextType {
  authState: AuthState;
  login: (token: string, userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; onLogout: () => void }> = ({ children, onLogout }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setAuthState({
        isAuthenticated: true,
        user: JSON.parse(savedUser),
      });
    }
  }, []);

  const login = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuthState({
      isAuthenticated: true,
      user: userData,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      isAuthenticated: false,
      user: null,
    });
    onLogout();
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
