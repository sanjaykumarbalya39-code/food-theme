// Browser-local cart. Store IDs and quantities; prices always come from menu data.
(() => {
  const baseKey = 'stackly-cart-v1';
  const storageKey = () => window.StacklyAccounts?.storageKey(baseKey) || baseKey;
  const catalog = window.StacklyMenuData || [];
  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey()) || '[]');
      if (!Array.isArray(data)) return [];
      const merged = new Map();
      data.forEach(row => {
        if (!row || !catalog.some(dish => dish.id === row.id) || !Number.isInteger(row.quantity) || row.quantity <= 0) return;
        merged.set(row.id, Math.min(20, (merged.get(row.id) || 0) + row.quantity));
      });
      return [...merged].map(([id, quantity]) => ({ id, quantity }));
    } catch { return []; }
  }
  function items() { return read().map(row => ({ ...catalog.find(dish => dish.id === row.id), quantity: row.quantity })); }
  function count() { return read().reduce((sum, row) => sum + row.quantity, 0); }
  function refreshBadge() {
    const total = count();
    document.querySelectorAll('.cart-count').forEach(badge => badge.textContent = total);
    document.querySelectorAll('#cart-button').forEach(link => link.setAttribute('aria-label', `Open cart, ${total} items`));
  }
  function write(rows) {
    try { localStorage.setItem(storageKey(), JSON.stringify(rows)); }
    catch { throw new Error('Your browser could not save the cart. Please enable site storage.'); }
    refreshBadge();
    window.dispatchEvent(new Event('stackly:cart-change'));
  }
  function add(id) {
    if (!catalog.some(dish => dish.id === id)) throw new Error('This dish is unavailable.');
    const rows = read();
    const row = rows.find(row => row.id === id);
    if (row?.quantity === 20) throw new Error('You can add up to 20 of each dish.');
    if (row) row.quantity++;
    else rows.push({ id, quantity: 1 });
    write(rows);
  }
  function setQuantity(id, quantity) {
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 20) throw new Error('Choose a quantity between 0 and 20.');
    const rows = read();
    const row = rows.find(row => row.id === id);
    if (!row) return;
    row.quantity = quantity;
    write(rows.filter(row => row.quantity > 0));
  }
  function totals(type = 'delivery', coupon = '') {
    const subtotal = items().reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
    const discount = coupon === 'WELCOME10' && subtotal >= 30000 ? Math.min(10000, Math.round(subtotal / 10)) : 0;
    const discounted = subtotal - discount;
    const packing = subtotal && type === 'delivery' ? 2000 : 0;
    const platform = subtotal ? 500 : 0;
    const delivery = subtotal && type === 'delivery' && discounted < 50000 ? 4000 : 0;
    const tax = Math.round(discounted * 0.05);
    return { subtotal, discount, packing, platform, delivery, tax, total: discounted + packing + platform + delivery + tax };
  }
  function money(paise) { return '\u20b9' + (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  window.StacklyCart = { items, count, add, setQuantity, totals, money, clear: () => write([]), refreshBadge };
  refreshBadge();
  window.addEventListener('storage', event => { if (event.key === storageKey()) { refreshBadge(); window.dispatchEvent(new Event('stackly:cart-change')); } });
})();
