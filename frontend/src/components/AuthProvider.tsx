"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthState, getCurrentUser } from '@/lib/auth';

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const login = (user: User) => {
    setState(prev => ({ ...prev, user, error: null }));
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setState(prev => ({ ...prev, user: null, error: null }));
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const checkAuth = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const user = await getCurrentUser();
      setState(prev => ({ ...prev, user, loading: false, error: null }));
    } catch (error) {
      setState(prev => ({ ...prev, user: null, loading: false, error: '인증 확인 실패' }));
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
