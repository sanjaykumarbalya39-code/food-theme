const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.join(__dirname, '..');
const storage = new Map(), windowEvents = new Map(), documentEvents = new Map(), created = [];
function element() {
  const children = new Map();
  return { textContent: '', hidden: false, innerHTML: '', dataset: {},
    classList: { add() {}, remove() {}, toggle() {} }, setAttribute() {},
    querySelector(selector) { if (!children.has(selector)) children.set(selector, element()); return children.get(selector); }
  };
}
const button = element(); button.dataset.add = 'pasta';
button.closest = selector => selector === '[data-add]' ? button : null;
const badge = element();
const context = {
  window: { addEventListener: (name, fn) => windowEvents.set(name, fn), dispatchEvent: event => windowEvents.get(event.type)?.() },
  document: {
    body: { append: el => created.push(el), classList: { toggle() {} } },
    createElement: element,
    querySelectorAll: selector => selector === '[data-add]' ? [button] : selector === '.cart-count' ? [badge] : [],
    querySelector: () => null,
    addEventListener: (name, fn) => documentEvents.set(name, fn)
  },
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  Event: class { constructor(type) { this.type = type; } }, setTimeout: () => 1, clearTimeout() {}, Map
};
vm.createContext(context);
for (const file of ['menu-data.js','cart-store.js','menu-cart.js']) vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
const [tray, feedback] = created;
assert.equal(tray.hidden,true);
assert.equal(button.textContent,'Add to cart +');
documentEvents.get('click')({ target:button, preventDefault() {} });
assert.equal(context.window.StacklyCart.count(),1);
assert.equal(badge.textContent,1);
assert.equal(tray.hidden,false);
assert.equal(button.textContent,'Add more (1) +');
assert(feedback.textContent.includes('Basil pesto pasta added'));
assert(tray.innerHTML.includes('href="cart.html"'));
documentEvents.get('click')({ target:button, preventDefault() {} });
assert.equal(context.window.StacklyCart.count(),2);
assert.equal(tray.querySelector('.menu-cart-items').textContent,'2 items in your cart');
assert(tray.querySelector('.menu-cart-total').textContent.includes('640.00'));
const modal = { open:true, close() { this.open=false; } };
button.closest = selector => selector === '[data-add]' ? button : selector === 'dialog' ? modal : null;
documentEvents.get('click')({ target:button, preventDefault() {} });
assert.equal(context.window.StacklyCart.count(),3);
assert.equal(modal.open,false);
context.localStorage.setItem = () => { throw new Error('storage disabled'); };
documentEvents.get('click')({ target:button, preventDefault() {} });
assert.equal(context.window.StacklyCart.count(),3);
assert(feedback.textContent.includes('could not save'));
console.log('Passed actual delegated Add clicks, detail-dialog Add, quantity feedback, header badge, View cart tray and storage failure handling.');
