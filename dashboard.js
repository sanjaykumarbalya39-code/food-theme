(() => {
  const accounts = window.StacklyAccounts;
  let user = accounts.current();
  if (!user) { location.replace('login.html'); return; }
  const main = document.querySelector('.dashboard-main');
  main.hidden = false;
  const dialog = document.querySelector('#modal');
  const body = document.querySelector('#modal-content');
  const dishes = window.StacklyMenuData;
  const places = window.StacklyRestaurantData;
  let showAllOrders = false;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
  const money = window.StacklyCart.money;
  const dateLabel = value => new Date(value).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  const keys = { dishes:'faaaahh-saved-dishes', places:'faaaahh-saved-restaurants' };
  function favourites(kind) {
    try { const list=JSON.parse(localStorage.getItem(accounts.storageKey(keys[kind]))||'[]');return Array.isArray(list)?list.filter(id=>typeof id==='string'):[]; } catch { return []; }
  }
  function removeFavourite(kind,id) { localStorage.setItem(accounts.storageKey(keys[kind]),JSON.stringify(favourites(kind).filter(value=>value!==id)));render(); }
  function notice(text) { document.querySelector('.dashboard-status').textContent=text; if(typeof showNotice==='function')showNotice(text); }
  function openDialog(html) { body.innerHTML=html;dialog.classList.add('dashboard-dialog');if(!dialog.open)dialog.showModal(); }
  const empty = (symbol,title,description,href,label) => `<div class="dashboard-empty"><span aria-hidden="true">${symbol}</span><h3>${title}</h3><p>${description}</p>${href?`<a href="${href}">${label} &#8599;</a>`:''}</div>`;
  function render() {
    user=accounts.current();if(!user){location.replace('login.html');return;}
    document.querySelector('#dashboard-name').textContent=user.name;
    document.querySelector('#dashboard-avatar').textContent=user.name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
    document.querySelector('#profile-name').textContent=user.name;
    document.querySelector('#profile-email').textContent=user.email;
    document.querySelector('#profile-phone').textContent=user.phone||'Not added yet';
    let city='Choose in the header';try{city=localStorage.getItem('faaaahh-location')||city;}catch{}
    document.querySelector('#profile-city').textContent=city;
    const orders=window.StacklyOrders.list();
    const cartItems=window.StacklyCart.items();
    document.querySelector('#stat-cart').textContent=window.StacklyCart.count();
    document.querySelector('#dashboard-cart-count').textContent=`(${window.StacklyCart.count()})`;
    document.querySelector('#dashboard-cart-items').innerHTML=cartItems.length?`<div class="dashboard-saved-grid">${cartItems.map(dish=>`<article class="dashboard-saved-dish"><img src="assets/explore-menu/${dish.image}" alt="Illustrative ${escape(dish.name)}" width="360" height="250" loading="lazy"><div><span class="eyebrow">IN YOUR CART / QTY ${dish.quantity}</span><h3>${escape(dish.name)}</h3><p>${money(dish.price*100* dish.quantity)}</p><a class="solid-link" href="cart.html">Review in cart &#8599;</a></div></article>`).join('')}</div><p class="profile-note">Item subtotal: ${money(window.StacklyCart.totals().subtotal)}. Review fees and checkout in your cart.</p>`:empty('&#9832;','Your next meal is waiting to be discovered.','Dishes you add to the cart will appear here. Heart a dish to keep it in your saved flavours.','explore-menu.html','Explore the menu');
    const bookings=window.StacklyBookings.list().filter(row=>places.some(place=>place.id===row.restaurantId));
    const savedDishes=dishes.filter(dish=>favourites('dishes').includes(dish.id));
    const savedPlaces=places.filter(place=>favourites('places').includes(place.id));
    document.querySelector('#stat-orders').textContent=orders.length;
    document.querySelector('#stat-favourites').textContent=savedDishes.length;
    document.querySelector('#stat-bookings').textContent=bookings.length;
    const toggle=document.querySelector('#toggle-orders');toggle.hidden=orders.length<=3;toggle.textContent=showAllOrders?'Show recent':'View all';
    document.querySelector('#dashboard-orders').innerHTML=orders.length?orders.slice(0,showAllOrders?100:3).map(order=>{
      const first=dishes.find(dish=>dish.id===order.items[0]?.id);
      return `<article class="dashboard-order">${first?`<img src="assets/explore-menu/${first.image}" alt="Illustrative ${first.name}" width="70" height="70">`:'<span class="order-placeholder" aria-hidden="true">&#9776;</span>'}<div><span class="dashboard-demo-badge">DEMO / NO CHARGE</span><h3>${order.type==='delivery'?'Delivery preview':'Dine-in preview'}</h3><p>${dateLabel(order.created)} / ${order.items.reduce((sum,item)=>sum+item.quantity,0)} items</p><button class="panel-text-link" data-view-order="${escape(order.id)}" type="button">View receipt</button></div><strong>${money(order.total)}</strong></article>`;
    }).join(''):empty('&#9776;','Your history starts with a first choice.','Complete a demo checkout to see its receipt here. No real order will be sent.','explore-menu.html','Explore the menu');
    document.querySelector('#dashboard-bookings').innerHTML=bookings.length?bookings.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).map(row=>{
      const place=places.find(place=>place.id===row.restaurantId);
      return `<article class="dashboard-booking"><img src="assets/restaurants/${place.image}.jpg" alt="Illustrative ${place.name}" width="64" height="64"><div><span class="dashboard-demo-badge">LOCAL PREVIEW</span><h3>${place.name}</h3><p>${dateLabel(row.date+'T12:00:00')} / ${row.time}<br>${row.guests} ${row.guests===1?'guest':'guests'}</p></div><button class="panel-text-link" type="button" data-remove-booking="${escape(row.id)}">Remove</button></article>`;
    }).join(''):empty('&#9638;','Give your next catch-up a date.','Choose a restaurant and save a booking preview. Real availability is not checked.','restaurants.html','Find a setting');
    document.querySelector('#dashboard-favourites').innerHTML=savedDishes.length?`<div class="dashboard-saved-grid">${savedDishes.map(dish=>`<article class="dashboard-saved-dish"><img src="assets/explore-menu/${dish.image}" alt="Illustrative ${dish.name}" width="360" height="250" loading="lazy"><div><span class="eyebrow">${dish.category}</span><h3>${dish.name}</h3><p>${money(dish.price*100)}</p><div class="saved-dish-actions"><button data-dash-add="${dish.id}" type="button">Add to cart +</button><button data-unsave-dish="${dish.id}" type="button" aria-label="Unsave ${dish.name}">Unsave</button></div></div></article>`).join('')}</div>`:empty('&#9825;','Keep a few favourites close.','Tap the heart on a menu dish and it will be waiting here for this account.','explore-menu.html','Follow a flavour');
    document.querySelector('#dashboard-places').innerHTML=savedPlaces.length?`<div class="dashboard-place-grid">${savedPlaces.map(place=>`<article class="dashboard-saved-place"><img src="assets/restaurants/${place.image}.jpg" alt="Illustrative ${place.name}" width="100" height="90" loading="lazy"><div><h3>${place.name}</h3><p>${place.area}</p><button class="panel-text-link" type="button" data-unsave-place="${place.id}">Unsave place</button></div></article>`).join('')}</div>`:empty('&#9678;','A new corner is worth remembering.','Save a restaurant with its heart button to build your personal collection.','restaurants.html','Discover somewhere new');
  }
  document.querySelector('#edit-profile').addEventListener('click',()=>{
    openDialog('<span class="eyebrow">A LITTLE MORE YOU</span><h2>Edit your profile</h2><form id="dashboard-profile-form"><label>Name<input name="name" required minlength="2" maxlength="80" autocomplete="name"></label><label>Email<input name="email" type="email" readonly aria-describedby="profile-email-note"></label><p id="profile-email-note" class="profile-note">Your registration email is kept unchanged.</p><label>Phone <small>Optional</small><input name="phone" type="tel" inputmode="numeric" pattern="[6-9][0-9]{9}" maxlength="10" autocomplete="tel"></label><button class="solid-link" type="submit">Save profile</button><p class="dashboard-form-status" role="status"></p></form>');
    const form=document.querySelector('#dashboard-profile-form');form.elements.name.value=user.name;form.elements.email.value=user.email;form.elements.phone.value=user.phone||'';
    form.addEventListener('submit',event=>{event.preventDefault();try{accounts.updateProfile({name:form.elements.name.value,phone:form.elements.phone.value.trim()});dialog.close();render();window.refreshAccountNavigation?.();notice('Your profile has been updated.');}catch(error){document.querySelector('.dashboard-form-status').textContent=error.message;}});
  });
  document.querySelector('#dashboard-logout').addEventListener('click',()=>{try{accounts.logout();location.replace('login.html');}catch(error){notice(error.message);}});
  document.querySelector('#toggle-orders').addEventListener('click',()=>{showAllOrders=!showAllOrders;render();});
  main.addEventListener('click',event=>{
    const add=event.target.closest('[data-dash-add]'),unsaveDish=event.target.closest('[data-unsave-dish]'),unsavePlace=event.target.closest('[data-unsave-place]'),remove=event.target.closest('[data-remove-booking]'),receipt=event.target.closest('[data-view-order]');
    try{
      if(add){window.StacklyCart.add(add.dataset.dashAdd);notice('Added to your cart.');}
      if(unsaveDish)removeFavourite('dishes',unsaveDish.dataset.unsaveDish);
      if(unsavePlace)removeFavourite('places',unsavePlace.dataset.unsavePlace);
      if(remove)window.StacklyBookings.cancel(remove.dataset.removeBooking);
      if(receipt){const order=window.StacklyOrders.list().find(order=>order.id===receipt.dataset.viewOrder);if(!order)return;openDialog(`<span class="eyebrow">YOUR BROWSER-LOCAL RECEIPT</span><h2>Demo order details</h2><p class="profile-note">${escape(order.id)} / ${dateLabel(order.created)}</p><ul class="receipt-items">${order.items.map(item=>`<li><span>${escape(dishes.find(dish=>dish.id===item.id)?.name||'Sample dish')}</span><strong>Qty ${item.quantity}</strong></li>`).join('')}</ul><dl class="receipt-totals"><div><dt>Illustrative total</dt><dd>${money(order.total)}</dd></div><div><dt>Amount charged</dt><dd>${money(0)}</dd></div></dl><p class="profile-note">No payment was taken, no delivery is in progress, and no venue received an order.</p><a class="solid-link" href="explore-menu.html">Explore the menu</a>`);}
    }catch(error){notice(error.message);}
  });
  window.addEventListener('stackly:booking-change',render);
  window.addEventListener('stackly:order-change',render);
  window.addEventListener('stackly:cart-change',render);
  window.addEventListener('pageshow',render);
  window.addEventListener('focus',render);
  window.addEventListener('storage',render);
  document.querySelector('#location-select').addEventListener('change',()=>{setTimeout(render,0);});
  render();
})();
