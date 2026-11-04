(() => {
  const allow = document.querySelector('#allow-location');
  const deny = document.querySelector('#deny-location');
  const status = document.querySelector('.permission-status');
  const continueLink = document.querySelector('.permission-continue');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let checking = true;
  let pending = false;

  function remember(choice) {
    try { localStorage.setItem('stackly-location-permission', choice); } catch {}
  }
  function finish() {
    document.body.classList.add('is-leaving');
    setTimeout(() => location.replace('dashboard.html'), preference.matches ? 0 : 230);
  }
  function unavailable(message) {
    if (!pending) return;
    pending = false;
    document.body.classList.remove('is-locating');
    allow.disabled = false;
    deny.disabled = false;
    status.textContent = message;
    continueLink.hidden = false;
    remember('unavailable');
  }
  allow.addEventListener('click', () => {
    if (pending || checking) return;
    if (!navigator.geolocation || !window.isSecureContext) {
      status.textContent = 'Location is unavailable here. Continue and choose a city in the header instead.';
      continueLink.hidden = false;
      return;
    }
    pending = true;
    allow.disabled = true;
    document.body.classList.add('is-locating');
    status.textContent = 'Please choose whether to allow location in your browser’s prompt.';
    // Coordinates are neither stored nor sent to any service in this preview.
    navigator.geolocation.getCurrentPosition(() => {
      if (!pending) return;
      pending = false;
      document.body.classList.remove('is-locating');
      document.body.classList.add('location-granted');
      remember('allowed');
      status.textContent = 'Location access allowed. Taking you to the website…';
      deny.disabled = true;
      setTimeout(finish, preference.matches ? 0 : 800);
    }, error => {
      unavailable(error.code === 1
        ? 'Location was not allowed. You can continue and choose a city manually.'
        : 'We could not get a location. Continue with a city of your choice, or try again.');
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  });
  deny.addEventListener('click', () => {
    if (checking) return;
    pending = false;
    remember('declined');
    finish();
  });
  allow.disabled = true;
  deny.disabled = true;
  const user = window.StacklyAccounts?.current();
  if (!user) {
    location.replace('login.html');
  } else {
    checking = false;
    allow.disabled = false;
    deny.disabled = false;
  }
})();
