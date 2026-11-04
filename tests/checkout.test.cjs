const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const nodes = new Map();
const storage = new Map();
const events = new Map();
function node(selector) {
  if (!nodes.has(selector)) nodes.set(selector, {
    value: '', hidden: false, disabled: false, textContent: '', innerHTML: '', dataset: {},
    classList: { toggle() {} }, setAttribute() {}, removeAttribute() {}, scrollIntoView() {}, focus() {},
    listeners: {}, addEventListener(type, callback) { this.listeners[type] = callback; }
  });
  return nodes.get(selector);
}
const form = node('#checkout-form');
form.elements = Object.fromEntries(['orderType','payment','name','phone','address','city','pincode','date'].map(key => [key, { value: '' }]));
Object.assign(form.elements.orderType, { value: 'delivery' });
Object.assign(form.elements.payment, { value: 'upi' });
form.reportValidity = () => false;
form.reset = () => Object.values(form.elements).forEach(field => field.value = '');
const context = {
  window: {
    addEventListener(name, callback) { events.set(name, callback); },
    dispatchEvent(event) { events.get(event.type)?.(); }
  },
  document: { querySelector: node, querySelectorAll: () => [] },
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  Event: class { constructor(type) { this.type = type; } },
  showNotice() {}, Date
};
vm.createContext(context);
for (const file of ['menu-data.js','cart-store.js','order-store.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
context.window.StacklyCart.add('pasta');
vm.runInContext(fs.readFileSync(path.join(root, 'cart.js'), 'utf8'), context);
assert.equal(node('#empty-cart').hidden, true);
assert.equal(form.hidden, true);
node('#start-checkout').listeners.click();
assert.equal(form.hidden, false);
assert.equal(node('#place-demo-order').hidden, false);
form.elements.name.value = 'Private Test Name';
form.elements.address.value = 'Private Test Address';
form.elements.city.value = 'Chennai';
form.listeners.submit({ preventDefault() {} });
assert.equal(context.window.StacklyCart.count(), 1, 'Invalid checkout must preserve cart');
form.reportValidity = () => true;
form.listeners.submit({ preventDefault() {} });
assert.equal(context.window.StacklyCart.count(), 0);
assert.equal(context.window.StacklyOrders.list().length, 1);
assert.equal(context.window.StacklyOrders.list()[0].items[0].id, 'pasta');
assert.equal(context.window.StacklyOrders.list()[0].charged, 0);
assert.equal(node('#cart-content').hidden, true);
assert.equal(node('#order-confirmation').hidden, false);
assert(node('#confirmation-details').innerHTML.includes('DEMO-'));
assert(node('#confirmation-details').innerHTML.includes('Amount charged'));
assert(node('#confirmation-details').innerHTML.includes('\u20b90.00'));
assert(!JSON.stringify([...storage]).includes('Private Test'), 'Contact details must not be persisted');
assert.equal(form.elements.address.value, '', 'Form details clear after confirmation');
console.log('Passed cart-to-checkout transition, invalid-form preservation, demo confirmation, zero-charge receipt and no address persistence.');
