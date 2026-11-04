const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const nodes = new Map(), storage = new Map(), listeners = new Map();
function node(selector) {
  if (!nodes.has(selector)) nodes.set(selector, { textContent:'', innerHTML:'', hidden:false, addEventListener() {} });
  return nodes.get(selector);
}
const context = {
  window: {
    StacklyAccounts: { current: () => ({ name:'Asha', email:'asha@example.com' }), storageKey: key => key + ':asha' },
    StacklyOrders: { list: () => [] }, StacklyBookings: { list: () => [] },
    addEventListener: (name, callback) => listeners.set(name, callback), dispatchEvent: event => listeners.get(event.type)?.()
  },
  document: { querySelector:node, querySelectorAll:() => [] },
  localStorage: { getItem:key => storage.get(key) ?? null, setItem:(key,value) => storage.set(key,value) },
  location: { replace() { throw new Error('Unexpected login redirect'); } },
  Event: class { constructor(type) { this.type=type; } }, setTimeout
};
vm.createContext(context);
const load = file => vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'), context);
['menu-data.js','restaurant-data.js','cart-store.js'].forEach(load);
storage.set('faaaahh-saved-dishes:asha','["pasta","pizza"]');
context.window.StacklyCart.add('pasta');
load('dashboard.js');
const dish = id => context.window.StacklyMenuData.find(dish => dish.id === id);
assert(node('#dashboard-favourites').innerHTML.includes(dish('pasta').name));
assert(node('#dashboard-favourites').innerHTML.includes(dish('pizza').image));
assert.equal(node('#stat-favourites').textContent, 2);
assert(node('#dashboard-cart-items').innerHTML.includes(dish('pasta').name));
assert.equal(node('#dashboard-cart-count').textContent, '(1)');
context.window.StacklyCart.add('pizza');
assert.equal(node('#dashboard-cart-count').textContent, '(2)');
assert(node('#dashboard-cart-items').innerHTML.includes(dish('pizza').name));
storage.set('faaaahh-saved-dishes:asha','["berry"]');
listeners.get('pageshow')();
assert(node('#dashboard-favourites').innerHTML.includes(dish('berry').name));
assert.equal(node('#stat-favourites').textContent, 1);
context.window.StacklyCart.clear();
assert.equal(node('#dashboard-cart-count').textContent, '(0)');
assert(node('#dashboard-cart-items').innerHTML.includes('Your next meal'));
const html=fs.readFileSync(path.join(__dirname,'..','dashboard.html'),'utf8');
assert(!html.includes('dashboard-favourites dashboard-panel reveal'));
console.log('Passed saved-dish rendering, cart item rendering, live cart updates, return navigation refresh and empty cart.');
