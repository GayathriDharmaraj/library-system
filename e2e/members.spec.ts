import { test, expect, ADMIN } from './fixtures';

// TC-MEM-001, 007, 009, 010, 012 from LibraryHub_Test_Case_Matrix.xlsx

test.describe('Members', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs(ADMIN.email, ADMIN.password);
    await page.goto('/members');
    await expect(page.getByTestId('members-table')).toBeVisible();
  });

  test('TC-MEM-001: members table lists registered members', async ({ page }) => {
    await expect(page.getByTestId('member-row-MEM-001')).toBeVisible();
  });

  test('TC-MEM-007: registering a new member with valid data succeeds', async ({ page }) => {
    await page.getByTestId('add-member-button').click();
    await page.getByTestId('member-first-name').fill('Ishaan');
    await page.getByTestId('member-last-name').fill('Kapoor');
    await page.getByTestId('member-email').fill('ishaan.kapoor.e2e@mail.com');
    await page.getByTestId('member-phone').fill('9876500001');
    await page.getByTestId('member-dob').fill('1998-06-15');
    await page.getByTestId('member-address').fill('42 Test Lane, Bengaluru, KA');
    await page.getByTestId('member-membership-expiry').fill('2028-01-01');
    await page.getByTestId('save-member-button').click();

    await expect(page.getByTestId('toast-success')).toBeVisible();
    await page.getByTestId('member-search').fill('Ishaan Kapoor');
    await expect(page.getByTestId('members-table')).toContainText('Ishaan Kapoor');
  });

  test('TC-MEM-009: registering a member fails with a duplicate email', async ({ page }) => {
    await page.getByTestId('add-member-button').click();
    await page.getByTestId('member-first-name').fill('Duplicate');
    await page.getByTestId('member-last-name').fill('Email');
    await page.getByTestId('member-email').fill('aarav.sharma@mail.com'); // MEM-001's seeded email
    await page.getByTestId('member-phone').fill('9876500002');
    await page.getByTestId('member-dob').fill('1998-06-15');
    await page.getByTestId('member-address').fill('42 Test Lane, Bengaluru, KA');
    await page.getByTestId('member-membership-expiry').fill('2028-01-01');
    await page.getByTestId('save-member-button').click();

    await expect(page.getByTestId('member-email-error')).toContainText('already exists');
  });

  test('TC-MEM-010: editing an existing member updates their details', async ({ page }) => {
    await page.getByTestId('edit-member-MEM-001').click();
    await page.getByTestId('member-phone').fill('9999900001');
    await page.getByTestId('save-member-button').click();

    await expect(page.getByTestId('toast-success')).toBeVisible();
    const updatedPhone = await page.evaluate(
      () => JSON.parse(localStorage.getItem('library_members')!).find((m: any) => m.id === 'MEM-001').phone
    );
    expect(updatedPhone).toBe('9999900001');
  });

  test('TC-MEM-012: deleting a newly registered member removes them after confirmation', async ({ page }) => {
    await page.getByTestId('add-member-button').click();
    await page.getByTestId('member-first-name').fill('ToDelete');
    await page.getByTestId('member-last-name').fill('Member');
    await page.getByTestId('member-email').fill('todelete.member.e2e@mail.com');
    await page.getByTestId('member-phone').fill('9876500003');
    await page.getByTestId('member-dob').fill('1998-06-15');
    await page.getByTestId('member-address').fill('42 Test Lane, Bengaluru, KA');
    await page.getByTestId('member-membership-expiry').fill('2028-01-01');
    await page.getByTestId('save-member-button').click();
    await expect(page.getByTestId('toast-success')).toBeVisible();

    const memberId = await page.evaluate(
      () => JSON.parse(localStorage.getItem('library_members')!).find((m: any) => m.email === 'todelete.member.e2e@mail.com').id
    );

    await page.getByTestId(`delete-member-${memberId}`).click();
    await expect(page.getByTestId('delete-member-dialog')).toBeVisible();
    await page.getByTestId('delete-member-dialog-confirm').click();

    await expect(page.getByTestId(`member-row-${memberId}`)).not.toBeVisible();
  });
});
