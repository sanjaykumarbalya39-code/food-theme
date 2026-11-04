// Reflect the browser-only demo session on every page.
function refreshAccountNavigation() {
  try {
    const user = window.StacklyAccounts?.current();
    document.querySelectorAll('a.login').forEach(link => {
      link.classList.toggle('is-authenticated', Boolean(user));
      link.href = user ? 'dashboard.html' : 'login.html';
      link.title = user ? `Account: ${user.name}` : 'Login';
      link.setAttribute('aria-label', user ? `Open account for ${user.name}` : 'Login');
    });
  } catch { /* The public pages remain usable when browser storage is disabled. */ }
}
refreshAccountNavigation();
