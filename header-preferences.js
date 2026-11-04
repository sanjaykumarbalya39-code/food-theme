// Enhance the existing selects while preserving their change events and storage.
(() => {
  const cities = [
    'Agartala','Agra','Ahmedabad','Aizawl','Ajmer','Alappuzha','Amaravati','Amritsar','Aurangabad','Bengaluru','Bhopal','Bhubaneswar','Chandigarh','Chennai','Coimbatore','Cuttack','Dehradun','Delhi','Dhanbad','Dharamshala','Dimapur','Durgapur','Faridabad','Gangtok','Ghaziabad','Goa','Gorakhpur','Guntur','Gurugram','Guwahati','Gwalior','Hyderabad','Imphal','Indore','Itanagar','Jabalpur','Jaipur','Jalandhar','Jammu','Jamshedpur','Jodhpur','Kanpur','Kochi','Kohima','Kolhapur','Kolkata','Kota','Kottayam','Kozhikode','Lucknow','Ludhiana','Madurai','Mangaluru','Meerut','Mumbai','Mysuru','Nagpur','Nashik','Navi Mumbai','Noida','Ooty','Panaji','Patna','Puducherry','Pune','Raipur','Rajkot','Ranchi','Rishikesh','Salem','Shillong','Shimla','Siliguri','Solapur','Srinagar','Surat','Thane','Thiruvananthapuram','Thrissur','Tiruchirappalli','Tirunelveli','Tirupati','Udaipur','Vadodara','Varanasi','Vellore','Vijayawada','Visakhapatnam','Warangal'
  ];
  const languages = window.StacklyLanguages || [{ value: 'en', name: 'English', native: 'English', code: 'EN', labels: [] }];
  const pin = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
  const globe = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
  const chevron = '<svg class="preference-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let opened = null;

  function createPreference(kind) {
    const select = document.querySelector(`#${kind}-select`);
    if (!select) return;
    const native = select.closest('label');
    if (kind === 'language') {
      languages.forEach(language => { if (![...select.options].some(option => option.value === language.value)) select.add(new Option(language.code, language.value)); });
      try {
        const saved = localStorage.getItem('faaaahh-language');
        if (languages.some(language => language.value === saved)) select.value = saved;
      } catch {}
    }

    if (kind === 'location') {
      cities.forEach(city => { if (![...select.options].some(option => option.value === city)) select.add(new Option(city, city)); });
      try {
        const saved = localStorage.getItem('faaaahh-location');
        if (saved && saved.length <= 100) {
          if (![...select.options].some(option => option.value === saved)) select.add(new Option(saved, saved));
          select.value = saved;
        } else select.value = 'Bengaluru';
      } catch {}
    }
    const wrapper = document.createElement('div');
    wrapper.className = `preference-control preference-${kind}`;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'preference-trigger';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `${kind}-popover`);
    trigger.innerHTML = `${kind === 'location' ? pin : globe}<span class="preference-value-group">${kind === 'location' ? '<span class="preference-caption">Your location</span>' : ''}<span class="preference-value"></span></span>${chevron}`;
    wrapper.append(trigger);
    native.before(wrapper);

    const panel = document.createElement('div');
    panel.id = `${kind}-popover`;
    panel.className = `preference-popover ${kind}-popover`;
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', `${kind}-popover-title`);
    panel.innerHTML = `<div class="preference-panel-head"><div><span class="preference-panel-kicker">${kind === 'location' ? 'MAKE IT LOCAL' : 'MAKE IT FAMILIAR'}</span><h2 id="${kind}-popover-title">${kind === 'location' ? 'Where are you exploring?' : 'Your preferred language'}</h2></div><button type="button" class="preference-close" aria-label="Close ${kind} options">&times;</button></div>${kind === 'location' ? '<label class="location-search-wrap"><input class="location-search" type="search" maxlength="100" placeholder="Search a city or enter any location" aria-label="Search locations" autocomplete="off"></label><p class="preference-list-label">POPULAR CITIES & MORE</p>' : '<label class="location-search-wrap"><input class="language-search" type="search" placeholder="Search a language" aria-label="Search languages" autocomplete="off"></label><p class="preference-list-label">WORLD LANGUAGES</p>'}<div class="preference-options"></div><p class="preference-panel-note">${kind === 'location' ? 'Cities across India, or enter a location anywhere. Listings remain illustrative in this preview.' : 'Changes the header labels. Full-page translation is not available yet.'}</p>`;
    document.body.append(panel);
    const options = panel.querySelector('.preference-options');
    const input = panel.querySelector('input');

    function update() {
      const value = kind === 'location' ? (select.value || 'Choose a city') : (languages.find(item => item.value === select.value)?.code || 'EN');
      trigger.querySelector('.preference-value').textContent = value;
      trigger.title = kind === 'location' ? `Change location: ${value}` : `Change language: ${languages.find(item => item.value === select.value)?.name || 'English'}`;
      trigger.setAttribute('aria-label', trigger.title);
      if (kind === 'language') {
        const language = languages.find(item => item.value === select.value);
        const labels = language?.labels;
        if (labels?.length === 10) {
          document.querySelectorAll('.header nav a').forEach((link, index) => { link.textContent = labels[index]; link.lang = language.value; link.dir = ['ar','fa','he','ur'].includes(language.value) ? 'rtl' : 'ltr'; });
          const login = document.querySelector('.header .login .control-label');
          const cart = document.querySelector('.header .cart-button .control-label');
          if (login) { login.textContent = labels[7]; login.lang = language.value; }
          if (cart) { cart.textContent = labels[8]; cart.lang = language.value; }
          select.options[0].textContent = labels[9];
          try { localStorage.setItem('faaaahh-language', language.value); } catch {}
          document.querySelector('.header nav').classList.toggle('localized-nav', language.value !== 'en');
        }
      }
    }
    function choose(value) {
      if (kind === 'location' && ![...select.options].some(option => option.value === value)) select.add(new Option(value, value));
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      update();
      close(true);
    }
    function render() {
      options.replaceChildren();
      const query = input?.value.trim() || '';
      const rows = kind === 'location'
        ? [...new Set([select.value, ...cities].filter(Boolean))].filter(value => value.toLowerCase().includes(query.toLowerCase())).map(value => ({ value, name: value, native: value === select.value ? 'Current location' : 'India' }))
        : languages.filter(language => `${language.name} ${language.native} ${language.code}`.toLowerCase().includes(query.toLowerCase()));
      rows.forEach(row => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'preference-option';
        button.setAttribute('aria-pressed', String(row.value === select.value));
        const text = document.createElement('span');
        const name = document.createElement('strong');
        name.textContent = row.name;
        const detail = document.createElement('small');
        detail.textContent = row.native;
        text.append(name, detail);
        const check = document.createElement('span');
        check.className = 'preference-check';
        check.setAttribute('aria-hidden', 'true');
        check.textContent = row.value === select.value ? '\u2713' : '';
        button.append(text, check);
        button.addEventListener('click', () => choose(row.value));
        options.append(button);
      });
      if (kind === 'location' && query.length >= 2 && !rows.some(row => row.value.toLowerCase() === query.toLowerCase())) {
        const custom = document.createElement('button');
        custom.type = 'button';
        custom.className = 'preference-custom-location';
        custom.textContent = `Use "${query}" as my location`;
        custom.addEventListener('click', () => choose(query));
        options.append(custom);
      } else if (!rows.length) {
        const empty = document.createElement('p');
        empty.className = 'preference-empty';
        empty.textContent = kind === 'location' ? 'Type at least two characters to add your location.' : 'No matching language. Try its English or native name.';
        options.append(empty);
      }
    }
    function position() {
      const bounds = trigger.getBoundingClientRect();
      const width = Math.min(kind === 'location' ? 360 : 340, innerWidth - 24);
      panel.style.width = `${width}px`;
      panel.style.left = `${Math.max(12, Math.min(bounds.right - width, innerWidth - width - 12))}px`;
      panel.style.top = `${Math.min(bounds.bottom + 12, innerHeight - 180)}px`;
      panel.style.maxHeight = `${Math.max(150, innerHeight - Math.min(bounds.bottom + 12, innerHeight - 180) - 12)}px`;
    }
    function close(restoreFocus = false) {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (opened?.panel === panel) opened = null;
      if (restoreFocus) trigger.focus();
    }
    function open() {
      opened?.close();
      if (input) input.value = '';
      render();
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      position();
      opened = { panel, trigger, close };
      (input || options.querySelector('[aria-pressed="true"]') || options.querySelector('button')).focus({ preventScroll: true });
    }
    trigger.addEventListener('click', () => panel.hidden ? open() : close());
    trigger.addEventListener('keydown', event => { if (event.key === 'ArrowDown') { event.preventDefault(); open(); } });
    panel.querySelector('.preference-close').addEventListener('click', () => close(true));
    input?.addEventListener('input', render);
    panel.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); close(true); } });
    select.addEventListener('change', update);
    native.classList.add('preference-native');
    update();
  }
  createPreference('location');
  createPreference('language');
  document.addEventListener('pointerdown', event => {
    if (opened && !opened.panel.contains(event.target) && !opened.trigger.contains(event.target)) opened.close();
  });
  document.addEventListener('focusin', event => {
    if (opened && !opened.panel.contains(event.target) && !opened.trigger.contains(event.target)) opened.close();
  });
  window.addEventListener('resize', () => opened?.close(), { passive: true });
  window.addEventListener('scroll', event => {
    if (opened && !(event.target instanceof Node && opened.panel.contains(event.target))) opened.close();
  }, { passive: true, capture: true });
})();
