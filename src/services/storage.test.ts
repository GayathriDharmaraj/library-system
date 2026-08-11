import { describe, it, expect } from 'vitest';
import {
  STORAGE_KEYS,
  ensureSeeded,
  resetDemoData,
  getBooks,
  setBooks,
  getMembers,
  setMembers,
  getIssues,
  setIssues,
  getCategories,
  setCategories,
  getActivity,
  setActivity,
  pushActivity,
  nextId,
} from './storage';
import type { Book, ActivityItem } from '../types';

describe('getters on empty storage', () => {
  it('return empty arrays when nothing has been written', () => {
    expect(getBooks()).toEqual([]);
    expect(getMembers()).toEqual([]);
    expect(getIssues()).toEqual([]);
    expect(getCategories()).toEqual([]);
    expect(getActivity()).toEqual([]);
  });
});

describe('setters and getters round-trip', () => {
  it('persists and retrieves books via localStorage', () => {
    const book: Book = {
      id: 'BK-001',
      isbn: '9780743273565',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      category: 'Fiction',
      publisher: 'Scribner',
      publishedYear: 1925,
      totalCopies: 5,
      availableCopies: 5,
      description: 'desc',
      status: 'Available',
      coverColor: '#4f46e5',
      createdAt: '2026-01-01',
    };
    setBooks([book]);
    expect(getBooks()).toEqual([book]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.books) || '[]')).toEqual([book]);
  });

  it('persists categories', () => {
    setCategories([{ id: 'CAT-01', name: 'Fiction' }]);
    expect(getCategories()).toEqual([{ id: 'CAT-01', name: 'Fiction' }]);
  });

  it('persists members', () => {
    setMembers([]);
    expect(getMembers()).toEqual([]);
  });

  it('persists issues', () => {
    setIssues([]);
    expect(getIssues()).toEqual([]);
  });

  it('persists activity', () => {
    const activity: ActivityItem[] = [{ id: 'ACT-1', type: 'book', message: 'test', timestamp: '2026-01-01T00:00:00.000Z' }];
    setActivity(activity);
    expect(getActivity()).toEqual(activity);
  });

  it('falls back to the default value when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEYS.books, 'not valid json{');
    expect(getBooks()).toEqual([]);
  });
});

describe('ensureSeeded', () => {
  it('populates all storage keys on first run', () => {
    ensureSeeded();
    expect(getBooks().length).toBeGreaterThan(0);
    expect(getMembers().length).toBeGreaterThan(0);
    expect(getIssues().length).toBeGreaterThan(0);
    expect(getCategories().length).toBeGreaterThan(0);
    expect(getActivity().length).toBeGreaterThan(0);
    expect(localStorage.getItem(STORAGE_KEYS.seeded)).toBe('true');
  });

  it('does not reseed or overwrite existing data on subsequent calls', () => {
    ensureSeeded();
    setBooks([]);
    ensureSeeded();
    expect(getBooks()).toEqual([]);
  });
});

describe('resetDemoData', () => {
  it('clears and reseeds all data', () => {
    ensureSeeded();
    setBooks([]);
    setMembers([]);
    resetDemoData();
    expect(getBooks().length).toBeGreaterThan(0);
    expect(getMembers().length).toBeGreaterThan(0);
    expect(localStorage.getItem(STORAGE_KEYS.seeded)).toBe('true');
  });
});

describe('pushActivity', () => {
  it('prepends a new activity item with a generated id and timestamp', () => {
    setActivity([]);
    pushActivity({ type: 'book', message: 'New book added' });
    const activity = getActivity();
    expect(activity).toHaveLength(1);
    expect(activity[0].message).toBe('New book added');
    expect(activity[0].type).toBe('book');
    expect(activity[0].id).toMatch(/^ACT-\d+$/);
    expect(new Date(activity[0].timestamp).toString()).not.toBe('Invalid Date');
  });

  it('caps activity history at 20 items, dropping the oldest', () => {
    const existing: ActivityItem[] = Array.from({ length: 20 }, (_, i) => ({
      id: `ACT-old-${i}`,
      type: 'book',
      message: `old-${i}`,
      timestamp: '2026-01-01T00:00:00.000Z',
    }));
    setActivity(existing);
    pushActivity({ type: 'issue', message: 'newest' });
    const activity = getActivity();
    expect(activity).toHaveLength(20);
    expect(activity[0].message).toBe('newest');
    expect(activity.some((a) => a.message === 'old-19')).toBe(false);
  });
});

describe('nextId', () => {
  it('returns prefix-001 when there are no existing ids', () => {
    expect(nextId('BK', [])).toBe('BK-001');
  });

  it('increments from the highest existing numeric suffix', () => {
    expect(nextId('BK', ['BK-001', 'BK-002', 'BK-005'])).toBe('BK-006');
  });

  it('pads the numeric suffix to 3 digits', () => {
    expect(nextId('MEM', ['MEM-009'])).toBe('MEM-010');
  });

  it('handles ids beyond 3 digits without truncation', () => {
    expect(nextId('BK', ['BK-099', 'BK-100'])).toBe('BK-101');
  });

  it('ignores malformed ids when computing the max', () => {
    expect(nextId('BK', ['BK-abc', 'BK-003'])).toBe('BK-004');
  });
});
