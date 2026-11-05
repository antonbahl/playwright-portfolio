import { test, expect } from '../../fixtures/test-fixtures';
import { CUSTOMER, PRODUCTS, TAX_RATE, round2 } from '../../fixtures/test-data';

test.describe('API: cart and orders', () => {
  test('adding items updates line totals, tax and total', async ({ authedApi }) => {
    await authedApi.post('/api/cart', { data: { productId: PRODUCTS.backpack.id, quantity: 1 } });
    const res = await authedApi.post('/api/cart', { data: { productId: PRODUCTS.bikeLight.id, quantity: 3 } });
    expect(res.status()).toBe(201);

    const cart = await res.json();
    const subtotal = round2(PRODUCTS.backpack.price + 3 * PRODUCTS.bikeLight.price);
    const tax = round2(subtotal * TAX_RATE);
    expect(cart.items).toHaveLength(2);
    expect(cart.subtotal).toBe(subtotal);
    expect(cart.tax).toBe(tax);
    expect(cart.total).toBe(round2(subtotal + tax));
  });

  test('adding the same product twice merges the quantity', async ({ authedApi }) => {
    await authedApi.post('/api/cart', { data: { productId: PRODUCTS.bikeLight.id, quantity: 1 } });
    const cart = await (await authedApi.post('/api/cart', { data: { productId: PRODUCTS.bikeLight.id, quantity: 2 } })).json();
    expect(cart.items).toEqual([expect.objectContaining({ productId: PRODUCTS.bikeLight.id, quantity: 3 })]);
  });

  const badQuantities = [0, -1, 1.5, 'two'];
  for (const quantity of badQuantities) {
    test(`rejects invalid quantity: ${JSON.stringify(quantity)}`, async ({ authedApi }) => {
      const res = await authedApi.post('/api/cart', { data: { productId: PRODUCTS.backpack.id, quantity } });
      expect(res.status()).toBe(400);
    });
  }

  test('cannot add more than the available stock', async ({ authedApi }) => {
    const res = await authedApi.post('/api/cart', { data: { productId: PRODUCTS.jacket.id, quantity: PRODUCTS.jacket.stock + 1 } });
    expect(res.status()).toBe(409);
    const cart = await (await authedApi.get('/api/cart')).json();
    expect(cart.items).toHaveLength(0);
  });

  test('cannot add an out-of-stock product', async ({ authedApi }) => {
    const res = await authedApi.post('/api/cart', { data: { productId: PRODUCTS.tShirt.id } });
    expect(res.status()).toBe(409);
  });

  test('order with an empty cart is rejected', async ({ authedApi }) => {
    const res = await authedApi.post('/api/orders', { data: CUSTOMER });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe('Cart is empty');
  });

  test('placing an order returns the order and empties the cart', async ({ authedApi }) => {
    await authedApi.post('/api/cart', { data: { productId: PRODUCTS.bikeLight.id, quantity: 2 } });
    const res = await authedApi.post('/api/orders', { data: CUSTOMER });
    expect(res.status()).toBe(201);

    const order = await res.json();
    const subtotal = round2(2 * PRODUCTS.bikeLight.price);
    expect(order).toMatchObject({
      id: expect.any(Number),
      subtotal,
      total: round2(subtotal * (1 + TAX_RATE)),
      customer: { firstName: CUSTOMER.firstName, lastName: CUSTOMER.lastName },
    });

    const cart = await (await authedApi.get('/api/cart')).json();
    expect(cart.items).toHaveLength(0);
  });

  test('each session has its own cart', async ({ authedApi, playwright, baseURL }) => {
    await authedApi.post('/api/cart', { data: { productId: PRODUCTS.backpack.id } });

    const other = await playwright.request.newContext({ baseURL });
    const { token } = await (await other.post('/api/login', { data: { username: 'standard_user', password: 'secret_sauce' } })).json();
    const cart = await (await other.get('/api/cart', { headers: { Authorization: `Bearer ${token}` } })).json();
    expect(cart.items).toHaveLength(0);
    await other.dispose();
  });
});
