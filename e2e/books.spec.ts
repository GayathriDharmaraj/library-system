import { test, expect, ADMIN, seedActiveIssuesForMember } from './fixtures';

// TC-BOOK-001, 002, 013, 014, 015, 017, 018, 019 from LibraryHub_Test_Case_Matrix.xlsx

test.describe('Books', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs(ADMIN.email, ADMIN.password);
    await page.goto('/books');
    await expect(page.getByTestId('books-table')).toBeVisible();
  });

  test('TC-BOOK-001: books table lists the catalog', async ({ page }) => {
    await page.getByTestId('books-search').fill('Gatsby');
    await expect(page.getByTestId('book-row-BK-001')).toBeVisible();
    await expect(page.getByTestId('book-row-BK-001')).toContainText('The Great Gatsby');
  });

  test('TC-BOOK-002: search by title filters the list', async ({ page }) => {
    await page.getByTestId('books-search').fill('Gatsby');
    await expect(page.getByTestId('book-row-BK-001')).toBeVisible();
    await expect(page.getByTestId('book-row-BK-002')).not.toBeVisible();
  });

  test('TC-BOOK-013: adding a new book with valid data succeeds', async ({ page }) => {
    await page.getByTestId('add-book-button').click();
    await expect(page.getByRole('heading', { name: 'Add Book' })).toBeVisible();

    await page.getByTestId('book-isbn').fill('9781111111116');
    await page.getByTestId('book-title').fill('E2E Test Title');
    await page.getByTestId('book-author').fill('E2E Test Author');
    await page.getByTestId('book-category').selectOption('Fiction');
    await page.getByTestId('book-publisher').fill('E2E Publishing House');
    await page.getByTestId('book-published-year').fill('2020');
    await page.getByTestId('book-total-copies').fill('4');
    await page.getByTestId('save-book-button').click();

    await expect(page.getByTestId('toast-success')).toContainText('E2E Test Title');
    await page.getByTestId('books-search').fill('E2E Test Title');
    await expect(page.getByTestId('books-table')).toContainText('E2E Test Title');
  });

  test('TC-BOOK-014: adding a book fails validation when required fields are empty', async ({ page }) => {
    await page.getByTestId('add-book-button').click();
    await page.getByTestId('save-book-button').click();

    await expect(page.getByTestId('book-isbn-error')).toBeVisible();
    await expect(page.getByTestId('book-title-error')).toBeVisible();
    await expect(page.getByTestId('book-author-error')).toBeVisible();
    await expect(page.getByTestId('book-category-error')).toBeVisible();
    await expect(page.getByTestId('book-publisher-error')).toBeVisible();
    await expect(page.getByTestId('book-published-year-error')).toBeVisible();
    await expect(page.getByTestId('book-total-copies-error')).toBeVisible();
  });

  test('TC-BOOK-015: adding a book fails with a duplicate ISBN', async ({ page }) => {
    await page.getByTestId('add-book-button').click();
    await page.getByTestId('book-isbn').fill('9780743273565'); // The Great Gatsby's seeded ISBN
    await page.getByTestId('book-title').fill('Duplicate ISBN Test');
    await page.getByTestId('book-author').fill('Someone');
    await page.getByTestId('book-category').selectOption('Fiction');
    await page.getByTestId('book-publisher').fill('Someone Press');
    await page.getByTestId('book-published-year').fill('2020');
    await page.getByTestId('book-total-copies').fill('2');
    await page.getByTestId('save-book-button').click();

    await expect(page.getByTestId('book-isbn-error')).toContainText('already exists');
  });

  test('TC-BOOK-017: editing an existing book updates its details', async ({ page }) => {
    const [totalBefore, availableBefore] = await Promise.all([
      page.evaluate(() => JSON.parse(localStorage.getItem('library_books')!).find((b: any) => b.id === 'BK-001').totalCopies),
      page.evaluate(() => JSON.parse(localStorage.getItem('library_books')!).find((b: any) => b.id === 'BK-001').availableCopies),
    ]);
    const issuedCount = totalBefore - availableBefore;

    await page.getByTestId('books-search').fill('Gatsby');
    await page.getByTestId('edit-book-BK-001').click();
    await expect(page.getByRole('heading', { name: 'Edit Book' })).toBeVisible();
    await expect(page.getByTestId('book-title')).toHaveValue('The Great Gatsby');

    await page.getByTestId('book-total-copies').fill(String(totalBefore + 5));
    await page.getByTestId('save-book-button').click();

    await expect(page.getByTestId('toast-success')).toContainText('was updated');
    const updatedAvailable = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('library_books')!).find((b: any) => b.id === 'BK-001').availableCopies
    );
    expect(updatedAvailable).toBe(totalBefore + 5 - issuedCount);
  });

  test('TC-BOOK-018: delete confirmation warns when the book has active issues', async ({ page }) => {
    await seedActiveIssuesForMember(page, 'MEM-002', 'BK-002', 1);
    await page.reload();
    await page.getByTestId('books-search').fill('Mockingbird');
    await page.getByTestId('delete-book-BK-002').click();
    await expect(page.getByTestId('delete-book-dialog')).toContainText('has copies currently issued');
    await page.getByTestId('delete-book-dialog-cancel').click();
  });

  test('TC-BOOK-019: deleting a newly added book removes it after confirmation', async ({ page }) => {
    await page.getByTestId('add-book-button').click();
    await page.getByTestId('book-isbn').fill('9782222222225');
    await page.getByTestId('book-title').fill('Book To Delete');
    await page.getByTestId('book-author').fill('E2E Author');
    await page.getByTestId('book-category').selectOption('Fiction');
    await page.getByTestId('book-publisher').fill('E2E Press');
    await page.getByTestId('book-published-year').fill('2021');
    await page.getByTestId('book-total-copies').fill('1');
    await page.getByTestId('save-book-button').click();
    await expect(page.getByTestId('toast-success')).toContainText('Book To Delete');

    const bookId = await page.evaluate(
      () => JSON.parse(localStorage.getItem('library_books')!).find((b: any) => b.title === 'Book To Delete').id
    );

    await page.getByTestId(`delete-book-${bookId}`).click();
    await expect(page.getByTestId('delete-book-dialog')).toContainText('will be permanently removed');
    await page.getByTestId('delete-book-dialog-confirm').click();

    await expect(page.getByTestId(`book-row-${bookId}`)).not.toBeVisible();
  });
});
