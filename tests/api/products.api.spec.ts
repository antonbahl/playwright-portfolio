import { test, expect } from '../../fixtures/test-fixtures';
import { PRODUCTS } from '../../fixtures/test-data';

test.describe('API: products', () => {
  test('GET /api/products returns all products with a valid shape', async ({ request }) => {
    const res = await request.get('/api/products');
    expect(res.status()).toBe(200);
    const products = await res.json();
    expect(products).toHaveLength(4);
    for (const p of products) {
      expect(p).toEqual({
        id: expect.any(Number),
        name: expect.any(String),
        price: expect.any(Number),
        stock: expect.any(Number),
      });
      expect(p.price).toBeGreaterThan(0);
      expect(p.stock).toBeGreaterThanOrEqual(0);
    }
  });

  test('GET /api/products/:id returns one product', async ({ request }) => {
    const res = await request.get(`/api/products/${PRODUCTS.backpack.id}`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ id: PRODUCTS.backpack.id, name: PRODUCTS.backpack.name, price: PRODUCTS.backpack.price });
  });

  test('GET /api/products/:id returns 404 for an unknown id', async ({ request }) => {
    const res = await request.get('/api/products/9999');
    expect(res.status()).toBe(404);
  });
});
