// One delegated handler covers every filtered card and dish-detail Add button.
(() => {
  const tray = document.createElement('aside');
  tray.className = 'menu-cart-tray';
  tray.hidden = true;
  tray.setAttribute('aria-label', 'Your current cart');
  tray.innerHTML = '<div><strong class="menu-cart-items"></strong><span class="menu-cart-total"></span></div><a href="cart.html">View cart <span aria-hidden="true">&#8594;</span></a>';
  document.body.append(tray);
  const feedback = document.createElement('p');
  feedback.className = 'menu-cart-feedback';
  feedback.setAttribute('role', 'status');
  document.body.append(feedback);
  let timer;
  function announce(text) {
    feedback.textContent = text;
    feedback.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(() => feedback.classList.remove('is-visible'), 3000);
  }
  function refresh() {
    const cart = window.StacklyCart;
    if (!cart) return;
    const count = cart.count();
    tray.hidden = count === 0;
    document.body.classList.toggle('has-menu-cart', count > 0);
    tray.querySelector('.menu-cart-items').textContent = `${count} ${count === 1 ? 'item' : 'items'} in your cart`;
    tray.querySelector('.menu-cart-total').textContent = `${cart.money(cart.totals().subtotal)} / Item total`;
    const quantities = new Map(cart.items().map(item => [item.id, item.quantity]));
    document.querySelectorAll('[data-add]').forEach(button => {
      const quantity = quantities.get(button.dataset.add) || 0;
      button.textContent = quantity ? `Add more (${quantity}) +` : 'Add to cart +';
      button.setAttribute('aria-label', `Add ${window.StacklyMenuData.find(dish => dish.id === button.dataset.add)?.name || 'dish'} to cart${quantity ? `, ${quantity} already in cart` : ''}`);
    });
    cart.refreshBadge();
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-add]');
    if (!button) return;
    event.preventDefault();
    try {
      if (!window.StacklyCart) throw new Error('The cart could not load. Refresh the page and try again.');
      window.StacklyCart.add(button.dataset.add);
      const name = window.StacklyMenuData.find(dish => dish.id === button.dataset.add)?.name || 'Dish';
      announce(`${name} added to your cart.`);
      const dialog = button.closest('dialog');
      if (dialog?.open) dialog.close();
      refresh();
    } catch (error) { announce(error.message); }
  });
  window.addEventListener('stackly:cart-change', refresh);
  const grid = document.querySelector('#dish-grid');
  if (grid) new MutationObserver(refresh).observe(grid, { childList: true });
  refresh();
})();
