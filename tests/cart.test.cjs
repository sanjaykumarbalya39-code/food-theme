const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const storage = new Map();
const badges = [{ textContent: '' }];
const events = [];
const context = {
  window: { dispatchEvent: event => events.push(event.type), addEventListener() {} },
  document: { querySelectorAll: selector => selector === '.cart-count' ? badges : [] },
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  Event: class { constructor(type) { this.type = type; } }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'menu-data.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'cart-store.js'), 'utf8'), context);
const cart = context.window.StacklyCart;
assert.equal(cart.count(), 0);
assert.equal(cart.totals().total, 0);
cart.add('pasta'); // INR 320
assert.equal(cart.count(), 1);
assert.equal(badges[0].textContent, 1);
let total = cart.totals('delivery');
assert.equal(total.subtotal, 32000);
assert.equal(total.packing, 2000);
assert.equal(total.platform, 500);
assert.equal(total.delivery, 4000);
assert.equal(total.tax, 1600);
assert.equal(total.total, 40100);
total = cart.totals('delivery', 'WELCOME10');
assert.equal(total.discount, 3200);
assert.equal(total.tax, 1440);
assert.equal(total.total, 36740);
total = cart.totals('dinein', 'WELCOME10');
assert.equal(total.packing, 0);
assert.equal(total.delivery, 0);
assert.equal(total.total, 30740);
cart.setQuantity('pasta', 4);
total = cart.totals('delivery', 'WELCOME10');
assert.equal(total.discount, 10000); // INR 100 cap
assert.equal(total.delivery, 0);
assert.equal(total.total, 126400);
cart.setQuantity('pasta', 20);
assert.throws(() => cart.add('pasta'), /20/);
assert.throws(() => cart.setQuantity('pasta', -1), /quantity/);
assert.throws(() => cart.setQuantity('pasta', 1.5), /quantity/);
assert.throws(() => cart.add('not-a-dish'), /unavailable/);
cart.setQuantity('pasta', 0);
assert.equal(cart.count(), 0);
cart.add('berry'); // INR 180 does not meet minimum coupon subtotal
assert.equal(cart.totals('delivery', 'WELCOME10').discount, 0);
assert.equal(cart.money(32000), '\u20b9320.00');
storage.set('stackly-cart-v1', JSON.stringify([{ id: 'berry', quantity: 2, price: 1 }, { id: 'missing', quantity: 1 }, { id: 'pasta', quantity: -9 }]));
assert.equal(cart.count(), 2);
assert.equal(cart.totals().subtotal, 36000); // Trust catalog, not stored prices.
storage.set('stackly-cart-v1', 'malformed');
assert.equal(cart.count(), 0);
cart.add('pizza');
vm.runInContext(fs.readFileSync(path.join(root, 'cart-store.js'), 'utf8'), context);
assert.equal(context.window.StacklyCart.count(), 1); // Persistence after reinitialisation.
cart.clear();
assert.equal(cart.count(), 0);
assert(events.includes('stackly:cart-change'));
console.log('Passed cart quantities, persistence, discounts, fee/tax arithmetic, empty states, invalid storage, badge updates and rupee formatting.');
