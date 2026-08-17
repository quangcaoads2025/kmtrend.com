'use strict';

(() => {
  const CORE = window.BYD_CORE;
  const COMPONENTS = window.BYD_COMPONENTS;
  const APP = window.BYD_APP;

  function initArticle() {
    COMPONENTS.renderSiteShell('news');
    APP.initHeader();
    APP.initModals();
    APP.initCalculators();
    APP.initReveal();
    APP.setImageFallbacks();

    CORE.on(document, 'click', '.article-toc a[href^="#"]', (event, link) => {
      const target = CORE.query(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      CORE.scrollToElement(target, 20);
      history.replaceState(null, '', link.getAttribute('href'));
    });
  }

  CORE.ready(initArticle);
})();
