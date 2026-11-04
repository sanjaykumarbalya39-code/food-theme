const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const memory = () => {
  const map = new Map();
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: key => map.delete(key) };
};
const context = {
  crypto: webcrypto, TextEncoder, localStorage: memory(), sessionStorage: memory(),
  window: { addEventListener() {}, dispatchEvent() {} }, document: { querySelectorAll: () => [] },
  Event: class { constructor(type) { this.type = type; } }
};
vm.createContext(context);
for (const file of ['account-store.js', 'menu-data.js', 'cart-store.js', 'booking-store.js', 'order-store.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
}
(async () => {
  const { StacklyAccounts: accounts, StacklyCart: cart, StacklyBookings: bookings, StacklyOrders: orders } = context.window;
  await accounts.register({ name: 'Asha Kumar', email: 'asha@example.com', password: 'Password123!' });
  await accounts.register({ name: 'Ravi Shah', email: 'ravi@example.com', password: 'Password456!' });
  await accounts.login({ email: 'asha@example.com', password: 'Password123!' });
  accounts.updateProfile({ name: 'Asha K', phone: '9876543210' });
  assert.equal(accounts.current().name, 'Asha K');
  assert.equal(accounts.current().email, 'asha@example.com');
  assert.equal(accounts.current().phone, '9876543210');
  assert.throws(() => accounts.updateProfile({ name: 'A', phone: '' }), /name/);
  assert.throws(() => accounts.updateProfile({ name: 'Asha', phone: '123' }), /mobile/);
  cart.add('pasta');
  bookings.add({ restaurantId: 'sattva', date: '2099-12-15', time: '18:00', guests: 2 });
  orders.add({ id: 'DEMO-asha-1', type: 'delivery', payment: 'cash', total: cart.totals().total, items: cart.items(), address: 'Do not persist' });
  const favouritesKey = accounts.storageKey('faaaahh-saved-dishes');
  context.localStorage.setItem(favouritesKey, '["pasta"]');
  assert.equal(JSON.stringify(orders.list()).includes('Do not persist'), false);
  assert.equal(orders.list()[0].charged, 0);
  accounts.logout();
  await accounts.login({ email: 'ravi@example.com', password: 'Password456!' });
  assert.equal(accounts.current().name, 'Ravi Shah');
  assert.equal(accounts.current().phone, '');
  assert.equal(cart.count(), 0);
  assert.equal(bookings.list().length, 0);
  assert.equal(orders.list().length, 0);
  assert.notEqual(accounts.storageKey('faaaahh-saved-dishes'), favouritesKey);
  cart.add('pizza');
  orders.add({ id: 'DEMO-ravi-1', type: 'dinein', payment: 'upi', total: 10000, items: cart.items() });
  accounts.logout();
  await accounts.login({ email: 'asha@example.com', password: 'Password123!' });
  assert.equal(accounts.current().name, 'Asha K');
  assert.equal(cart.items()[0].id, 'pasta');
  assert.equal(bookings.list().length, 1);
  assert.equal(orders.list().length, 1);
  assert.equal(orders.list()[0].id, 'DEMO-asha-1');
  assert.equal(context.localStorage.getItem(accounts.storageKey('faaaahh-saved-dishes')), '["pasta"]');
  accounts.logout();
  assert.equal(accounts.current(), null);
  assert.throws(() => accounts.updateProfile({ name: 'Nobody' }), /log in/);
  // Reproduce selections made before login: merge once without losing account data.
  cart.add('pizza');
  context.localStorage.setItem('faaaahh-saved-dishes', '["berry","pasta"]');
  await accounts.login({ email: 'asha@example.com', password: 'Password123!' });
  assert.equal(cart.count(), 2);
  assert.equal(context.localStorage.getItem('stackly-cart-v1'), null);
  const saved = JSON.parse(context.localStorage.getItem(accounts.storageKey('faaaahh-saved-dishes')));
  assert.deepEqual(saved.sort(), ['berry','pasta']);
  assert.equal(context.localStorage.getItem('faaaahh-saved-dishes'), null);
  assert.equal(cart.count(), 2, 'Repeated dashboard reads must not duplicate guest items');
  accounts.logout();
  await accounts.login({ email: 'ravi@example.com', password: 'Password456!' });
  assert.equal(cart.count(), 1, 'Guest migration must not leak into the next account');
  assert.equal(context.localStorage.getItem(accounts.storageKey('faaaahh-saved-dishes')), null);
  console.log('Passed profile persistence, login identity, account isolation for cart/bookings/favourites/orders, and receipt privacy.');
})().catch(error => { console.error(error); process.exitCode = 1; });
