// Reveal once, when the footer becomes visible. Keep content readable on failure.
(() => {
  const footer = document.querySelector('footer');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (!footer || preference.matches || !('IntersectionObserver' in window)) return;
  const parts = [
    footer.querySelector('.footer-about .brand'),
    footer.querySelector('.footer-about>p'),
    footer.querySelector('.socials'),
    ...footer.querySelectorAll('.footer-links>div'),
    footer.querySelector('.copyright')
  ].filter(Boolean);
  parts.forEach((part, index) => {
    part.classList.add('footer-entrance');
    part.style.setProperty('--footer-delay', `${index * 85}ms`);
  });
  footer.classList.add('footer-motion-ready');
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    footer.classList.add('footer-in-view');
    observer.disconnect();
  }, { threshold: 0.08 });
  observer.observe(footer);
  preference.addEventListener('change', () => {
    if (preference.matches) {
      footer.classList.add('footer-in-view');
      observer.disconnect();
    }
  });
})();
