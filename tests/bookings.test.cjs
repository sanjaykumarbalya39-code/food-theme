const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'booking-store.js'), 'utf8');
const data = new Map();
const events = [];
const context = {
  window: { dispatchEvent: event => events.push(event.type) },
  localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) },
  Event: class { constructor(type) { this.type = type; } }, Date
};
vm.createContext(context);
vm.runInContext(source, context);
const store = context.window.StacklyBookings;
const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
assert.equal(store.list().length, 0);
assert.equal(store.validSlot('2026-02-30', '19:00'), false);
assert.equal(store.validSlot('2020-01-01', '19:00'), false);
assert.equal(store.validSlot(date, '23:00'), false);
assert.equal(store.validSlot(date, '19:17'), false);
assert.equal(store.validSlot(date, '19:30'), true);
assert.throws(() => store.add({ restaurantId: 'sattva', date, time: '19:30', guests: 0 }), /guests/);
const booking = store.add({ restaurantId: 'sattva', date, time: '19:30', guests: 4 });
assert.equal(store.list().length, 1);
assert.equal(store.list()[0].guests, 4);
assert.throws(() => store.add({ restaurantId: 'sattva', date, time: '19:30', guests: 2 }), /already saved/);
vm.runInContext(source, context);
assert.equal(context.window.StacklyBookings.list()[0].id, booking.id);
store.cancel(booking.id);
assert.equal(store.list().length, 0);
data.set('stackly-bookings-v1', JSON.stringify([{ id: 'bad', restaurantId: 'sattva', date: '2030-13-99', time: '19:00', guests: 2 }]));
assert.equal(store.list().length, 0);
data.set('stackly-bookings-v1', 'bad json');
assert.equal(store.list().length, 0);
const original = context.localStorage.setItem;
context.localStorage.setItem = () => { throw new Error('storage disabled'); };
assert.throws(() => store.add({ restaurantId: 'sattva', date, time: '19:30', guests: 2 }), /could not save/);
context.localStorage.setItem = original;
assert(events.includes('stackly:booking-change'));
console.log('Passed booking creation, future-slot validation, duplicate prevention, guest limits, persistence, removal and storage-failure checks.');
