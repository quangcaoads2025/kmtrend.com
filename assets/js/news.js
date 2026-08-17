'use strict';

(() => {
  const CORE = window.BYD_CORE;
  const COMPONENTS = window.BYD_COMPONENTS;
  const APP = window.BYD_APP;

  function initNewsHub() {
    COMPONENTS.renderSiteShell('news');
    APP.initHeader();
    APP.initModals();
    APP.initCalculators();
    APP.initReveal();
    APP.setImageFallbacks();

    const grid = CORE.query('[data-news-grid]');
    const cards = CORE.queryAll('[data-news-card]');
    const filters = CORE.queryAll('[data-news-filter]');
    const search = CORE.query('[data-news-search]');
    const count = CORE.query('[data-news-count]');
    const pagination = CORE.query('[data-news-pagination]');
    if (!grid || !cards.length || !pagination) return;

    const pageSize = 9;
    let category = 'all';
    let term = '';
    let page = 1;
    let emptyState = null;

    cards.forEach((card) => {
      card.dataset.normalizedSearch = CORE.normalizeText(card.dataset.search || card.textContent);
    });

    function matches(card) {
      const categoryMatch = category === 'all' || card.dataset.category === category;
      const termMatch = !term || card.dataset.normalizedSearch.includes(term);
      return categoryMatch && termMatch;
    }

    function renderPagination(totalPages) {
      if (totalPages <= 1) {
        pagination.hidden = true;
        pagination.innerHTML = '';
        return;
      }
      pagination.hidden = false;
      pagination.innerHTML = Array.from({ length: totalPages }, (_, index) => {
        const number = index + 1;
        return `<button class="news-page-btn${number === page ? ' is-active' : ''}" type="button" data-page="${number}" aria-label="Trang ${number}" ${number === page ? 'aria-current="page"' : ''}>${number}</button>`;
      }).join('');
    }

    function render() {
      const matched = cards.filter(matches);
      const totalPages = Math.max(1, Math.ceil(matched.length / pageSize));
      page = CORE.clamp(page, 1, totalPages);
      const start = (page - 1) * pageSize;
      const visible = new Set(matched.slice(start, start + pageSize));

      cards.forEach((card) => { card.hidden = !visible.has(card); });
      if (count) count.textContent = String(matched.length);
      renderPagination(totalPages);

      emptyState?.remove();
      emptyState = null;
      if (!matched.length) {
        emptyState = document.createElement('div');
        emptyState.className = 'news-empty';
        emptyState.innerHTML = '<strong>Chưa tìm thấy bài viết.</strong><p>Hãy thử từ khóa hoặc chuyên mục khác.</p>';
        grid.appendChild(emptyState);
      }
    }

    filters.forEach((button) => button.addEventListener('click', () => {
      category = button.dataset.newsFilter || 'all';
      page = 1;
      filters.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      render();
    }));

    search?.addEventListener('input', CORE.debounce(() => {
      term = CORE.normalizeText(search.value);
      page = 1;
      render();
    }, 120));

    CORE.on(pagination, 'click', '[data-page]', (_event, button) => {
      page = Number(button.dataset.page) || 1;
      render();
      CORE.scrollToElement('.seo-news-section', 16);
    });

    render();
  }

  CORE.ready(initNewsHub);
})();
