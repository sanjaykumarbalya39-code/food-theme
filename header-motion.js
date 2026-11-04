// A single highlight travels between links; the layout itself never moves.
(() => {
  const header = document.querySelector('.header');
  const nav = header?.querySelector('nav');
  if (!nav) return;
  const links = [...nav.querySelectorAll('a')];
  const marker = document.createElement('span');
  marker.className = 'nav-glider';
  marker.setAttribute('aria-hidden', 'true');
  nav.prepend(marker);
  nav.classList.add('nav-has-motion');
  links.forEach((link, index) => link.style.setProperty('--nav-order', index));
  let target = links.find(link => link.matches('.active,[aria-current="page"]'));
  let frame;

  function position(link) {
    target = link;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (!target) {
        marker.classList.remove('is-shown');
        return;
      }
      const parent = nav.getBoundingClientRect();
      const bounds = target.getBoundingClientRect();
      nav.style.setProperty('--glider-x', `${bounds.left - parent.left + nav.scrollLeft - 10}px`);
      nav.style.setProperty('--glider-y', `${bounds.top - parent.top + nav.scrollTop + 3}px`);
      nav.style.setProperty('--glider-width', `${bounds.width + 20}px`);
      nav.style.setProperty('--glider-height', `${bounds.height - 6}px`);
      marker.classList.add('is-shown');
    });
  }
  function restore() {
    const focused = links.find(link => link === document.activeElement);
    position(focused || links.find(link => link.matches('.active,[aria-current="page"]')));
  }
  links.forEach(link => {
    link.addEventListener('pointerenter', () => position(link));
    link.addEventListener('focus', () => position(link));
    link.addEventListener('click', () => requestAnimationFrame(restore));
  });
  nav.addEventListener('pointerleave', restore);
  nav.addEventListener('focusout', () => requestAnimationFrame(restore));
  if ('ResizeObserver' in window) new ResizeObserver(() => position(target)).observe(nav);
  // Language changes alter link widths even when the navigation container stays fixed.
  new MutationObserver(() => position(target)).observe(nav, { childList: true, characterData: true, subtree: true });
  window.addEventListener('resize', () => position(target), { passive: true });
  document.fonts?.ready.then(() => position(target));
  position(target);
})();
