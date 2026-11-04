// Browser-only demonstration accounts. This is not a trusted access-control system.
(() => {
  const key = 'stackly-demo-accounts-v1';
  const sessionKey = 'stackly-demo-session-v1';
  const iterations = 210000;
  const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  function read() {
    try {
      const accounts = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(accounts)) throw new Error();
      return accounts;
    } catch { throw new Error('Browser account storage is unavailable. Please enable site storage.'); }
  }
  function write(accounts) {
    try { localStorage.setItem(key, JSON.stringify(accounts)); }
    catch { throw new Error('Your browser could not save this account. Please enable site storage.'); }
  }
  async function derive(password, salt) {
    if (!globalThis.crypto?.subtle) throw new Error('This browser needs a secure page for password hashing. Use HTTPS or localhost with Live Server.');
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: Uint8Array.from(salt.match(/.{2}/g), value => parseInt(value, 16)), iterations, hash: 'SHA-256' }, material, 256);
    return hex(new Uint8Array(bits));
  }
  function validate(data) {
    const email = String(data.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Enter a valid email address.');
    if (typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 128) throw new Error('Use a password of 8–128 characters.');
    return email;
  }
  async function register(data) {
    const email = validate(data);
    const name = String(data.name || '').trim();
    if (name.length < 2 || name.length > 80) throw new Error('Enter your name (2–80 characters).');
    if (read().some(account => account.email === email)) throw new Error('This email is already registered in this browser. Please log in.');
    const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
    const passwordHash = await derive(data.password, salt);
    const accounts = read();
    if (accounts.some(account => account.email === email)) throw new Error('This email is already registered. Please log in.');
    accounts.push({ id: hex(crypto.getRandomValues(new Uint8Array(16))), name, email, salt, passwordHash });
    write(accounts);
    return { ok: true };
  }
  async function login(data) {
    const email = validate(data);
    const account = read().find(account => account.email === email);
    if (!account || !/^[a-f0-9]{32}$/.test(account.salt || '')) throw new Error('Email or password is incorrect. Register first if you have not created an account in this browser.');
    const passwordHash = await derive(data.password, account.salt);
    if (passwordHash !== account.passwordHash) throw new Error('Email or password is incorrect.');
    try { sessionStorage.setItem(sessionKey, JSON.stringify({ id: account.id, expires: Date.now() + 86400000 })); }
    catch { throw new Error('Your browser could not start a session. Please enable site storage.'); }
    return { user: { id: account.id, name: account.name, email: account.email } };
  }
  function current() {
    try {
      const session = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
      if (!session || session.expires <= Date.now()) { sessionStorage.removeItem(sessionKey); return null; }
      const account = read().find(account => account.id === session.id);
      return account ? { id: account.id, name: account.name, email: account.email, phone: account.phone || '' } : null;
    } catch { return null; }
  }
  function logout() { sessionStorage.removeItem(sessionKey); return { ok: true }; }
  function storageKey(base) {
    const user = current();
    if (!user) return base;
    const scoped = `${base}:${user.id}`;
    // Bring selections made before login into this account once. Never read
    // another account's data, and clear guest data only after saving succeeds.
    if (['stackly-cart-v1', 'faaaahh-saved-dishes', 'faaaahh-saved-restaurants'].includes(base)) {
      try {
        const guest = JSON.parse(localStorage.getItem(base) || '[]');
        const existing = JSON.parse(localStorage.getItem(scoped) || '[]');
        if (Array.isArray(guest) && guest.length && Array.isArray(existing)) {
          let merged;
          if (base === 'stackly-cart-v1') {
            const items = new Map();
            [...existing, ...guest].forEach(item => {
              if (item && typeof item.id === 'string' && Number.isInteger(item.quantity) && item.quantity > 0)
                items.set(item.id, Math.min(20, (items.get(item.id) || 0) + item.quantity));
            });
            merged = [...items].map(([id, quantity]) => ({ id, quantity }));
          } else merged = [...new Set([...existing, ...guest].filter(id => typeof id === 'string'))];
          localStorage.setItem(scoped, JSON.stringify(merged));
          localStorage.removeItem(base);
        }
      } catch { /* Leave guest selections intact if storage is unavailable. */ }
    }
    return scoped;
  }
  function updateProfile({ name, phone = '' }) {
    const user = current();
    if (!user) throw new Error('Please log in to update your profile.');
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) throw new Error('Enter your name (2–80 characters).');
    if (phone && !/^[6-9][0-9]{9}$/.test(phone)) throw new Error('Enter a valid 10-digit Indian mobile number.');
    const accounts = read();
    const account = accounts.find(account => account.id === user.id);
    account.name = name.trim(); account.phone = phone;
    write(accounts);
    return current();
  }
  window.StacklyAccounts = { register, login, current, logout, storageKey, updateProfile };
})();
