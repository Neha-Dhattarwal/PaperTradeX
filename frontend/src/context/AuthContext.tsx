
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
    // Force bypass authentication for simulation
    setAuthState({
      isAuthenticated: true,
      user: { id: 'guest_user_123', name: 'Guest Trader', email: 'guest@example.com', cashBalance: 100000 },
    });
  }, []);

  const login = (token: string, userData: any) => {
    // No-op for guest mode
  };

  const logout = () => {
    // No-op for guest mode
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
