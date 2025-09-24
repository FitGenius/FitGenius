import React, { createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'PROFESSIONAL';
  profileImage?: string;
  createdAt: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// This context will be provided by App.tsx with the actual implementation