// Browser-only booking previews. No restaurant availability or reservation API.
(() => {
  const key = () => window.StacklyAccounts?.storageKey('stackly-bookings-v1') || 'stackly-bookings-v1';
  function validSlot(date, time, now = new Date()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return false;
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    const slot = new Date(year, month - 1, day, hour, minute);
    return hour >= 12 && hour <= 22 && [0, 30].includes(minute) && !(hour === 22 && minute > 0)
      && slot.getFullYear() === year && slot.getMonth() === month - 1 && slot.getDate() === day
      && slot.getTime() > now.getTime();
  }
  function list() {
    try {
      const rows = JSON.parse(localStorage.getItem(key()) || '[]');
      if (!Array.isArray(rows)) return [];
      return rows.filter(row => row && typeof row.id === 'string' && typeof row.restaurantId === 'string'
        && /^[a-z0-9-]+$/i.test(row.id) && /^[a-z0-9-]+$/i.test(row.restaurantId)
        && validSlot(row.date, row.time, new Date(0))
        && Number.isInteger(row.guests) && row.guests >= 1 && row.guests <= 12);
    } catch { return []; }
  }
  function save(rows) {
    try { localStorage.setItem(key(), JSON.stringify(rows)); }
    catch { throw new Error('Your browser could not save this booking. Please enable site storage and try again.'); }
    window.dispatchEvent(new Event('stackly:booking-change'));
  }
  function add({ restaurantId, date, time, guests }) {
    if (!/^[a-z0-9-]+$/i.test(restaurantId)) throw new Error('Choose a restaurant.');
    if (!validSlot(date, time)) throw new Error('Choose a future date and time between 12:00 and 22:00.');
    if (!Number.isInteger(guests) || guests < 1 || guests > 12) throw new Error('Choose between 1 and 12 guests.');
    const rows = list();
    if (rows.some(row => row.restaurantId === restaurantId && row.date === date && row.time === time)) throw new Error('You already saved a booking for this restaurant at this time. Check My bookings.');
    if (rows.length >= 100) throw new Error('Remove an older booking before saving another.');
    const row = { id: 'BOOK-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8), restaurantId, date, time, guests };
    save([...rows, row]);
    return row;
  }
  function cancel(id) { save(list().filter(row => row.id !== id)); }
  window.StacklyBookings = { list, add, cancel, validSlot };
})();
