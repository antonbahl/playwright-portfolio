import { test, expect } from '../../fixtures/test-fixtures';
import { CUSTOMER, PRODUCTS, TAX_RATE, money, round2 } from '../../fixtures/test-data';

test.describe('Checkout', () => {
  test.beforeEach(async ({ loggedInPage, cartPage }) => {
    await loggedInPage.addToCart(PRODUCTS.bikeLight.name);
    await expect(loggedInPage.cartBadge).toHaveText('1');
    await loggedInPage.openCart();
    await cartPage.checkout();
  });

  test('happy path: order is placed and the total matches the cart', async ({ page, checkoutPage }) => {
    await checkoutPage.placeOrder(CUSTOMER);
    await expect(page).toHaveURL(/\/complete$/);
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    const expectedTotal = round2(PRODUCTS.bikeLight.price * (1 + TAX_RATE));
    await expect(checkoutPage.orderTotal).toHaveText(money(expectedTotal));
  });

  const missing = [
    { field: 'firstName', error: 'Missing fields: firstName' },
    { field: 'lastName', error: 'Missing fields: lastName' },
    { field: 'postalCode', error: 'Missing fields: postalCode' },
  ] as const;

  for (const m of missing) {
    test(`shows validation error when ${m.field} is empty`, async ({ page, checkoutPage }) => {
      await checkoutPage.placeOrder({ ...CUSTOMER, [m.field]: '' });
      await expect(checkoutPage.error).toHaveText(m.error);
      await expect(page).toHaveURL(/\/checkout$/);
    });
  }

  test('whitespace-only name is treated as empty', async ({ checkoutPage }) => {
    await checkoutPage.placeOrder({ ...CUSTOMER, firstName: '   ' });
    await expect(checkoutPage.error).toHaveText('Missing fields: firstName');
  });
});
