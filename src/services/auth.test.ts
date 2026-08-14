import { describe, it, expect } from 'vitest';
import { login, getCurrentUser, updateCurrentUser, logout } from './auth';
import { STORAGE_KEYS, setMembers } from './storage';
import type { Member } from '../types';

const SESSION_KEY = 'library_session';

const testMember: Member = {
  id: 'MEM-100',
  firstName: 'Test',
  lastName: 'Member',
  email: 'test.member@mail.com',
  phone: '9999999999',
  dob: '1990-01-01',
  address: '1 Test Street',
  membershipType: 'Basic',
  membershipStart: '2025-01-01',
  membershipExpiry: '2026-01-01',
  status: 'Active',
  joinDate: '2025-01-01',
  booksIssued: 0,
};

describe('login', () => {
  it('succeeds with valid admin credentials', () => {
    const result = login('admin@library.com', 'Admin@123', false);
    expect(result.success).toBe(true);
    expect(result.user?.email).toBe('admin@library.com');
    expect(result.user?.role).toBe('admin');
  });

  it('succeeds with valid librarian credentials', () => {
    const result = login('librarian@library.com', 'Librarian@123', false);
    expect(result.success).toBe(true);
    expect(result.user?.role).toBe('librarian');
  });

  it('succeeds with valid member credentials and links to a memberId', () => {
    const result = login('member@library.com', 'Member@123', false);
    expect(result.success).toBe(true);
    expect(result.user?.role).toBe('member');
    expect(result.user?.memberId).toBe('MEM-008');
  });

  it('succeeds when any registered member logs in with their own email and the shared demo password', () => {
    setMembers([testMember]);
    const result = login('test.member@mail.com', 'Member@123', false);
    expect(result.success).toBe(true);
    expect(result.user?.role).toBe('member');
    expect(result.user?.memberId).toBe('MEM-100');
    expect(result.user?.name).toBe('Test Member');
  });

  it('is case-insensitive when matching a member email', () => {
    setMembers([testMember]);
    const result = login('TEST.MEMBER@MAIL.COM', 'Member@123', false);
    expect(result.success).toBe(true);
    expect(result.user?.memberId).toBe('MEM-100');
  });

  it('rejects a real member email with the wrong password', () => {
    setMembers([testMember]);
    const result = login('test.member@mail.com', 'wrongpass', false);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Incorrect password. Please try again.');
  });

  it('rejects an email that matches no staff account and no member record', () => {
    setMembers([testMember]);
    const result = login('nobody@mail.com', 'Member@123', false);
    expect(result.success).toBe(false);
    expect(result.error).toBe('No account found with this username.');
  });

  it('normalizes email case and whitespace before checking credentials', () => {
    const result = login('  ADMIN@Library.com  ', 'Admin@123', false);
    expect(result.success).toBe(true);
  });

  it('fails with an unknown email', () => {
    const result = login('nobody@library.com', 'whatever', false);
    expect(result.success).toBe(false);
    expect(result.error).toBe('No account found with this username.');
  });

  it('fails with an incorrect password', () => {
    const result = login('admin@library.com', 'wrongpass', false);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Incorrect password. Please try again.');
  });

  it('stores the session in sessionStorage when remember is false', () => {
    login('admin@library.com', 'Admin@123', false);
    expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('stores the session in localStorage when remember is true', () => {
    login('admin@library.com', 'Admin@123', true);
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('writes the user profile to STORAGE_KEYS.user regardless of remember', () => {
    login('admin@library.com', 'Admin@123', false);
    expect(localStorage.getItem(STORAGE_KEYS.user)).not.toBeNull();
  });
});

describe('getCurrentUser', () => {
  it('returns null when no session exists', () => {
    expect(getCurrentUser()).toBeNull();
  });

  it('returns the user from localStorage after a remembered login', () => {
    login('admin@library.com', 'Admin@123', true);
    expect(getCurrentUser()?.email).toBe('admin@library.com');
  });

  it('returns the user from sessionStorage after a non-remembered login', () => {
    login('librarian@library.com', 'Librarian@123', false);
    expect(getCurrentUser()?.email).toBe('librarian@library.com');
  });

  it('returns null when the stored session is corrupt JSON', () => {
    sessionStorage.setItem(SESSION_KEY, 'not json{');
    expect(getCurrentUser()).toBeNull();
  });
});

describe('updateCurrentUser', () => {
  it('updates the localStorage session when logged in via remember=true', () => {
    const { user } = login('admin@library.com', 'Admin@123', true);
    const updated = { ...user!, name: 'Updated Name' };
    updateCurrentUser(updated);
    expect(getCurrentUser()?.name).toBe('Updated Name');
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)!).name).toBe('Updated Name');
  });

  it('updates the sessionStorage session when logged in via remember=false', () => {
    const { user } = login('librarian@library.com', 'Librarian@123', false);
    const updated = { ...user!, name: 'New Librarian Name' };
    updateCurrentUser(updated);
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)!).name).toBe('New Librarian Name');
  });

  it('always updates the persisted user profile', () => {
    const { user } = login('admin@library.com', 'Admin@123', true);
    updateCurrentUser({ ...user!, phone: '0000000000' });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.user)!).phone).toBe('0000000000');
  });
});

describe('logout', () => {
  it('clears both localStorage and sessionStorage session keys', () => {
    login('admin@library.com', 'Admin@123', true);
    login('librarian@library.com', 'Librarian@123', false);
    logout();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(getCurrentUser()).toBeNull();
  });
});
