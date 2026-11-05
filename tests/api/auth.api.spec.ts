import { test, expect } from '../../fixtures/test-fixtures';
import { USERS } from '../../fixtures/test-data';

test.describe('API: authentication', () => {
  test('POST /api/login returns a token for a valid user', async ({ request }) => {
    const res = await request.post('/api/login', { data: USERS.standard });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('POST /api/login returns 401 for a wrong password', async ({ request }) => {
    const res = await request.post('/api/login', { data: { ...USERS.standard, password: 'wrong' } });
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: 'Username and password do not match' });
  });

  test('POST /api/login returns 403 for a locked user', async ({ request }) => {
    const res = await request.post('/api/login', { data: USERS.locked });
    expect(res.status()).toBe(403);
  });

  test('POST /api/login returns 400 when fields are missing', async ({ request }) => {
    const res = await request.post('/api/login', { data: { username: 'standard_user' } });
    expect(res.status()).toBe(400);
  });

  test('cart endpoints reject requests without a token', async ({ request }) => {
    expect((await request.get('/api/cart')).status()).toBe(401);
    expect((await request.post('/api/cart', { data: { productId: 1 } })).status()).toBe(401);
    expect((await request.post('/api/orders', { data: {} })).status()).toBe(401);
  });

  test('cart endpoints reject an invalid token', async ({ request }) => {
    const res = await request.get('/api/cart', { headers: { Authorization: 'Bearer not-a-real-token' } });
    expect(res.status()).toBe(401);
  });
});
