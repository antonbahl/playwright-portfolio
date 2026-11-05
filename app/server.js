// Demo shop used as the system under test.
// Plain Node.js (no dependencies): serves the UI from ./public and a small JSON API.
// In-memory data, so every server start is a clean state.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const USERS = {
  standard_user: { password: 'secret_sauce', locked: false },
  locked_user: { password: 'secret_sauce', locked: true },
};

const PRODUCTS = [
  { id: 1, name: 'Trail Backpack', price: 49.99, stock: 10 },
  { id: 2, name: 'Bike Light', price: 9.99, stock: 25 },
  { id: 3, name: 'Cotton T-Shirt', price: 15.99, stock: 0 },
  { id: 4, name: 'Fleece Jacket', price: 79.99, stock: 5 },
];

const TAX_RATE = 0.08;
const sessions = new Map(); // token -> { username, cart: Map(productId -> qty) }
const orders = [];

const round2 = (n) => Math.round(n * 100) / 100;

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve(null);
      }
    });
  });
}

function auth(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  return token ? sessions.get(token) : undefined;
}

function cartView(session) {
  const items = [...session.cart.entries()].map(([productId, quantity]) => {
    const p = PRODUCTS.find((x) => x.id === productId);
    return { productId, name: p.name, price: p.price, quantity, lineTotal: round2(p.price * quantity) };
  });
  const subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));
  const tax = round2(subtotal * TAX_RATE);
  return { items, subtotal, tax, total: round2(subtotal + tax) };
}

async function api(req, res, url) {
  const { pathname } = url;

  if (req.method === 'GET' && pathname === '/api/health') return send(res, 200, { status: 'ok' });

  if (req.method === 'POST' && pathname === '/api/login') {
    const body = await readJson(req);
    if (!body || !body.username || !body.password) return send(res, 400, { error: 'Username and password are required' });
    const user = USERS[body.username];
    if (!user || user.password !== body.password) return send(res, 401, { error: 'Username and password do not match' });
    if (user.locked) return send(res, 403, { error: 'This user has been locked out' });
    const token = crypto.randomUUID();
    sessions.set(token, { username: body.username, cart: new Map() });
    return send(res, 200, { token });
  }

  if (req.method === 'GET' && pathname === '/api/products') return send(res, 200, PRODUCTS);

  const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
  if (req.method === 'GET' && productMatch) {
    const p = PRODUCTS.find((x) => x.id === Number(productMatch[1]));
    return p ? send(res, 200, p) : send(res, 404, { error: 'Product not found' });
  }

  // Everything below needs a logged-in session.
  const session = auth(req);
  if (pathname.startsWith('/api/cart') || pathname.startsWith('/api/orders')) {
    if (!session) return send(res, 401, { error: 'Not authenticated' });
  }

  if (req.method === 'GET' && pathname === '/api/cart') return send(res, 200, cartView(session));

  if (req.method === 'POST' && pathname === '/api/cart') {
    const body = await readJson(req);
    const qty = body && body.quantity === undefined ? 1 : body && body.quantity;
    const p = body && PRODUCTS.find((x) => x.id === body.productId);
    if (!p) return send(res, 404, { error: 'Product not found' });
    if (!Number.isInteger(qty) || qty < 1) return send(res, 400, { error: 'Quantity must be a positive integer' });
    const next = (session.cart.get(p.id) || 0) + qty;
    if (next > p.stock) return send(res, 409, { error: 'Not enough stock' });
    session.cart.set(p.id, next);
    return send(res, 201, cartView(session));
  }

  const cartItem = pathname.match(/^\/api\/cart\/(\d+)$/);
  if (req.method === 'DELETE' && cartItem) {
    session.cart.delete(Number(cartItem[1]));
    return send(res, 200, cartView(session));
  }

  if (req.method === 'POST' && pathname === '/api/orders') {
    const body = await readJson(req);
    const missing = ['firstName', 'lastName', 'postalCode'].filter((f) => !body || !String(body[f] || '').trim());
    if (missing.length) return send(res, 400, { error: `Missing fields: ${missing.join(', ')}` });
    if (session.cart.size === 0) return send(res, 400, { error: 'Cart is empty' });
    const view = cartView(session);
    for (const item of view.items) PRODUCTS.find((x) => x.id === item.productId).stock -= item.quantity;
    const order = { id: orders.length + 1, ...view, customer: { firstName: body.firstName, lastName: body.lastName } };
    orders.push(order);
    session.cart.clear();
    return send(res, 201, order);
  }

  return send(res, 404, { error: 'Not found' });
}

function serveStatic(res, pathname) {
  const routes = { '/': 'login.html', '/inventory': 'inventory.html', '/cart': 'cart.html', '/checkout': 'checkout.html', '/complete': 'complete.html' };
  const file = routes[pathname] || pathname.slice(1);
  const full = path.join(PUBLIC_DIR, path.normalize(file));
  if (!full.startsWith(PUBLIC_DIR) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found');
  }
  const type = full.endsWith('.js') ? 'text/javascript' : full.endsWith('.css') ? 'text/css' : 'text/html';
  res.writeHead(200, { 'Content-Type': type });
  fs.createReadStream(full).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) return api(req, res, url);
  return serveStatic(res, url.pathname);
});

server.listen(PORT, () => console.log(`Demo shop running on http://localhost:${PORT}`));
