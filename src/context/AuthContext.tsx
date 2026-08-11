import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuthUser } from '../types';
import * as authService from '../services/auth';

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string, remember: boolean) => authService.LoginResult;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getCurrentUser());

  const login = (email: string, password: string, remember: boolean) => {
    const result = authService.login(email, password, remember);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updated: AuthUser) => {
    authService.updateCurrentUser(updated);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
