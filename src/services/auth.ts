import type { AuthUser } from '../types';
import { CREDENTIALS, seedUsers } from '../data/seedData';
import { STORAGE_KEYS } from './storage';

const SESSION_KEY = 'library_session';

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: AuthUser;
}

export function login(email: string, password: string, remember: boolean): LoginResult {
  const normalizedEmail = email.trim().toLowerCase();
  const knownEmails = Object.keys(CREDENTIALS);

  if (!knownEmails.includes(normalizedEmail)) {
    return { success: false, error: 'No account found with this username.' };
  }
  if (CREDENTIALS[normalizedEmail] !== password) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  const user = seedUsers.find((u) => u.email === normalizedEmail);
  if (!user) {
    return { success: false, error: 'Account could not be loaded.' };
  }

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));

  return { success: true, user };
}

export function getCurrentUser(): AuthUser | null {
  const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function updateCurrentUser(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  if (localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else if (sessionStorage.getItem(SESSION_KEY)) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
