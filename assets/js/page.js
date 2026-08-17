'use strict';

(() => {
  const CORE = window.BYD_CORE;
  const COMPONENTS = window.BYD_COMPONENTS;
  const APP = window.BYD_APP;

  function initLanguageTabs() {
    const tabs = CORE.queryAll('[data-language-tab]');
    const panels = CORE.queryAll('[data-language-panel]');
    if (!tabs.length || !panels.length) return;

    const activate = (language) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.languageTab === language;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.languagePanel !== language;
      });
      CORE.queryAll('[data-lang-vi][data-lang-en]').forEach((element) => {
        const text = language === 'en' ? element.dataset.langEn : element.dataset.langVi;
        if (text) element.textContent = text;
      });
      document.documentElement.lang = language === 'en' ? 'en' : 'vi';
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab.dataset.languageTab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const next = tabs[(index + direction + tabs.length) % tabs.length];
        activate(next.dataset.languageTab);
        next.focus();
      });
    });
    activate('vi');
  }

  function initStaticPage() {
    const page = document.body.dataset.page || 'home';
    COMPONENTS.renderSiteShell(page);
    APP.initHeader();
    APP.initModals();
    APP.initCalculators();
    APP.initReveal();
    APP.setImageFallbacks();
    initLanguageTabs();
  }

  CORE.ready(initStaticPage);
})();
