import { test, expect, ADMIN } from './fixtures';

// TC-CAT-003, 005, 007, 008 from LibraryHub_Test_Case_Matrix.xlsx

test.describe('Categories', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs(ADMIN.email, ADMIN.password);
    await page.goto('/categories');
    await expect(page.getByTestId('categories-table')).toBeVisible();
  });

  test('TC-CAT-003: adding a new category with a valid name succeeds', async ({ page }) => {
    await page.getByTestId('add-category-button').click();
    await page.getByTestId('category-name').fill('Poetry E2E');
    await page.getByTestId('save-category-button').click();

    await expect(page.getByTestId('toast-success')).toBeVisible();
    await page.getByTestId('category-search').fill('Poetry E2E');
    await expect(page.getByTestId('categories-table')).toContainText('Poetry E2E');
  });

  test('TC-CAT-005: adding a category fails with a duplicate name (case-insensitive)', async ({ page }) => {
    await page.getByTestId('add-category-button').click();
    await page.getByTestId('category-name').fill('fiction'); // seeded category is "Fiction"
    await page.getByTestId('save-category-button').click();

    await expect(page.getByTestId('category-name-error')).toContainText('already exists');
  });

  test('TC-CAT-007: deleting an unused category succeeds', async ({ page }) => {
    await page.getByTestId('add-category-button').click();
    await page.getByTestId('category-name').fill('Unused E2E Category');
    await page.getByTestId('save-category-button').click();
    await expect(page.getByTestId('toast-success')).toBeVisible();

    const catId = await page.evaluate(
      () => JSON.parse(localStorage.getItem('library_categories')!).find((c: any) => c.name === 'Unused E2E Category').id
    );

    await page.getByTestId(`delete-category-${catId}`).click();
    await page.getByTestId('delete-category-dialog-confirm').click();

    await expect(page.getByTestId(`category-row-${catId}`)).not.toBeVisible();
  });

  test('TC-CAT-008: deleting a category with assigned books is blocked', async ({ page }) => {
    // CAT-01 "Fiction" has many seeded books assigned to it.
    await page.getByTestId('delete-category-CAT-01').click();
    await page.getByTestId('delete-category-dialog-confirm').click();

    await expect(page.getByTestId('toast-error')).toBeVisible();
    await expect(page.getByTestId('category-row-CAT-01')).toBeVisible();
  });
});
