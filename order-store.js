// Demo receipts only. Never persist contact, address or payment credentials.
(() => {
  const key = () => window.StacklyAccounts?.storageKey('stackly-demo-orders-v1') || 'stackly-demo-orders-v1';
  function list() {
    try {
      const data = JSON.parse(localStorage.getItem(key()) || '[]');
      if (!Array.isArray(data)) return [];
      return data.filter(order => order && typeof order.id === 'string' && /^DEMO-[a-z0-9-]+$/i.test(order.id)
        && ['delivery','dinein'].includes(order.type) && ['upi','card','cash'].includes(order.payment)
        && Number.isFinite(order.created) && Number.isInteger(order.total) && order.total >= 0
        && Array.isArray(order.items) && order.items.every(item => item && typeof item.id === 'string'
          && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 20));
    } catch { return []; }
  }
  function add({ id, type, payment, total, items }) {
    const order = { id, type, payment, total, items: items.map(item => ({ id: item.id, quantity: item.quantity })), created: Date.now(), status: 'demo', charged: 0 };
    try { localStorage.setItem(key(), JSON.stringify([order, ...list()].slice(0,100))); }
    catch { throw new Error('Your browser could not save the demo order. Please enable site storage.'); }
    window.dispatchEvent(new Event('stackly:order-change'));
    return order;
  }
  window.StacklyOrders = { list, add };
})();
