import { test as base, expect, type Page } from '@playwright/test';

export const ADMIN = { email: 'admin@library.com', password: 'Admin@123' };
export const LIBRARIAN = { email: 'librarian@library.com', password: 'Librarian@123' };

// Mirrors src/services/storage.ts STORAGE_KEYS — kept in sync manually since
// e2e tests run against the built app rather than importing its TS modules.
const STORAGE_KEYS = {
  books: 'library_books',
  members: 'library_members',
  issues: 'library_issues',
  categories: 'library_categories',
  user: 'library_user',
  activity: 'library_activity',
  seeded: 'library_seeded_v1',
};

type Fixtures = {
  loginAs: (email: string, password: string) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  loginAs: async ({ page }, use) => {
    await use(async (email: string, password: string) => {
      await page.goto('/login');
      await page.getByTestId('login-username').fill(email);
      await page.getByTestId('login-password').fill(password);
      await page.getByTestId('login-button').click();
      await expect(page.getByTestId('dashboard-page')).toBeVisible();
    });
  },
});

export { expect };

/** Ensures the app has run its first-load seed (30 books / 20 members / 20 issues / 9 categories). */
export async function ensureSeeded(page: Page) {
  await page.goto('/login');
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    STORAGE_KEYS.seeded
  );
}

/** Reads a JSON array out of localStorage by storage key. */
async function readKey<T>(page: Page, key: string): Promise<T[]> {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]'), key);
}

/** Overwrites a JSON array in localStorage by storage key. */
async function writeKey<T>(page: Page, key: string, value: T[]): Promise<void> {
  await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [key, value] as const);
}

/** Forces a book's availableCopies (and derived status) directly in storage, bypassing the UI. */
export async function setBookAvailability(page: Page, bookId: string, availableCopies: number) {
  const books = await readKey<any>(page, STORAGE_KEYS.books);
  const book = books.find((b: any) => b.id === bookId);
  if (book) {
    book.availableCopies = availableCopies;
    book.status = availableCopies > 0 ? 'Available' : 'Unavailable';
  }
  await writeKey(page, STORAGE_KEYS.books, books);
}

/**
 * Directly seeds `count` active (Issued) loans for the given member against the given book,
 * bypassing the UI, so tests can set up state (e.g. the 5-book limit) that would otherwise
 * require a long chain of prior UI actions.
 */
export async function seedActiveIssuesForMember(
  page: Page,
  memberId: string,
  bookId: string,
  count: number
): Promise<string[]> {
  const issues = await readKey<any>(page, STORAGE_KEYS.issues);
  const today = await page.evaluate(() => new Date().toISOString().slice(0, 10));
  const newIds: string[] = [];
  for (let i = 0; i < count; i++) {
    const id = `E2E-ISS-${memberId}-${i}`;
    newIds.push(id);
    issues.push({
      id,
      bookId,
      memberId,
      issueDate: today,
      dueDate: today,
      returnDate: null,
      status: 'Issued',
      fine: 0,
    });
  }
  await writeKey(page, STORAGE_KEYS.issues, issues);

  const members = await readKey<any>(page, STORAGE_KEYS.members);
  const member = members.find((m: any) => m.id === memberId);
  if (member) member.booksIssued = count;
  await writeKey(page, STORAGE_KEYS.members, members);

  return newIds;
}

/** Seeds a single overdue (unreturned, past due date) issue for the given book/member. */
export async function seedOverdueIssue(page: Page, id: string, bookId: string, memberId: string, daysOverdue: number) {
  const issues = await readKey<any>(page, STORAGE_KEYS.issues);
  const dueDate = await page.evaluate((d) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - d);
    return dt.toISOString().slice(0, 10);
  }, daysOverdue);
  issues.push({
    id,
    bookId,
    memberId,
    issueDate: dueDate,
    dueDate,
    returnDate: null,
    status: 'Overdue',
    fine: 0,
  });
  await writeKey(page, STORAGE_KEYS.issues, issues);
}
