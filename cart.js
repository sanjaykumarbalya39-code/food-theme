(() => {
  const cart = window.StacklyCart;
  const form = document.querySelector('#checkout-form');
  const cartItems = document.querySelector('#cart-items');
  const status = document.querySelector('#coupon-status');
  let stage = 'cart';
  let coupon = '';
  let completed = false;
  const type = () => form.elements.orderType.value;
  const paymentLabels = { upi: 'UPI / demo selection', card: 'Card / demo selection', cash: 'Cash / demo selection' };
  function notice(message) { if (typeof showNotice === 'function') showNotice(message); }
  function setStep(step) {
    document.querySelectorAll('[data-step]').forEach(item => {
      item.classList.toggle('current', Number(item.dataset.step) === step);
      item.classList.toggle('complete', Number(item.dataset.step) < step);
      if (Number(item.dataset.step) === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  }
  function updateType() {
    const delivery = type() === 'delivery';
    document.querySelector('#delivery-fields').hidden = !delivery;
    document.querySelector('#delivery-fields').disabled = !delivery;
    document.querySelector('#dinein-fields').hidden = delivery;
    document.querySelector('#dinein-fields').disabled = delivery;
    document.querySelector('#details-title').textContent = delivery ? 'Where should we deliver?' : 'Set the scene for your visit.';
    document.querySelector('#cash-label').textContent = delivery ? 'Cash on delivery' : 'Pay at the venue';
    render();
  }
  function updatePayment() {
    const messages = {
      upi: 'UPI selected. In a live checkout, payment would be completed through an authorised payment provider. This demo does not request a UPI ID or PIN.',
      card: 'Card selected. A live checkout would use a payment provider to handle card information. This demo does not collect card numbers or CVV.',
      cash: 'Cash selected as your preference for this demo. No delivery or restaurant order will be arranged.'
    };
    document.querySelector('#payment-explanation').textContent = messages[form.elements.payment.value];
  }
  function renderSuggestions() {
    const selected = new Set(cart.items().map(item => item.id));
    const suggestions = window.StacklyMenuData.filter(dish => ['berry','pizza','salad','curry','tomato','lemon-sorbet'].includes(dish.id) && !selected.has(dish.id)).slice(0, 3);
    document.querySelector('#cart-suggestions').innerHTML = suggestions.map(dish => `<article class="cart-suggestion"><img src="assets/explore-menu/${dish.image}" alt="Illustrative ${dish.name}" width="350" height="260" loading="lazy" decoding="async"><div><span class="eyebrow">${dish.category}</span><h3>${dish.name}</h3><div class="suggestion-price"><span>${cart.money(dish.price * 100)}</span><button data-add="${dish.id}" type="button" aria-label="Add ${dish.name} to cart">Add +</button></div></div></article>`).join('');
  }
  function render() {
    if (completed) return;
    const items = cart.items();
    document.querySelector('#empty-cart').hidden = items.length > 0;
    document.querySelector('#cart-content').hidden = !items.length;
    if (!items.length) { stage = 'cart'; setStep(1); }
    cartItems.innerHTML = items.map(item => `<article class="cart-row"><img src="assets/explore-menu/${item.image}" alt="Illustrative ${item.name}" width="110" height="100" loading="lazy" decoding="async"><div class="cart-row-copy"><span class="eyebrow">${item.category}</span><h3>${item.name}</h3><p>${cart.money(item.price * 100)} each</p><button type="button" class="remove-item" data-remove="${item.id}" aria-label="Remove ${item.name}">Remove</button></div><div class="cart-row-controls"><strong>${cart.money(item.price * item.quantity * 100)}</strong><div class="quantity-control"><button type="button" data-quantity="${item.id}" data-delta="-1" aria-label="Decrease ${item.name} quantity">−</button><span aria-label="Quantity ${item.quantity}">${item.quantity}</span><button type="button" data-quantity="${item.id}" data-delta="1" aria-label="Increase ${item.name} quantity" ${item.quantity >= 20 ? 'disabled' : ''}>+</button></div></div></article>`).join('');
    document.querySelector('#summary-count').textContent = `${cart.count()} ${cart.count() === 1 ? 'item' : 'items'} / Sample menu`;
    document.querySelector('#summary-items').innerHTML = items.map(item => `<div class="summary-item"><img src="assets/explore-menu/${item.image}" alt="" width="48" height="48" loading="lazy"><div><strong>${item.name}</strong><small>Qty ${item.quantity}</small></div><span>${cart.money(item.price * item.quantity * 100)}</span></div>`).join('');
    const totals = cart.totals(type(), coupon);
    const rows = [['Item total',totals.subtotal],['Demo discount',-totals.discount],['Packing charges',totals.packing],['Platform fee',totals.platform],['Sample tax (5%)',totals.tax],['Delivery fee',totals.delivery]];
    document.querySelector('#price-breakdown').innerHTML = rows.map(([label,value]) => `<div><dt>${label}</dt><dd>${label === 'Demo discount' && value ? '−' + cart.money(-value) : label === 'Delivery fee' && !value ? (type() === 'delivery' ? 'FREE' : 'Not applicable') : cart.money(value)}</dd></div>`).join('');
    document.querySelector('#grand-total').textContent = cart.money(totals.total);
    document.querySelector('#cart-editor').hidden = stage !== 'cart';
    form.hidden = stage !== 'checkout';
    document.querySelector('#place-demo-order').hidden = stage !== 'checkout';
    if (coupon) status.textContent = totals.discount ? `WELCOME10 applied. You save ${cart.money(totals.discount)}.` : 'WELCOME10 needs an item total of ₹300 or more.';
    renderSuggestions();
  }
  document.querySelector('#start-checkout').addEventListener('click', () => {
    if (!cart.count()) return;
    stage = 'checkout'; setStep(2); render();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.querySelector('#back-to-cart').addEventListener('click', () => { stage = 'cart'; setStep(1); render(); document.querySelector('#cart-editor').scrollIntoView({ behavior: 'smooth' }); });
  cartItems.addEventListener('click', event => {
    const control = event.target.closest('[data-quantity],[data-remove]');
    if (!control) return;
    try {
      if (control.dataset.remove) cart.setQuantity(control.dataset.remove, 0);
      else {
        const item = cart.items().find(item => item.id === control.dataset.quantity);
        if (item) cart.setQuantity(item.id, item.quantity + Number(control.dataset.delta));
      }
    } catch (error) { notice(error.message); }
  });
  document.querySelector('#cart-suggestions').addEventListener('click', event => {
    const add = event.target.closest('[data-add]');
    if (!add) return;
    try { cart.add(add.dataset.add); notice('Added to your cart.'); } catch (error) { notice(error.message); }
  });
  document.querySelector('#apply-coupon').addEventListener('click', () => {
    const value = document.querySelector('#coupon-code').value.trim().toUpperCase();
    coupon = value === 'WELCOME10' ? value : '';
    render();
    if (!coupon) status.textContent = value ? 'This demo code is not recognised. Try WELCOME10.' : 'Enter a demo code to apply an offer.';
  });
  document.querySelector('#coupon-code').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); document.querySelector('#apply-coupon').click(); } });
  document.querySelectorAll('[name="orderType"]').forEach(input => input.addEventListener('change', updateType));
  document.querySelectorAll('[name="payment"]').forEach(input => input.addEventListener('change', updatePayment));
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  document.querySelector('#dining-date').min = today;
  const user = window.StacklyAccounts?.current();
  if (user) form.elements.name.value = user.name;
  try { form.elements.city.value = localStorage.getItem('faaaahh-location') || ''; } catch {}
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (stage !== 'checkout' || !cart.count()) return;
    if (!form.elements.name.value.trim() || (type() === 'delivery' && (!form.elements.address.value.trim() || !form.elements.city.value.trim()))) { notice('Please complete your name and address.'); return; }
    if (!form.reportValidity()) return;
    if (type() === 'dinein' && form.elements.date.value < today) { notice('Please choose today or a future date.'); return; }
    const totals = cart.totals(type(), coupon);
    const mode = type() === 'delivery' ? 'Home delivery concept' : 'Dine-in concept';
    const method = paymentLabels[form.elements.payment.value];
    const count = cart.count();
    const reference = 'DEMO-' + Date.now().toString(36).toUpperCase();
    completed = true;
    try { window.StacklyOrders?.add({ id: reference, type: type(), payment: form.elements.payment.value, total: totals.total, items: cart.items() }); cart.clear(); } catch (error) { completed = false; notice(error.message); return; }
    document.querySelector('#cart-content').hidden = true;
    document.querySelector('#empty-cart').hidden = true;
    const confirmation = document.querySelector('#order-confirmation');
    confirmation.hidden = false;
    document.querySelector('#confirmation-details').innerHTML = `<dl><div><dt>Demo reference</dt><dd>${reference}</dd></div><div><dt>Experience</dt><dd>${mode}</dd></div><div><dt>Items</dt><dd>${count}</dd></div><div><dt>Payment preference</dt><dd>${method}</dd></div><div><dt>Illustrative total</dt><dd>${cart.money(totals.total)}</dd></div><div><dt>Amount charged</dt><dd>${cart.money(0)}</dd></div></dl>`;
    form.reset(); setStep(3); confirmation.scrollIntoView({ behavior: 'smooth' }); confirmation.focus({ preventScroll: true });
    renderSuggestions();
  });
  window.addEventListener('stackly:cart-change', render);
  updatePayment(); updateType();
})();
