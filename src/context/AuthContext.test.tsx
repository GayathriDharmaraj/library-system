import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { login as authLogin } from '../services/auth';

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('useAuth', () => {
  it('throws when used outside of an AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within AuthProvider');
  });

  it('starts with a null user when there is no existing session', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it('picks up an existing session on mount', () => {
    authLogin('admin@library.com', 'Admin@123', true);
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user?.email).toBe('admin@library.com');
  });

  it('login updates the user on success', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      const res = result.current.login('admin@library.com', 'Admin@123', false);
      expect(res.success).toBe(true);
    });
    expect(result.current.user?.email).toBe('admin@library.com');
  });

  it('login does not update the user on failure', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      const res = result.current.login('admin@library.com', 'wrongpass', false);
      expect(res.success).toBe(false);
    });
    expect(result.current.user).toBeNull();
  });

  it('logout clears the user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      result.current.login('admin@library.com', 'Admin@123', false);
    });
    expect(result.current.user).not.toBeNull();
    act(() => {
      result.current.logout();
    });
    expect(result.current.user).toBeNull();
  });

  it('updateUser updates the context user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    act(() => {
      result.current.login('admin@library.com', 'Admin@123', false);
    });
    act(() => {
      result.current.updateUser({ ...result.current.user!, name: 'New Name' });
    });
    expect(result.current.user?.name).toBe('New Name');
  });
});
