import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { USERS } from './test-data';

type Fixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  /** Logs in through the API and stores the token, so UI tests start on the product page. */
  loggedInPage: InventoryPage;
  /** API client already authenticated as the standard user. */
  authedApi: APIRequestContext;
};

async function apiLogin(request: APIRequestContext): Promise<string> {
  const res = await request.post('/api/login', { data: USERS.standard });
  expect(res.status()).toBe(200);
  return (await res.json()).token;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),

  loggedInPage: async ({ page, request }, use) => {
    // Faster and more stable than clicking through the login form in every test.
    const token = await apiLogin(request);
    await page.addInitScript((t) => window.localStorage.setItem('token', t), token);
    await page.goto('/inventory');
    const inventory = new InventoryPage(page);
    await inventory.expectLoaded();
    await use(inventory);
  },

  authedApi: async ({ playwright, baseURL }, use) => {
    const anon = await playwright.request.newContext({ baseURL });
    const token = await apiLogin(anon);
    await anon.dispose();
    const ctx = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });
    await use(ctx);
    await ctx.dispose();
  },
});

export { expect };
