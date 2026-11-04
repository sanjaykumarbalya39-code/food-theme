(() => {
  const store = window.StacklyBookings;
  const trigger = document.querySelector('#my-bookings');
  const dateLabel = date => new Date(date + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  function today() { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`; }
  function updateCount() { trigger.textContent = `My bookings (${store.list().filter(row => restaurants.some(place => place.id === row.restaurantId)).length})`; }
  function openBooking(restaurantId) {
    const place = restaurants.find(place => place.id === restaurantId);
    if (!place) return;
    openModal(`<div class="booking-photo" style="background-image:linear-gradient(0deg,#213626bb,transparent),url('assets/restaurants/${place.image}.jpg')"><span>YOUR NEXT TABLE / LOCAL PREVIEW</span></div><span class="eyebrow">MAKE A LITTLE PLAN</span><h2>Book ${place.name}</h2><p class="booking-area">${place.area}</p><form id="restaurant-booking-form"><div class="booking-fields"><label>Date<input type="date" name="date" required min="${today()}"></label><label>Time<select name="time" required></select></label><label class="booking-full">Guests<select name="guests">${Array.from({length:12},(_,i)=>`<option value="${i+1}" ${i===1?'selected':''}>${i+1} ${i?'guests':'guest'}</option>`).join('')}</select></label></div><p class="booking-disclosure">This saves a booking preview on this browser. Availability is not checked, and the restaurant is not contacted. Contact the venue directly for a real reservation.</p><button type="submit" class="solid-link booking-submit">Save booking preview</button><p class="booking-status" role="status"></p></form>`);
    modal.classList.add('booking-dialog');
    const form = document.querySelector('#restaurant-booking-form');
    function updateTimes() {
      form.elements.date.min = today();
      const chosen = form.elements.time.value;
      form.elements.time.innerHTML = '<option value="">Choose a time</option>' + Array.from({length:21},(_,i)=>{
        const hour=12+Math.floor(i/2),minute=i%2?'30':'00';const time=`${hour}:${minute}`;
        return `<option value="${time}" ${form.elements.date.value && !store.validSlot(form.elements.date.value,time)?'disabled':''}>${time}</option>`;
      }).join('');
      if ([...form.elements.time.options].some(option=>option.value===chosen&&!option.disabled)) form.elements.time.value=chosen;
    }
    form.elements.date.value = today(); updateTimes();
    form.elements.date.addEventListener('change', updateTimes);
    form.addEventListener('submit', event => {
      event.preventDefault();
      try {
        const booking = store.add({ restaurantId: place.id, date: form.elements.date.value, time: form.elements.time.value, guests: Number(form.elements.guests.value) });
        openModal(`<div class="booking-success" aria-hidden="true">&#10003;</div><span class="eyebrow">SAVED ON THIS BROWSER</span><h2>Your booking preview is ready.</h2><p class="booking-area">${place.name}</p><dl class="booking-receipt"><div><dt>Date</dt><dd>${dateLabel(booking.date)}</dd></div><div><dt>Time</dt><dd>${booking.time}</dd></div><div><dt>Guests</dt><dd>${booking.guests}</dd></div><div><dt>Reference</dt><dd>${booking.id.toUpperCase()}</dd></div></dl><p class="booking-disclosure">This is a local preview, not a confirmed restaurant reservation. No payment was taken and the restaurant was not contacted.</p><button type="button" id="view-saved-bookings" class="solid-link booking-submit">View my bookings</button>`);
        modal.classList.add('booking-dialog');
        document.querySelector('#view-saved-bookings').addEventListener('click', openBookings);
      } catch (error) { document.querySelector('.booking-status').textContent = error.message; }
    });
    form.elements.date.focus();
  }
  function openBookings() {
    const rows = store.list().filter(row => restaurants.some(place => place.id === row.restaurantId)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    openModal(`<span class="eyebrow">YOUR PERSONAL DINING PLANS</span><h2>My bookings</h2><p class="booking-disclosure">Saved locally on this browser. These are previews, not confirmed reservations.</p><div class="saved-bookings">${rows.length ? rows.map(row=>{
      const place=restaurants.find(place=>place.id===row.restaurantId);
      return `<article class="saved-booking"><img src="assets/restaurants/${place.image}.jpg" alt="Illustrative ${place.name}" width="70" height="70"><div><h3>${place.name}</h3><p>${dateLabel(row.date)} / ${row.time}<br>${row.guests} ${row.guests===1?'guest':'guests'}</p></div><button type="button" data-cancel-booking="${row.id}" aria-label="Remove booking preview for ${place.name}">Remove</button></article>`;
    }).join('') : '<p class="bookings-empty">No bookings saved yet. Choose a restaurant and select Book a table to make your first plan.</p>'}</div><p class="booking-status" role="status"></p>`);
    modal.classList.add('booking-dialog');
    document.querySelector('.saved-bookings').addEventListener('click',event=>{
      const button=event.target.closest('[data-cancel-booking]');if(!button)return;
      try { store.cancel(button.dataset.cancelBooking);openBookings(); } catch(error) { document.querySelector('.booking-status').textContent=error.message; }
    });
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-book-table]');
    if (button) openBooking(button.dataset.bookTable);
  });
  trigger.addEventListener('click', openBookings);
  window.addEventListener('stackly:booking-change', updateCount);
  updateCount();
})();
