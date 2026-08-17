'use strict';

(() => {
  const CORE = window.BYD_CORE;
  const CONFIG = window.BYD_CONFIG || {};
  const DATA = window.BYD_DATA || {};
  const COMPONENTS = window.BYD_COMPONENTS || {};

  if (!CORE) throw new Error('BYD_CORE must be loaded before app.js');

  const {
    query: $,
    queryAll: $$,
    clamp,
    normalizeText,
    parseMoney,
    money,
    formatMoneyInput,
    debounce,
    rafThrottle,
    on,
    FocusTrap,
    reducedMotion
  } = CORE;

  const state = {
    openModal: null,
    modalTrap: null,
    bodyScrollY: 0
  };

  const getHeaderOffset = () => $('.site-header')?.offsetHeight || 72;

  function setImageFallbacks(root = document) {
    $$('img[data-fallback]', root).forEach((image) => {
      if (image.dataset.fallbackReady === 'true') return;
      image.dataset.fallbackReady = 'true';
      image.addEventListener('error', () => {
        const fallback = image.dataset.fallback;
        if (!fallback || image.dataset.fallbackUsed === 'true') return;
        image.dataset.fallbackUsed = 'true';
        image.removeAttribute('srcset');
        image.src = fallback.startsWith('/') ? fallback : `/${fallback.replace(/^\.\//, '')}`;
      }, { once: true });
    });
  }

  function lockPage() {
    state.bodyScrollY = window.scrollY;
    document.body.style.top = `-${state.bodyScrollY}px`;
    document.body.classList.add('is-locked');
  }

  function unlockPage() {
    document.body.classList.remove('is-locked');
    document.body.style.removeProperty('top');
    window.scrollTo(0, state.bodyScrollY);
  }

  function initHeader() {
    const header = $('.site-header');
    if (!header || header.dataset.initialized === 'true') return;
    header.dataset.initialized = 'true';

    const menu = $('.mobile-menu', header);
    const backdrop = $('.mobile-menu-backdrop', header);
    const toggle = $('.menu-toggle', header);
    const closeButton = $('.mobile-menu__close', header);
    const megaItem = $('.nav-item--mega', header);
    const megaButton = $('.nav-link--button', megaItem || header);
    const scrollTopButton = $('[data-scroll-top]');
    const floatingContact = $('.floating-contact');
    const footer = $('.footer');
    let mobileTrap = null;

    const updateHeader = rafThrottle(() => {
      const scrolled = window.scrollY > 12;
      header.classList.toggle('is-scrolled', scrolled);
      document.documentElement.style.setProperty('--site-header-height', `${header.offsetHeight}px`);
      if (scrollTopButton) scrollTopButton.classList.toggle('is-visible', window.scrollY > 480);
    });

    const closeMegaMenu = () => {
      megaItem?.classList.remove('is-open');
      megaButton?.setAttribute('aria-expanded', 'false');
    };

    const closeMobileMenu = ({ restoreFocus = true } = {}) => {
      if (!menu?.classList.contains('is-open')) return;
      menu.classList.remove('is-open');
      backdrop?.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      backdrop?.setAttribute('aria-hidden', 'true');
      toggle?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
      unlockPage();
      mobileTrap?.deactivate();
      if (!restoreFocus) mobileTrap = null;
    };

    const openMobileMenu = () => {
      if (!menu || menu.classList.contains('is-open')) return;
      closeMegaMenu();
      menu.classList.add('is-open');
      backdrop?.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      backdrop?.setAttribute('aria-hidden', 'false');
      toggle?.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      lockPage();
      mobileTrap = new FocusTrap(menu);
      mobileTrap.activate(closeButton);
    };

    toggle?.addEventListener('click', () => {
      menu?.classList.contains('is-open') ? closeMobileMenu() : openMobileMenu();
    });
    closeButton?.addEventListener('click', () => closeMobileMenu());
    backdrop?.addEventListener('click', () => closeMobileMenu());

    on(menu, 'click', 'a', () => closeMobileMenu({ restoreFocus: false }));

    megaButton?.addEventListener('click', (event) => {
      event.stopPropagation();
      const nextState = !megaItem.classList.contains('is-open');
      megaItem.classList.toggle('is-open', nextState);
      megaButton.setAttribute('aria-expanded', String(nextState));
    });

    megaItem?.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover) and (min-width: 1025px)').matches) {
        megaItem.classList.add('is-open');
        megaButton?.setAttribute('aria-expanded', 'true');
      }
    });
    megaItem?.addEventListener('mouseleave', () => {
      if (window.matchMedia('(hover: hover) and (min-width: 1025px)').matches) closeMegaMenu();
    });

    document.addEventListener('click', (event) => {
      if (megaItem && !megaItem.contains(event.target)) closeMegaMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeMegaMenu();
      closeMobileMenu();
      if (state.openModal) closeModal(state.openModal);
    });

    scrollTopButton?.addEventListener('click', () => window.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? 'auto' : 'smooth'
    }));

    window.addEventListener('scroll', updateHeader, { passive: true });
    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth > 1024) closeMobileMenu({ restoreFocus: false });
      updateHeader();
    }, 120), { passive: true });

    if (floatingContact && footer && 'IntersectionObserver' in window) {
      const footerObserver = new IntersectionObserver(([entry]) => {
        floatingContact.classList.toggle('is-footer-visible', entry.isIntersecting);
      }, { rootMargin: '0px 0px -24px 0px', threshold: 0.04 });
      footerObserver.observe(footer);
    }

    updateHeader();
  }

  function initHeroSlider() {
    const slider = $('[data-hero-slider]');
    if (!slider || slider.dataset.initialized === 'true') return;
    slider.dataset.initialized = 'true';

    const slides = $$('.hero-slide', slider);
    const dots = $$('.hero-dot', slider);
    const previous = $('[data-hero-prev]', slider);
    const next = $('[data-hero-next]', slider);
    if (slides.length < 2) return;

    let index = Math.max(0, slides.findIndex(slide => slide.classList.contains('is-active')));
    let timer = null;

    const show = (nextIndex, userInitiated = false) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, position) => {
        const active = position === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach((dot, position) => {
        const active = position === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
      if (userInitiated) restart();
    };

    const stop = () => {
      window.clearInterval(timer);
      timer = null;
    };
    const start = () => {
      if (reducedMotion.matches || document.hidden || timer) return;
      timer = window.setInterval(() => show(index + 1), 6500);
    };
    const restart = () => { stop(); start(); };

    previous?.addEventListener('click', () => show(index - 1, true));
    next?.addEventListener('click', () => show(index + 1, true));
    dots.forEach((dot, position) => dot.addEventListener('click', () => show(position, true)));
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

    show(index);
    start();
  }

  function vehicleMatchesFilter(vehicle, filter) {
    const segment = normalizeText(vehicle.segment);
    const powertrain = normalizeText(vehicle.powertrain);
    const rules = {
      all: true,
      ev: powertrain === 'ev',
      'dm-i': powertrain.includes('dm-i'),
      hatchback: segment.includes('hatchback'),
      sedan: segment.includes('sedan'),
      suv: segment.includes('suv') || segment.includes('crossover'),
      mpv: segment.includes('mpv')
    };
    return Boolean(rules[filter]);
  }

  function initVehicleGrid() {
    const grid = $('[data-vehicle-grid]');
    if (!grid || grid.dataset.initialized === 'true') return;
    grid.dataset.initialized = 'true';

    const vehicles = Array.isArray(DATA.vehicles) ? [...DATA.vehicles].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)) : [];
    const search = $('[data-vehicle-search-input]');
    const filters = $$('[data-vehicle-filter]');
    const count = $('[data-vehicle-result-count]');
    const pagination = $('[data-vehicle-pagination]');
    const previous = $('[data-vehicle-prev]');
    const next = $('[data-vehicle-next]');
    const status = $('[data-vehicle-page-status]');
    const perPage = 6;
    let activeFilter = 'all';
    let term = '';
    let page = 1;

    const filteredVehicles = () => vehicles.filter((vehicle) => {
      const haystack = normalizeText([
        vehicle.name,
        vehicle.segment,
        vehicle.powertrain,
        vehicle.tagline,
        vehicle.shortDescription,
        ...(vehicle.badges || [])
      ].join(' '));
      return vehicleMatchesFilter(vehicle, activeFilter) && (!term || haystack.includes(term));
    });

    const render = () => {
      const matched = filteredVehicles();
      const pageCount = Math.max(1, Math.ceil(matched.length / perPage));
      page = clamp(page, 1, pageCount);
      const visible = matched.slice((page - 1) * perPage, page * perPage);

      grid.innerHTML = visible.length
        ? visible.map(COMPONENTS.renderVehicleCard).join('')
        : '<div class="empty-state"><strong>Chưa tìm thấy mẫu xe phù hợp.</strong><p>Hãy thử từ khóa hoặc bộ lọc khác.</p></div>';

      if (count) count.textContent = `${matched.length} mẫu xe`;
      if (status) status.textContent = `Trang ${page} / ${pageCount}`;
      if (previous) previous.disabled = page <= 1;
      if (next) next.disabled = page >= pageCount;
      if (pagination) pagination.hidden = matched.length <= perPage;
      setImageFallbacks(grid);
    };

    filters.forEach((button) => button.addEventListener('click', () => {
      activeFilter = button.dataset.vehicleFilter || 'all';
      page = 1;
      filters.forEach(item => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      render();
    }));

    search?.addEventListener('input', debounce(() => {
      term = normalizeText(search.value);
      page = 1;
      render();
    }, 120));

    previous?.addEventListener('click', () => {
      page -= 1;
      render();
      CORE.scrollToElement(grid, 16);
    });
    next?.addEventListener('click', () => {
      page += 1;
      render();
      CORE.scrollToElement(grid, 16);
    });

    on(grid, 'click', '.vehicle-card', (event, card) => {
      if (event.target.closest('a, button, input, select, textarea')) return;
      const link = $('h3 a', card);
      link?.click();
    });

    on(grid, 'keydown', '.vehicle-card', (event, card) => {
      if (!['Enter', ' '].includes(event.key) || event.target !== card) return;
      event.preventDefault();
      $('h3 a', card)?.click();
    });

    render();
  }

  function initTechnologyCards() {
    const grid = $('[data-technology-grid]');
    if (!grid || grid.dataset.initialized === 'true') return;
    grid.dataset.initialized = 'true';
    const iconNames = ['battery', 'spark', 'shield', 'wrench'];
    grid.innerHTML = (DATA.technology || []).map((item, index) => `
      <article class="technology-card">
        <div class="technology-card__icon">${COMPONENTS.icon(iconNames[index] || 'spark')}</div>
        <span>${CORE.escapeHtml(item.eyebrow || '')}</span>
        <h3>${CORE.escapeHtml(item.title || '')}</h3>
        <p>${CORE.escapeHtml(item.description || '')}</p>
        <small>${CORE.escapeHtml(item.metric || '')}</small>
      </article>
    `).join('');
  }

  function initServiceCards() {
    const grid = $('[data-service-grid]');
    if (!grid || grid.dataset.initialized === 'true') return;
    grid.dataset.initialized = 'true';
    const iconNames = ['message', 'tag', 'steering', 'bank', 'wrench', 'shield'];
    grid.innerHTML = (DATA.services || []).map((item, index) => `
      <article class="service-card">
        <div class="service-card__icon">${COMPONENTS.icon(iconNames[index] || 'check')}</div>
        <h3>${CORE.escapeHtml(item.title || '')}</h3>
        <p>${CORE.escapeHtml(item.description || '')}</p>
      </article>
    `).join('');
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        .format(new Date(`${value}T00:00:00`));
    } catch (_) {
      return value;
    }
  }

  function initNews() {
    const grid = $('[data-news-grid]');
    if (!grid || grid.dataset.initialized === 'true') return;
    grid.dataset.initialized = 'true';
    const articles = Array.isArray(DATA.news) ? DATA.news.slice(0, 4) : [];
    if (!articles.length) return;

    const [featured, ...secondary] = articles;
    const articleMarkup = (article, featuredCard = false) => `
      <article class="${featuredCard ? 'news-featured' : 'news-card'}">
        <a class="${featuredCard ? 'news-featured__image' : 'news-card__image'}" href="${article.url || `/tin-tuc/${article.slug}/`}">
          ${(() => {
            const source = `/${String(article.image || '').replace(/^\//, '')}`;
            const small = source.replace(/\.webp(?:\?.*)?$/, '-384.webp');
            const compact = source.replace(/\.webp(?:\?.*)?$/, '-672.webp');
            const responsive = source.replace(/\.webp(?:\?.*)?$/, '-768.webp');
            const medium = source.replace(/\.webp(?:\?.*)?$/, '-1200.webp');
            const hasResponsive = /(?:showroom-hero|showroom-launch|test-drive-experience)\.webp$/.test(source);
            return `<img src="${hasResponsive ? small : source}"${hasResponsive ? ` srcset="${small} 384w, ${compact} 672w, ${responsive} 768w, ${medium} 1200w, ${source} 1600w" sizes="${featuredCard ? '(max-width: 768px) calc(100vw - 34px), 62vw' : '(max-width: 768px) 128px, 320px'}"` : ''} data-fallback="/assets/images/showroom-hero.webp" alt="${CORE.escapeHtml(article.title)}" width="1600" height="900" loading="${featuredCard ? 'eager' : 'lazy'}" decoding="async">`;
          })()}
        </a>
        <div class="${featuredCard ? 'news-featured__body' : 'news-card__body'}">
          <div class="news-card__meta"><span>${CORE.escapeHtml(article.category || 'Tin tức')}</span><time datetime="${article.date}">${formatDate(article.date)}</time></div>
          <h3><a href="${article.url || `/tin-tuc/${article.slug}/`}">${CORE.escapeHtml(article.title)}</a></h3>
          <p>${CORE.escapeHtml(article.excerpt || '')}</p>
          <a class="text-link" href="${article.url || `/tin-tuc/${article.slug}/`}">Xem bài viết ${COMPONENTS.icon('chevronRight')}</a>
        </div>
      </article>`;

    grid.innerHTML = `${articleMarkup(featured, true)}<div class="news-list">${secondary.map(article => articleMarkup(article)).join('')}</div>`;
    setImageFallbacks(grid);
  }

  function initMapTabs() {
    const frame = $('[data-map-frame]');
    const name = $('[data-map-name]');
    const address = $('[data-map-address]');
    const directions = $('[data-map-directions]');
    if (!frame) return;

    const showroom = CONFIG.showrooms?.showroom4s;
    if (!showroom) return;
    const queryValue = encodeURIComponent(showroom.mapQuery || showroom.address || showroom.name);
    frame.src = `https://www.google.com/maps?q=${queryValue}&output=embed`;
    frame.title = `Bản đồ ${showroom.name}`;
    if (name) name.textContent = showroom.name;
    if (address) address.textContent = showroom.address;
    if (directions) directions.href = `https://www.google.com/maps/search/?api=1&query=${queryValue}`;
  }

  function initFaq() {
    const list = $('[data-faq-list]');
    if (!list || list.dataset.initialized === 'true') return;
    list.dataset.initialized = 'true';
    list.innerHTML = (DATA.faqs || []).map((item, index) => `
      <details class="faq-item" ${index === 0 ? 'open' : ''}>
        <summary>${CORE.escapeHtml(item.question)}<span aria-hidden="true">+</span></summary>
        <div><p>${CORE.escapeHtml(item.answer)}</p></div>
      </details>
    `).join('');
  }

  function resetLeadModal(modal) {
    const dialog = $('.modal__dialog--form', modal);
    const form = $('.lead-form', modal);
    const intro = $('.modal__intro', modal);
    const success = $('[data-lead-success]', modal);
    if (form) form.hidden = false;
    if (intro) intro.hidden = false;
    if (success) success.hidden = true;
    dialog?.classList.remove('is-success');
  }

  function openModal(type, trigger = null) {
    const modal = $(`#${type}-modal`);
    if (!modal) return;
    if (state.openModal && state.openModal !== modal) closeModal(state.openModal, false);

    resetLeadModal(modal);

    if (type === 'lead') {
      const form = $('.lead-form', modal);
      const intent = trigger?.dataset.intent || 'Nhận tư vấn';
      const vehicle = trigger?.dataset.vehicle || '';
      const title = vehicle ? `Tư vấn ${vehicle}` : intent;
      const intentInput = $('[name="intent"]', form || modal);
      const vehicleSelect = $('[name="vehicle"]', form || modal);
      if (intentInput) intentInput.value = intent;
      if (vehicleSelect && vehicle) vehicleSelect.value = vehicle;
      $$('[data-lead-intro-title], #lead-modal-title', modal).forEach(element => { element.textContent = title; });
    }

    if (['calculator', 'finance'].includes(type)) {
      const price = Number(trigger?.dataset.price || 0);
      if (price) {
        const input = $(`#${type === 'calculator' ? 'reg' : 'fin'}-price`, modal);
        if (input) input.value = new Intl.NumberFormat('vi-VN').format(price);
      }
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    state.openModal = modal;
    lockPage();
    state.modalTrap = new FocusTrap(modal);
    state.modalTrap.activate($('.modal__close', modal));
  }

  function closeModal(modal = state.openModal, restoreFocus = true) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    state.modalTrap?.deactivate();
    if (!restoreFocus) state.modalTrap = null;
    state.openModal = null;
    unlockPage();
  }

  function initModals() {
    if (document.documentElement.dataset.modalsInitialized === 'true') return;
    document.documentElement.dataset.modalsInitialized = 'true';

    on(document, 'click', '[data-open-modal]', (event, trigger) => {
      event.preventDefault();
      openModal(trigger.dataset.openModal, trigger);
    });
    on(document, 'click', '[data-close-modal]', (event, trigger) => {
      event.preventDefault();
      closeModal(trigger.closest('.modal'));
    });
    on(document, 'click', '.modal', (event, modal) => {
      if (event.target === modal) closeModal(modal);
    });
  }

  function syncVehiclePrice(select, input) {
    if (!select || !input) return;
    const selected = select.selectedOptions?.[0];
    const price = Number(selected?.dataset.price || 0);
    if (price) input.value = new Intl.NumberFormat('vi-VN').format(price);
  }

  function resultRows(rows, totalLabel, totalValue, note) {
    return `
      <div class="calculator-result__content">
        <div class="calculator-result__rows">${rows.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')}</div>
        <div class="calculator-result__total"><span>${totalLabel}</span><strong>${totalValue}</strong></div>
        <p>${note}</p>
        <button class="button button--primary button--block" type="button" data-open-modal="lead" data-intent="Nhận tư vấn tài chính">Nhận tư vấn chi tiết</button>
      </div>`;
  }

  function initCalculators() {
    const registrationForm = $('#registration-calculator');
    const financeForm = $('#finance-calculator');
    if (registrationForm?.dataset.initialized !== 'true') {
      registrationForm.dataset.initialized = 'true';
      const select = $('[name="vehicle"]', registrationForm);
      const priceInput = $('[name="price"]', registrationForm);
      select?.addEventListener('change', () => syncVehiclePrice(select, priceInput));
      $$('input[inputmode="numeric"]', registrationForm).forEach(input => input.addEventListener('blur', () => formatMoneyInput(input)));
      registrationForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(registrationForm);
        const price = parseMoney(data.get('price'));
        if (!price) { priceInput?.focus(); return; }
        const registrationRate = Number(data.get('registrationFeePercent')) || 0;
        const registrationFee = price * registrationRate / 100;
        const fees = {
          plate: parseMoney(data.get('plateFee')),
          road: parseMoney(data.get('roadMaintenanceFee')),
          insurance: parseMoney(data.get('civilLiabilityInsurance')),
          inspection: parseMoney(data.get('inspectionFee')),
          service: parseMoney(data.get('serviceFee'))
        };
        const total = price + registrationFee + Object.values(fees).reduce((sum, value) => sum + value, 0);
        $('#registration-result').innerHTML = resultRows([
          ['Giá xe', money(price)],
          [`Lệ phí trước bạ (${registrationRate}%)`, money(registrationFee)],
          ['Biển số và phí khác', money(Object.values(fees).reduce((sum, value) => sum + value, 0))]
        ], 'Tổng lăn bánh dự kiến', money(total), 'Kết quả mang tính tham khảo; mức phí thực tế phụ thuộc hồ sơ và thời điểm đăng ký.');
      });
    }

    if (financeForm?.dataset.initialized !== 'true') {
      financeForm.dataset.initialized = 'true';
      const select = $('[name="vehicle"]', financeForm);
      const priceInput = $('[name="price"]', financeForm);
      select?.addEventListener('change', () => syncVehiclePrice(select, priceInput));
      $$('input[inputmode="numeric"]', financeForm).forEach(input => input.addEventListener('blur', () => formatMoneyInput(input)));
      financeForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(financeForm);
        const price = parseMoney(data.get('price'));
        if (!price) { priceInput?.focus(); return; }
        const downPercent = clamp(Number(data.get('downPaymentPercent')) || 0, 0, 100);
        const term = Math.max(1, Number(data.get('termMonths')) || 1);
        const annualRate = Math.max(0, Number(data.get('annualRatePercent')) || 0);
        const downPayment = price * downPercent / 100;
        const principal = price - downPayment;
        const principalPerMonth = principal / term;
        const firstMonthInterest = principal * annualRate / 100 / 12;
        const firstMonth = principalPerMonth + firstMonthInterest;
        const averageMonth = principalPerMonth + (principal * annualRate / 100 / 12) / 2;
        $('#finance-result').innerHTML = resultRows([
          ['Trả trước', money(downPayment)],
          ['Khoản vay dự kiến', money(principal)],
          ['Thanh toán tháng đầu', money(firstMonth)],
          ['Bình quân tham khảo', money(averageMonth)]
        ], 'Thời hạn vay', `${term} tháng`, 'Ước tính theo dư nợ giảm dần. Ngân hàng sẽ thẩm định hồ sơ và thông báo lãi suất thực tế.');
      });
    }
  }

  function initLeadForms() {
  }

  function initReveal() {
    const targets = $$('[data-reveal]');
    if (!targets.length) return;
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      targets.forEach(target => target.classList.add('is-revealed'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(target => observer.observe(target));
  }

  function initHomePage() {
    COMPONENTS.renderSiteShell?.('home');
    initHeader();
    initHeroSlider();
    initVehicleGrid();
    initTechnologyCards();
    initServiceCards();
    initNews();
    initMapTabs();
    initFaq();
    initModals();
    initCalculators();
    initReveal();
    setImageFallbacks();
  }

  window.BYD_APP = Object.freeze({
    parseMoney,
    formatMoneyInput,
    money,
    openModal,
    closeModal,
    initHeader,
    initModals,
    initLeadForms,
    initCalculators,
    initReveal,
    setImageFallbacks
  });

  if (document.body?.dataset.page === 'home') CORE.ready(initHomePage);
})();
