import { test, expect, ADMIN, LIBRARIAN } from './fixtures';

// TC-LOGIN-001..010 from LibraryHub_Test_Case_Matrix.xlsx

test.describe('Login', () => {
  test('TC-LOGIN-001: successful login as Admin redirects to the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-username').fill(ADMIN.email);
    await page.getByTestId('login-password').fill(ADMIN.password);
    await page.getByTestId('login-button').click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    await expect(page.getByTestId('topbar-user-role')).toHaveText(/admin/i);
  });

  test('TC-LOGIN-002: successful login as Librarian redirects to the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-username').fill(LIBRARIAN.email);
    await page.getByTestId('login-password').fill(LIBRARIAN.password);
    await page.getByTestId('login-button').click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('topbar-user-role')).toHaveText(/librarian/i);
  });

  test('TC-LOGIN-003: login fails with an unregistered username', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-username').fill('nobody@library.com');
    await page.getByTestId('login-password').fill('WhateverPass1!');
    await page.getByTestId('login-button').click();

    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-LOGIN-004: login fails with an incorrect password', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-username').fill(ADMIN.email);
    await page.getByTestId('login-password').fill('WrongPassword1!');
    await page.getByTestId('login-button').click();

    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-LOGIN-005: validation error when username is left empty', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-password').fill(ADMIN.password);
    await page.getByTestId('login-button').click();

    await expect(page.getByTestId('login-username-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-LOGIN-006: validation error when password is left empty', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-username').fill(ADMIN.email);
    await page.getByTestId('login-button').click();

    await expect(page.getByTestId('login-password-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-LOGIN-010: logout returns the user to the Login page', async ({ page, loginAs }) => {
    await loginAs(ADMIN.email, ADMIN.password);

    await page.getByTestId('logout-button').click();
    await expect(page.getByTestId('confirm-logout-dialog')).toBeVisible();
    await page.getByTestId('confirm-logout-dialog-confirm').click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-form')).toBeVisible();
  });
});
