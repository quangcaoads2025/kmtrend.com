
(() => {
  const switcher = document.querySelector('[data-language-switcher]');
  if (switcher) {
    const buttons = [...switcher.querySelectorAll('button[data-lang]')];
    const panels = [...document.querySelectorAll('[data-language-panel]')];
    const selectLanguage = (lang) => {
      buttons.forEach((button) => {
        const active = button.dataset.lang === lang;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.languagePanel !== lang;
      });
      document.documentElement.lang = lang === 'en' ? 'en' : 'vi';
      try { localStorage.setItem('kmtrend-policy-language', lang); } catch (_) {}
    };
    buttons.forEach((button) => button.addEventListener('click', () => selectLanguage(button.dataset.lang)));
    let initial = 'vi';
    try { initial = localStorage.getItem('kmtrend-policy-language') || 'vi'; } catch (_) {}
    if (!buttons.some((button) => button.dataset.lang === initial)) initial = 'vi';
    selectLanguage(initial);
  }
})();
