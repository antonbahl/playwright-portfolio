import { test, expect } from '../../fixtures/test-fixtures';
import { PRODUCTS, TAX_RATE, money, round2 } from '../../fixtures/test-data';

test.describe('Cart', () => {
  test('cart badge counts added items', async ({ loggedInPage }) => {
    await loggedInPage.addToCart(PRODUCTS.backpack.name);
    await expect(loggedInPage.cartBadge).toHaveText('1');
    await loggedInPage.addToCart(PRODUCTS.bikeLight.name);
    await expect(loggedInPage.cartBadge).toHaveText('2');
  });

  test('out-of-stock product cannot be added', async ({ loggedInPage }) => {
    const button = loggedInPage.addToCartButton(PRODUCTS.tShirt.name);
    await expect(button).toBeDisabled();
    await expect(button).toHaveText('Out of stock');
  });

  test('cart shows correct subtotal, tax and total', async ({ loggedInPage, cartPage }) => {
    await loggedInPage.addToCart(PRODUCTS.backpack.name);
    await loggedInPage.addToCart(PRODUCTS.bikeLight.name);
    await loggedInPage.addToCart(PRODUCTS.bikeLight.name);
    await expect(loggedInPage.cartBadge).toHaveText('3');
    await loggedInPage.openCart();

    const subtotal = round2(PRODUCTS.backpack.price + 2 * PRODUCTS.bikeLight.price);
    const tax = round2(subtotal * TAX_RATE);

    await expect(cartPage.items).toHaveCount(2);
    await expect(cartPage.item(PRODUCTS.bikeLight.name).getByTestId('item-qty')).toHaveText('x2');
    await expect(cartPage.subtotal).toHaveText(money(subtotal));
    await expect(cartPage.tax).toHaveText(money(tax));
    await expect(cartPage.total).toHaveText(money(round2(subtotal + tax)));
  });

  test('removing the last item empties the cart and disables checkout', async ({ loggedInPage, cartPage }) => {
    await loggedInPage.addToCart(PRODUCTS.backpack.name);
    await expect(loggedInPage.cartBadge).toHaveText('1');
    await loggedInPage.openCart();
    await cartPage.remove(PRODUCTS.backpack.name);
    await expect(cartPage.items).toHaveCount(0);
    await expect(cartPage.total).toHaveText('$0.00');
    await expect(cartPage.checkoutButton).toBeDisabled();
  });
});
