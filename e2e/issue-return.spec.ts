import { test, expect, ADMIN, seedActiveIssuesForMember, seedOverdueIssue } from './fixtures';

// TC-ISSUE-001..004, TC-RETURN-001, 002, 005 from LibraryHub_Test_Case_Matrix.xlsx
// Fresh seed facts relied on below (see src/data/seedData.ts):
//   BK-002 "To Kill a Mockingbird" -> 4/4 copies available
//   BK-008 "The Hobbit"            -> 0/5 copies available (fully issued out)
//   MEM-002 "Isha Verma"           -> Active, 0 books currently issued
//   MEM-003 "Rohan Iyer"           -> Active, 0 books currently issued

test.describe('Issue Book', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs(ADMIN.email, ADMIN.password);
  });

  test('TC-ISSUE-001/002: issuing an available book decrements availability and increments the member\'s loan count', async ({ page }) => {
    await page.goto('/issue-book');
    await page.getByTestId('issue-select-member').selectOption('MEM-002');
    await page.getByTestId('issue-select-book').selectOption('BK-002');
    await page.getByTestId('issue-book-button').click();

    await expect(page.getByTestId('confirm-issue-dialog')).toBeVisible();
    await page.getByTestId('confirm-issue-dialog-confirm').click();
    await expect(page.getByTestId('toast-success')).toBeVisible();

    const [book, member] = await Promise.all([
      page.evaluate(() => JSON.parse(localStorage.getItem('library_books')!).find((b: any) => b.id === 'BK-002')),
      page.evaluate(() => JSON.parse(localStorage.getItem('library_members')!).find((m: any) => m.id === 'MEM-002')),
    ]);
    expect(book.availableCopies).toBe(3);
    expect(member.booksIssued).toBe(1);
  });

  test('TC-ISSUE-003: cannot issue a book with zero available copies', async ({ page }) => {
    await page.goto('/issue-book');
    await page.getByTestId('issue-select-member').selectOption('MEM-002');
    await page.getByTestId('issue-select-book').selectOption('BK-008');
    await page.getByTestId('issue-book-button').click();

    await expect(page.getByTestId('issue-book-error')).toContainText('no available copies');
    await expect(page.getByTestId('confirm-issue-dialog')).not.toBeVisible();
  });

  test('TC-ISSUE-004: cannot issue to a member who already has the maximum of 5 books', async ({ page }) => {
    await seedActiveIssuesForMember(page, 'MEM-003', 'BK-002', 5);
    await page.goto('/issue-book');
    await page.getByTestId('issue-select-member').selectOption('MEM-003');
    await page.getByTestId('issue-select-book').selectOption('BK-002');
    await page.getByTestId('issue-book-button').click();

    await expect(page.getByTestId('issue-member-error')).toContainText('maximum allowed');
  });
});

test.describe('Return Books', () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs(ADMIN.email, ADMIN.password);
  });

  test('TC-RETURN-001: returning a book on or before its due date applies no fine', async ({ page }) => {
    // MEM-002 already has a seeded (Returned) issue, so use the freshly-created id directly
    // rather than re-querying by memberId, which would ambiguously match the old one too.
    const [issueId] = await seedActiveIssuesForMember(page, 'MEM-002', 'BK-002', 1); // due date defaults to today -> not overdue

    await page.goto('/return-books');
    await page.getByTestId(`return-book-button-${issueId}`).click();
    await expect(page.getByTestId('confirm-return-dialog')).toContainText('No fine will be applied.');
    await page.getByTestId('confirm-return-dialog-confirm').click();

    await expect(page.getByTestId('toast-success')).toContainText('right on time');
    const returnedIssue = await page.evaluate(
      (id) => JSON.parse(localStorage.getItem('library_issues')!).find((i: any) => i.id === id),
      issueId
    );
    expect(returnedIssue.status).toBe('Returned');
    expect(returnedIssue.fine).toBe(0);
  });

  test('TC-RETURN-002: returning an overdue book calculates and applies the correct fine', async ({ page }) => {
    await seedOverdueIssue(page, 'E2E-OVERDUE-1', 'BK-002', 'MEM-002', 5); // 5 days overdue -> Rs.50 fine

    await page.goto('/return-books');
    await page.getByTestId('return-book-button-E2E-OVERDUE-1').click();
    await expect(page.getByTestId('confirm-return-dialog')).toContainText('A fine of ₹50 will be applied');
    await page.getByTestId('confirm-return-dialog-confirm').click();

    await expect(page.getByTestId('toast-success')).toContainText('₹50');
    const returnedIssue = await page.evaluate(
      () => JSON.parse(localStorage.getItem('library_issues')!).find((i: any) => i.id === 'E2E-OVERDUE-1')
    );
    expect(returnedIssue.status).toBe('Returned');
    expect(returnedIssue.fine).toBe(50);
  });

  test('TC-RETURN-005: cancelling the return confirmation makes no changes', async ({ page }) => {
    await seedOverdueIssue(page, 'E2E-OVERDUE-2', 'BK-002', 'MEM-002', 3);

    await page.goto('/return-books');
    await page.getByTestId('return-book-button-E2E-OVERDUE-2').click();
    await page.getByTestId('confirm-return-dialog-cancel').click();

    await expect(page.getByTestId('confirm-return-dialog')).not.toBeVisible();
    await expect(page.getByTestId('return-row-E2E-OVERDUE-2')).toBeVisible();
    const issue = await page.evaluate(
      () => JSON.parse(localStorage.getItem('library_issues')!).find((i: any) => i.id === 'E2E-OVERDUE-2')
    );
    expect(issue.status).toBe('Overdue');
  });
});
