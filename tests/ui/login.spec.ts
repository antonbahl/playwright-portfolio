import { test, expect } from '../../fixtures/test-fixtures';
import { USERS } from '../../fixtures/test-data';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard user can log in and sees the product list', async ({ loginPage, inventoryPage }) => {
    await loginPage.login(USERS.standard.username, USERS.standard.password);
    await inventoryPage.expectLoaded();
    await expect(inventoryPage.items).toHaveCount(4);
  });

  test('locked user gets a clear error and stays on the login page', async ({ page, loginPage }) => {
    await loginPage.login(USERS.locked.username, USERS.locked.password);
    await loginPage.expectError('This user has been locked out');
    await expect(page).toHaveURL(/\/$/);
  });

  const invalid = [
    { title: 'wrong password', username: USERS.standard.username, password: 'wrong', error: 'Username and password do not match' },
    { title: 'unknown user', username: 'nobody', password: 'secret_sauce', error: 'Username and password do not match' },
    { title: 'empty fields', username: '', password: '', error: 'Username and password are required' },
  ];

  for (const c of invalid) {
    test(`rejects login: ${c.title}`, async ({ loginPage }) => {
      await loginPage.login(c.username, c.password);
      await loginPage.expectError(c.error);
    });
  }

  test('protected page redirects to login when not logged in', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page).toHaveURL(/\/$/);
  });

  test('logout returns to the login page', async ({ page, loggedInPage }) => {
    await loggedInPage.logoutButton.click();
    await expect(page).toHaveURL(/\/$/);
  });
});
