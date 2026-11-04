const form = document.querySelector('#account-form');
const status = document.querySelector('#account-status');
const submit = document.querySelector('#submit-account');
let mode = 'login';
let busy = false;

function setMode(next) {
  if (busy) return;
  mode = next === 'register' ? 'register' : 'login';
  const registering = mode === 'register';
  document.querySelectorAll('.account-tabs [data-mode]').forEach(button => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  for (const field of ['name', 'confirm']) {
    form.elements[field].disabled = !registering;
    form.elements[field].required = registering;
    document.querySelector(`#${field}-field`).hidden = !registering;
  }
  form.elements.password.value = '';
  form.elements.confirm.value = '';
  form.elements.confirm.setCustomValidity('');
  form.elements.password.autocomplete = registering ? 'new-password' : 'current-password';
  document.querySelector('#account-kicker').textContent = registering ? 'A LITTLE INTRODUCTION' : 'GOOD TO SEE YOU AGAIN';
  document.querySelector('#account-title').textContent = registering ? 'Create your account.' : 'Welcome back.';
  document.querySelector('#account-description').textContent = registering ? 'Register your details, then log in to your new account.' : 'Log in with the email and password you registered.';
  submit.textContent = registering ? 'Register' : 'Login';
  document.querySelector('#account-switch').innerHTML = registering ? 'Already registered? <button type="button" data-mode="login">Go to Login</button>' : 'New to Stackly? <button type="button" data-mode="register">Create an account</button>';
  status.textContent = '';
  try { history.replaceState(null, '', registering ? 'signup.html' : 'login.html'); } catch {}
}

document.querySelector('.account-card').addEventListener('click', event => {
  const button = event.target.closest('[data-mode]');
  if (button) setMode(button.dataset.mode);
});
document.querySelector('.password-toggle').addEventListener('click', event => {
  const visible = form.elements.password.type === 'password';
  form.elements.password.type = visible ? 'text' : 'password';
  event.currentTarget.textContent = visible ? 'Hide' : 'Show';
  event.currentTarget.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
  event.currentTarget.setAttribute('aria-pressed', String(visible));
});
form.elements.confirm.addEventListener('input', () => form.elements.confirm.setCustomValidity(''));
form.elements.password.addEventListener('input', () => form.elements.confirm.setCustomValidity(''));

async function accountRequest(action, data) {
  if (!window.StacklyAccounts) throw new Error('Account scripts could not load. Refresh this page and try again.');
  return window.StacklyAccounts[action](data);
}

function showSignedIn(user) {
  document.querySelector('#signed-out').hidden = true;
  document.querySelector('#signed-in').hidden = false;
  document.querySelector('#welcome-name').textContent = `Welcome, ${user.name}.`;
  document.querySelector('#account-email').textContent = user.email;
  status.textContent = '';
  form.reset();
  refreshAccountNavigation();
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  if (mode === 'register' && form.elements.password.value !== form.elements.confirm.value) {
    form.elements.confirm.setCustomValidity('Passwords do not match.');
    form.elements.confirm.reportValidity();
    return;
  }
  busy = true;
  submit.disabled = true;
  document.querySelectorAll('.account-tabs button').forEach(button => button.disabled = true);
  status.textContent = mode === 'register' ? 'Creating your account…' : 'Logging in…';
  try {
    const data = { name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), password: form.elements.password.value };
    const registering = mode === 'register';
    const result = await accountRequest(registering ? 'register' : 'login', data);
    if (registering) {
      busy = false;
      setMode('login');
      status.textContent = 'Registration successful. Please log in with your email and password.';
      form.elements.password.focus();
    } else window.location.assign('location-permission.html');
  } catch (error) { status.textContent = error.message; }
  finally {
    busy = false;
    submit.disabled = false;
    document.querySelectorAll('.account-tabs button').forEach(button => button.disabled = false);
  }
});

document.querySelector('#logout-account').addEventListener('click', async event => {
  event.currentTarget.disabled = true;
  try {
    await accountRequest('logout', {});
    document.querySelector('#signed-in').hidden = true;
    document.querySelector('#signed-out').hidden = false;
    setMode('login');
    status.textContent = 'You have been logged out.';
    refreshAccountNavigation();
  } catch (error) { status.textContent = error.message; }
  finally { event.currentTarget.disabled = false; }
});
const requestedMode = new URLSearchParams(location.search).get('mode');
setMode(requestedMode === 'register' || location.pathname.endsWith('/signup.html') ? 'register' : 'login');
const currentUser = window.StacklyAccounts?.current();
if (currentUser) window.location.replace('dashboard.html');
