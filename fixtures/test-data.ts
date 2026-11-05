export const USERS = {
  standard: { username: 'standard_user', password: 'secret_sauce' },
  locked: { username: 'locked_user', password: 'secret_sauce' },
} as const;

export const PRODUCTS = {
  backpack: { id: 1, name: 'Trail Backpack', price: 49.99 },
  bikeLight: { id: 2, name: 'Bike Light', price: 9.99 },
  tShirt: { id: 3, name: 'Cotton T-Shirt', price: 15.99 }, // out of stock
  jacket: { id: 4, name: 'Fleece Jacket', price: 79.99, stock: 5 },
} as const;

export const TAX_RATE = 0.08;

export const CUSTOMER = { firstName: 'Ada', lastName: 'Lovelace', postalCode: '60601' };

export const money = (n: number) => `$${n.toFixed(2)}`;
export const round2 = (n: number) => Math.round(n * 100) / 100;
