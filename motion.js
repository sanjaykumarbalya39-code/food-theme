// Shared, restrained motion. No layout measurements or continuous scroll loops.
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const grids = '.category-grid,.dish-grid,.restaurants,.directory-grid,.menu-grid,.occasion-grid,.dining-moods,.sharing-grid,.values-grid,.perspective-grid,.topic-grid,.help-topics,.guide-grid,.steps-grid,.check-grid,.contact-steps,.neighbourhood-grid,.review-track';
  const extraCards = '.venue-card,.menu-dish,.review,.contact-step,.help-check';
  const seen = new WeakSet();
  let observer;

  function reveal(entries) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('motion-visible');
      observer.unobserve(entry.target);
    });
  }

  function prepare(root = document) {
    root.querySelectorAll(grids).forEach(grid => {
      [...grid.children].forEach((card, index) => {
        // A short stagger, capped so large collections never feel slow.
        card.style.setProperty('--entrance-delay', `${Math.min(index % 4, 3) * 65}ms`);
        if (card.classList.contains('reveal')) card.style.transitionDelay = `${Math.min(index % 4, 3) * 65}ms`;
      });
    });
    root.querySelectorAll(extraCards).forEach(card => {
      if (seen.has(card)) return;
      seen.add(card);
      if (!observer || preference.matches) return;
      card.classList.add('motion-reveal');
      observer.observe(card);
    });
  }

  if ('IntersectionObserver' in window && !preference.matches) {
    observer = new IntersectionObserver(reveal, { threshold: 0.06 });
  }
  prepare();

  // Filtering rebuilds dish and venue grids. Only inspect affected collections.
  document.querySelectorAll('#restaurant-grid,#dining-grid,#dish-grid').forEach(grid => {
    new MutationObserver(() => prepare(grid.parentElement)).observe(grid, { childList: true });
  });

  document.querySelectorAll('details').forEach(details => {
    details.addEventListener('toggle', () => {
      if (!details.open || preference.matches) return;
      const content = details.querySelector('.answer-body,p');
      if (content?.animate) content.animate(
        [{ opacity: 0, translate: '0 -4px' }, { opacity: 1, translate: '0 0' }],
        { duration: 240, easing: 'cubic-bezier(.2,.7,.3,1)' }
      );
    });
  });

  preference.addEventListener('change', () => {
    if (!preference.matches) return;
    observer?.disconnect();
    document.querySelectorAll('.motion-reveal').forEach(card => card.classList.add('motion-visible'));
  });
})();
