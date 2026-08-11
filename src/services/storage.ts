import type { ActivityItem, Book, Category, IssueRecord, Member } from '../types';
import { buildSeedIssues, seedBooks, seedCategories, seedMembers, seedActivity } from '../data/seedData';

export const STORAGE_KEYS = {
  books: 'library_books',
  members: 'library_members',
  issues: 'library_issues',
  categories: 'library_categories',
  user: 'library_user',
  activity: 'library_activity',
  seeded: 'library_seeded_v1',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function ensureSeeded(): void {
  if (localStorage.getItem(STORAGE_KEYS.seeded)) return;

  const categories = seedCategories();
  const books = seedBooks();
  const members = seedMembers();
  const { issues, books: booksAfter, members: membersAfter } = buildSeedIssues(books, members);
  const activity = seedActivity();

  write(STORAGE_KEYS.categories, categories);
  write(STORAGE_KEYS.books, booksAfter);
  write(STORAGE_KEYS.members, membersAfter);
  write(STORAGE_KEYS.issues, issues);
  write(STORAGE_KEYS.activity, activity);
  localStorage.setItem(STORAGE_KEYS.seeded, 'true');
}

export function resetDemoData(): void {
  localStorage.removeItem(STORAGE_KEYS.seeded);
  localStorage.removeItem(STORAGE_KEYS.books);
  localStorage.removeItem(STORAGE_KEYS.members);
  localStorage.removeItem(STORAGE_KEYS.issues);
  localStorage.removeItem(STORAGE_KEYS.categories);
  localStorage.removeItem(STORAGE_KEYS.activity);
  ensureSeeded();
}

export const getBooks = (): Book[] => read(STORAGE_KEYS.books, []);
export const setBooks = (books: Book[]): void => write(STORAGE_KEYS.books, books);

export const getMembers = (): Member[] => read(STORAGE_KEYS.members, []);
export const setMembers = (members: Member[]): void => write(STORAGE_KEYS.members, members);

export const getIssues = (): IssueRecord[] => read(STORAGE_KEYS.issues, []);
export const setIssues = (issues: IssueRecord[]): void => write(STORAGE_KEYS.issues, issues);

export const getCategories = (): Category[] => read(STORAGE_KEYS.categories, []);
export const setCategories = (categories: Category[]): void => write(STORAGE_KEYS.categories, categories);

export const getActivity = (): ActivityItem[] => read(STORAGE_KEYS.activity, []);
export const setActivity = (activity: ActivityItem[]): void => write(STORAGE_KEYS.activity, activity);

export const pushActivity = (item: Omit<ActivityItem, 'id' | 'timestamp'>): void => {
  const activity = getActivity();
  const newItem: ActivityItem = {
    ...item,
    id: `ACT-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  setActivity([newItem, ...activity].slice(0, 20));
};

export const nextId = (prefix: string, existingIds: string[]): string => {
  let max = 0;
  existingIds.forEach((id) => {
    const num = parseInt(id.split('-').pop() || '0', 10);
    if (!Number.isNaN(num) && num > max) max = num;
  });
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
};
