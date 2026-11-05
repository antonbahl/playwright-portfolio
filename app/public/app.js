// Small shared helpers for the demo shop pages.
const api = async (method, url, body) => {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
};

const requireLogin = () => {
  if (!localStorage.getItem('token')) location.href = '/';
};

const money = (n) => `$${n.toFixed(2)}`;

const logout = () => {
  localStorage.removeItem('token');
  location.href = '/';
};

const renderCartBadge = async () => {
  const { data } = await api('GET', '/api/cart');
  const count = data.items.reduce((s, i) => s + i.quantity, 0);
  const badge = document.querySelector('[data-test="cart-badge"]');
  if (badge) badge.textContent = count ? String(count) : '';
};
