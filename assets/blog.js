(() => {
  const searchInput = document.querySelector('[data-blog-search]');
  const filterButtons = Array.from(document.querySelectorAll('[data-blog-filter]'));
  const cards = Array.from(document.querySelectorAll('[data-blog-card]'));
  const resultCount = document.querySelector('[data-blog-count]');
  const emptyState = document.querySelector('[data-blog-empty]');
  const pagination = document.querySelector('[data-blog-pagination]');

  if (cards.length === 0) return;

  const PAGE_SIZE = 9;
  let activeCategory = 'all';
  let currentPage = 1;

  function normalizeText(value) {
    return String(value || '').trim().toLocaleLowerCase('vi');
  }

  function setCardVisible(card, visible) {
    card.hidden = !visible;
    card.classList.toggle('is-hidden', !visible);
    if (visible) {
      card.removeAttribute('aria-hidden');
    } else {
      card.setAttribute('aria-hidden', 'true');
    }
  }

  function getMatchingCards() {
    const query = normalizeText(searchInput?.value);
    return cards.filter((card) => {
      const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
      const matchesQuery = !query || normalizeText(card.dataset.search).includes(query);
      return matchesCategory && matchesQuery;
    });
  }

  function createPageButton(label, page, options = {}) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `blog-page-button${options.active ? ' is-active' : ''}`;
    button.textContent = label;
    button.disabled = Boolean(options.disabled);
    button.setAttribute('aria-label', options.ariaLabel || `Trang ${page}`);
    if (options.active) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', () => {
      if (button.disabled || currentPage === page) return;
      currentPage = page;
      render();
      document.querySelector('.blog-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return button;
  }

  function renderPagination(pageCount) {
    if (!pagination) return;
    pagination.replaceChildren();
    if (pageCount <= 1) return;

    pagination.append(createPageButton('‹', Math.max(1, currentPage - 1), {
      disabled: currentPage === 1,
      ariaLabel: 'Trang trước'
    }));

    const windowSize = 5;
    let firstPage = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let lastPage = Math.min(pageCount, firstPage + windowSize - 1);
    firstPage = Math.max(1, lastPage - windowSize + 1);

    for (let page = firstPage; page <= lastPage; page += 1) {
      pagination.append(createPageButton(String(page), page, { active: page === currentPage }));
    }

    pagination.append(createPageButton('›', Math.min(pageCount, currentPage + 1), {
      disabled: currentPage === pageCount,
      ariaLabel: 'Trang sau'
    }));
  }

  function render() {
    const matchingCards = getMatchingCards();
    const pageCount = Math.max(1, Math.ceil(matchingCards.length / PAGE_SIZE));
    currentPage = Math.min(Math.max(currentPage, 1), pageCount);

    cards.forEach((card) => setCardVisible(card, false));

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    matchingCards.slice(startIndex, startIndex + PAGE_SIZE).forEach((card) => {
      setCardVisible(card, true);
    });

    if (resultCount) resultCount.textContent = String(matchingCards.length);
    if (emptyState) emptyState.hidden = matchingCards.length !== 0;
    renderPagination(pageCount);
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((item) => {
        item.classList.remove('is-active');
        item.removeAttribute('aria-pressed');
      });
      button.classList.add('is-active');
      button.setAttribute('aria-pressed', 'true');
      activeCategory = button.dataset.blogFilter || 'all';
      currentPage = 1;
      render();
    });
  });

  searchInput?.addEventListener('input', () => {
    currentPage = 1;
    render();
  });

  render();
})();
