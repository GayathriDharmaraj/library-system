import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ToastProvider, useToast } from './ToastContext';

function wrapper({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('useToast', () => {
  it('throws when used outside of a ToastProvider', () => {
    expect(() => renderHook(() => useToast())).toThrow('useToast must be used within ToastProvider');
  });

  it('starts with an empty toast list', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(result.current.toasts).toEqual([]);
  });

  it('showToast adds a toast defaulting to type "success"', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.showToast('Book issued');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({ text: 'Book issued', type: 'success' });
  });

  it('showToast accepts an explicit type', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.showToast('Something failed', 'error');
    });
    expect(result.current.toasts[0]).toMatchObject({ text: 'Something failed', type: 'error' });
  });

  it('assigns each toast a unique, incrementing id', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.showToast('First');
      result.current.showToast('Second');
    });
    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
  });

  it('dismissToast removes only the specified toast', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.showToast('First');
      result.current.showToast('Second');
    });
    const [first, second] = result.current.toasts;
    act(() => {
      result.current.dismissToast(first.id);
    });
    expect(result.current.toasts).toEqual([second]);
  });

  describe('auto-dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('automatically dismisses a toast after 4 seconds', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      act(() => {
        result.current.showToast('Auto dismiss me');
      });
      expect(result.current.toasts).toHaveLength(1);
      act(() => {
        vi.advanceTimersByTime(4000);
      });
      expect(result.current.toasts).toHaveLength(0);
    });

    it('does not dismiss before the timeout elapses', () => {
      const { result } = renderHook(() => useToast(), { wrapper });
      act(() => {
        result.current.showToast('Not yet');
      });
      act(() => {
        vi.advanceTimersByTime(3999);
      });
      expect(result.current.toasts).toHaveLength(1);
    });
  });
});
