'use strict';

(function () {
  const CONFIG = window.BYD_CONFIG;
  const DATA = window.BYD_DATA || {};
  const CORE = window.BYD_CORE || {};

  const safeText = CORE.escapeHtml || ((value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char])));
  const assetUrl = (value = '') => {
    const source = String(value || '');
    if (!source || /^(?:https?:)?\/\//i.test(source) || source.startsWith('/')) return source;
    return `/${source.replace(/^\.\//, '')}`;
  };

  const icons = {
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.28-1.28a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92z"/>',
    service: '<path d="M14.7 6.3a4 4 0 0 0-5-5L7 4l3 3 2.7-2.7a4 4 0 0 0 2 2z"/><path d="M3 21l6.5-6.5"/><path d="M14 10l7 7-4 4-7-7"/>',
    map: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    arrowUp: '<path d="m18 15-6-6-6 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h1M12 11h1M16 11h1M8 15h1M12 15h1M16 15h1M8 19h1M12 19h1M16 19h1"/>',
    wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12"/><path d="M16 12h5"/><circle cx="17" cy="12" r="1"/>',
    steering: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M3.4 9h17.2M12 14v7"/>',
    tag: '<path d="M20 13 13 20 4 11V4h7l9 9z"/><circle cx="8.5" cy="8.5" r="1.5"/>',
    battery: '<rect x="3" y="6" width="17" height="12" rx="2"/><path d="M20 10h2v4h-2M7 10v4M11 9v6M15 10v4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    spark: '<path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/>',
    bank: '<path d="m3 10 9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0-5-5L7 4l3 3 2.7-2.7a4 4 0 0 0 2 2L6 15a3 3 0 1 0 3 3l8.7-8.7a4 4 0 0 0-3-3z"/>',
    facebook: '<path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v6h4v-6h3l1-4h-4V9c0-.7.3-1 1-1z"/>',
    message: '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M7 10h10M7 14h7"/>',
    location: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    document: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.7-3.7"/>'
  };

  function icon(name, className = '') {
    return `<svg class="icon ${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.spark}</svg>`;
  }

  function formatPhone(phone) {
    const clean = String(phone || '').replace(/\D/g, '');
    if (clean.length === 10) return `${clean.slice(0, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)} ${clean.slice(8)}`;
    return phone;
  }

  function formatCurrency(value) {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? `${new Intl.NumberFormat('vi-VN').format(amount)}đ` : '';
  }

  function getPromotion(vehicle = {}) {
    const variant = (vehicle.variants || []).find(item => Number(item?.promotionPrice) > 0 && Number(item.promotionPrice) < Number(item.price));
    const listPrice = Number(vehicle.price || variant?.price || 0);
    const promotionPrice = Number(vehicle.promotionPrice || variant?.promotionPrice || 0);
    if (!listPrice || !promotionPrice || promotionPrice >= listPrice) return null;
    return {
      listPrice,
      promotionPrice,
      listPriceLabel: vehicle.priceLabel || variant?.priceLabel || formatCurrency(listPrice),
      promotionPriceLabel: vehicle.promotionLabel || variant?.promotionLabel || formatCurrency(promotionPrice)
    };
  }

  function vehicleImage(vehicle, className = '') {
    const isCatalogCard = String(className).split(/\s+/).includes('vehicle-card__image');
    const loading = 'lazy';
    const priority = '';
    const source = assetUrl(vehicle.cardRemote || vehicle.image);
    const small = source.replace(/card\.webp(?:\?.*)?$/, 'card-480.webp');
    const medium = source.replace(/card\.webp(?:\?.*)?$/, 'card-640.webp');
    const large = source.replace(/card\.webp(?:\?.*)?$/, 'card-960.webp');
    return `<img class="${className}" src="${small}" srcset="${small} 480w, ${medium} 640w, ${source} 768w, ${large} 960w" sizes="${isCatalogCard ? '(max-width: 520px) calc(100vw - 74px), (max-width: 760px) calc(100vw - 52px), (max-width: 1024px) 50vw, 390px' : '180px'}" data-fallback="${assetUrl(vehicle.image)}" alt="${vehicle.name} tại BYD Thành Công Cà Mau" width="960" height="540" loading="${loading}" decoding="async"${priority}>`;
  }

  function renderTopbar() {
    const showroom = CONFIG.showrooms.showroom4s;
    return `
      <div class="topbar" aria-label="Thông tin nhanh">
        <div class="container topbar__inner">
          <div class="topbar__group topbar__group--left">
            <a href="/#lien-he" class="topbar__item">${icon('map')}<span>${showroom.address}</span></a>
            <span class="topbar__item">${icon('clock')}<span>${CONFIG.businessHours}</span></span>
          </div>
          <div class="topbar__group topbar__group--right">
            <a href="tel:${CONFIG.hotlineSales}" class="topbar__item"><strong>Kinh doanh:</strong>&nbsp;${formatPhone(CONFIG.hotlineSales)}</a>
            <a href="tel:${CONFIG.hotlineService}" class="topbar__item"><strong>Dịch vụ:</strong>&nbsp;${formatPhone(CONFIG.hotlineService)}</a>
            <a href="${CONFIG.facebookUrl}" target="_blank" rel="noopener" class="topbar__icon social-link social-link--facebook" aria-label="Facebook"><img src="/assets/images/social/facebook.png" alt="" width="18" height="18"></a>
            <a href="${CONFIG.zaloUrl}" target="_blank" rel="noopener" class="topbar__icon social-link social-link--zalo" aria-label="Zalo"><img src="/assets/images/social/zalo.svg" alt="" width="18" height="18"></a>
          </div>
        </div>
      </div>`;
  }

  function renderHeader(activePage = 'home') {
    const menuOrder = ['byd-dolphin', 'byd-atto-2', 'byd-seal', 'byd-seal-5', 'byd-m6', 'byd-sealion-6', 'byd-han', 'byd-m9'];
    const vehicles = Array.isArray(DATA.vehicles) ? DATA.vehicles : [];
    const menuVehicles = menuOrder.map(slug => vehicles.find(vehicle => vehicle.slug === slug)).filter(Boolean);
    const vehicleItems = menuVehicles.map(vehicle => {
      const promotion = getPromotion(vehicle);
      return `
      <a class="mega-menu__vehicle${promotion ? ' mega-menu__vehicle--sale' : ''}" href="/san-pham/${vehicle.slug}/">
        ${vehicleImage(vehicle, 'mega-menu__image')}
        <span>
          <strong>${vehicle.name}</strong>
          <small>${vehicle.segment} · ${vehicle.powertrain === 'EV' ? 'Thuần điện' : 'DM-i'}</small>
          ${promotion ? '<span class="mega-menu__sale-badge">Giảm giá</span>' : ''}
        </span>
      </a>`;
    }).join('');

    return `
      ${renderTopbar()}
      <header class="site-header" id="site-header">
        <div class="container header__inner">
          <a class="brand" href="/" aria-label="BYD Thành Công Cà Mau - Trang chủ">
            <img src="/assets/images/logo-byd-thanh-cong-360.webp" srcset="/assets/images/logo-byd-thanh-cong-360.webp 360w, /assets/images/logo-byd-thanh-cong.webp 520w" sizes="(max-width: 768px) 190px, 240px" alt="Logo BYD Thành Công Cà Mau" width="520" height="117">
          </a>
          <nav class="main-nav" aria-label="Điều hướng chính">
            <a class="nav-link ${activePage === 'home' ? 'is-active' : ''}" href="/">Trang chủ</a>
            <a class="nav-link ${activePage === 'about' ? 'is-active' : ''}" href="/gioi-thieu/">Giới thiệu</a>
            <div class="nav-item nav-item--mega">
              <button class="nav-link nav-link--button ${activePage === 'vehicles' ? 'is-active' : ''}" type="button" aria-expanded="false">Dòng xe ${icon('chevronDown')}</button>
              <div class="mega-menu" role="menu">
                <div class="mega-menu__head">
                  <div>
                    <span class="eyebrow">Dải sản phẩm</span>
                    <strong>Xe năng lượng mới BYD</strong>
                  </div>
                  <a href="/san-pham/" class="text-link">Xem tất cả ${icon('chevronRight')}</a>
                </div>
                <div class="mega-menu__grid">${vehicleItems}</div>
              </div>
            </div>
            <a class="nav-link" href="/#khuyen-mai">Khuyến mãi</a>
            <a class="nav-link ${activePage === 'news' ? 'is-active' : ''}" href="/tin-tuc/">Tin tức</a>
            <a class="nav-link ${activePage === 'charging' ? 'is-active' : ''}" href="/tram-sac/">Trạm sạc</a>
            <a class="nav-link" href="/#lien-he">Liên hệ</a>
          </nav>
          <div class="header__actions">
            <button class="button button--primary button--header cta-attention" data-open-modal="lead" data-intent="Đăng ký lái thử">${icon('steering')}<span>Đăng ký lái thử</span></button>
            <button class="menu-toggle" type="button" aria-label="Mở menu" aria-expanded="false">${icon('menu')}</button>
          </div>
        </div>
        <div class="mobile-menu-backdrop" data-close-mobile-menu aria-hidden="true"></div>
        <div class="mobile-menu" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
          <div class="mobile-menu__head">
            <a class="mobile-menu__brand" href="/" aria-label="BYD Thành Công Cà Mau - Trang chủ">
              <img src="/assets/images/logo-byd-thanh-cong-360.webp" srcset="/assets/images/logo-byd-thanh-cong-360.webp 360w, /assets/images/logo-byd-thanh-cong.webp 520w" sizes="(max-width: 768px) 190px, 240px" alt="BYD Thành Công Cà Mau" width="520" height="117">
            </a>
            <button type="button" class="mobile-menu__close" aria-label="Đóng menu">${icon('close')}</button>
          </div>
          <a href="/">Trang chủ</a>
          <a href="/gioi-thieu/">Giới thiệu</a>
          <details>
            <summary>Dòng xe ${icon('chevronDown')}</summary>
            <div class="mobile-menu__vehicles">${menuVehicles.map(v => `<a href="/san-pham/${v.slug}/">${v.name}</a>`).join('')}</div>
          </details>
          <a href="/#khuyen-mai">Khuyến mãi</a>
          <a href="/tin-tuc/">Tin tức</a>
          <a href="/tram-sac/">Trạm sạc</a>
          <a href="/#lien-he">Liên hệ</a>
          <button class="button button--primary button--block cta-attention" data-open-modal="lead" data-intent="Đăng ký lái thử">Đăng ký lái thử</button>
        </div>
      </header>`;
  }

  function renderVehicleCard(vehicle) {
    const specs = (vehicle.specs || []).slice(0, 3).map(spec => `<li><span>${spec.label}</span><strong>${spec.value}</strong></li>`).join('');
    const highlights = (vehicle.cardHighlights || vehicle.highlights || []).slice(0, 3).map(item => `<span>${safeText(item)}</span>`).join('');
    const variantText = vehicle.variants?.length > 1 ? `${vehicle.variants.length} phiên bản` : (vehicle.variants?.[0]?.name || 'Nhận tư vấn');
    const searchText = [vehicle.name, vehicle.segment, vehicle.powertrain, vehicle.tagline, ...(vehicle.badges || [])].join(' ').toLowerCase();
    const promotion = getPromotion(vehicle);
    const priceMarkup = promotion
      ? `<div class="vehicle-card__price-stack"><small>Giá ưu đãi</small><p class="vehicle-card__price vehicle-card__price--sale">${safeText(promotion.promotionPriceLabel)}</p><p class="vehicle-card__list-price"><span>Giá niêm yết</span><del>${safeText(promotion.listPriceLabel)}</del></p></div>`
      : `<div class="vehicle-card__price-stack"><small>Giá niêm yết</small><p class="vehicle-card__price">${safeText(vehicle.priceLabel)}</p></div>`;
    return `
      <article class="vehicle-card vehicle-card--catalog" tabindex="0" data-vehicle-slug="${vehicle.slug}" data-segment="${vehicle.segment.toLowerCase()}" data-powertrain="${vehicle.powertrain.toLowerCase()}" data-vehicle-search="${searchText}">
        <div class="vehicle-card__visual">
          <div class="vehicle-card__badges">${(vehicle.badges || []).map(b => `<span>${safeText(b)}</span>`).join('')}</div>
          <span class="vehicle-card__availability"><i></i>${vehicle.availability || 'Đang nhận tư vấn'}</span>
          <a href="/san-pham/${vehicle.slug}/" aria-label="Xem chi tiết ${vehicle.name}">${vehicleImage(vehicle, 'vehicle-card__image')}</a>
        </div>
        <div class="vehicle-card__body">
          <div class="vehicle-card__meta">
            <p class="vehicle-card__type">${vehicle.segment} · ${vehicle.powertrain === 'EV' ? 'Thuần điện' : 'DM-i Super Hybrid'}</p>
            <span>${variantText}</span>
          </div>
          <h3><a href="/san-pham/${vehicle.slug}/">${vehicle.name}</a></h3>
          <p class="vehicle-card__tagline">${vehicle.tagline || vehicle.shortDescription}</p>
          <div class="vehicle-card__price-row">
            ${priceMarkup}
            <button class="vehicle-card__quick-lead" type="button" data-open-modal="lead" data-vehicle="${vehicle.name}" data-intent="Nhận báo giá ${vehicle.name}">Nhận giá tốt</button>
          </div>
          <div class="vehicle-card__highlights">${highlights}</div>
          <ul class="vehicle-card__specs">${specs}</ul>
          <div class="vehicle-card__actions">
            <a class="button button--dark button--small" href="/san-pham/${vehicle.slug}/">Khám phá xe</a>
            <button class="button button--outline button--small" data-open-modal="lead" data-vehicle="${vehicle.name}" data-intent="Đăng ký lái thử ${vehicle.name}">Lái thử</button>
          </div>
        </div>
      </article>`;
  }

  function COMPONENTS_SAFE_TEXT(value) { return safeText(value); }

  function renderFooter() {
    return `
      <footer class="footer">
        <div class="container footer__grid">
          <div class="footer__brand">
            <img src="/assets/images/logo-byd-thanh-cong-360.webp" srcset="/assets/images/logo-byd-thanh-cong-360.webp 360w, /assets/images/logo-byd-thanh-cong.webp 520w" sizes="(max-width: 768px) 190px, 240px" alt="BYD Thành Công Cà Mau" width="520" height="117">
            <p>Đại lý BYD tại Cà Mau, cung cấp tư vấn xe năng lượng mới, đăng ký lái thử, dịch vụ hậu mãi và hỗ trợ tài chính.</p>
            <div class="footer__social">
              <a href="${CONFIG.facebookUrl}" target="_blank" rel="noopener" aria-label="Facebook" class="social-link social-link--facebook"><img src="/assets/images/social/facebook.png" alt="" width="24" height="24"></a>
              <a href="${CONFIG.zaloUrl}" target="_blank" rel="noopener" aria-label="Zalo" class="social-link social-link--zalo"><img src="/assets/images/social/zalo.svg" alt="" width="25" height="25"></a>
              <a href="${CONFIG.messengerUrl}" target="_blank" rel="noopener" aria-label="Messenger" class="social-link social-link--messenger"><img src="/assets/images/contact/messenger-contact.svg" alt="" width="25" height="25"></a>
            </div>
          </div>
          <div>
            <h3>Menu nhanh</h3>
            <ul class="footer__links">
              <li><a href="/san-pham/">Dòng xe</a></li>
              <li><a href="/#khuyen-mai">Khuyến mãi</a></li>
              <li><a href="/#showroom">Showroom</a></li>
              <li><a href="/tram-sac/">Trạm sạc</a></li>
              <li><a href="/tin-tuc/">Tin tức</a></li>
            </ul>
          </div>
          <div>
            <h3>Dịch vụ khách hàng</h3>
            <ul class="footer__links">
              <li><button data-open-modal="lead" data-intent="Nhận báo giá">Nhận báo giá</button></li>
              <li><button data-open-modal="calculator">Tính giá lăn bánh</button></li>
              <li><button data-open-modal="finance">Ước tính trả góp</button></li>
              <li><button data-open-modal="lead" data-intent="Đăng ký lái thử">Đăng ký lái thử</button></li>
            </ul>
          </div>
          <div class="footer__contact">
            <h3>Thông tin liên hệ</h3>
            <p class="footer__nap"><strong class="footer__showroom-name">Showroom BYD Thành Công</strong><br>Số 109, Đường Lý Thường Kiệt, Phường Tân Thành, Cà Mau<br>Giờ làm việc: 07:30 – 17:30, Thứ 2 – Chủ nhật<br><a href="https://www.google.com/maps/search/?api=1&amp;query=BYD%20Th%C3%A0nh%20C%C3%B4ng%20C%C3%A0%20Mau%20109%20L%C3%BD%20Th%C6%B0%E1%BB%9Dng%20Ki%E1%BB%87t" target="_blank" rel="noopener">Xem chỉ đường Google Maps</a></p>
            <a href="tel:${CONFIG.hotlineSales}">${icon('phone')}<span><small>Hotline kinh doanh</small><strong>${formatPhone(CONFIG.hotlineSales)}</strong></span></a>
            <a href="tel:${CONFIG.hotlineService}">${icon('service')}<span><small>Hotline dịch vụ</small><strong>${formatPhone(CONFIG.hotlineService)}</strong></span></a>
            <a href="mailto:${CONFIG.email}">${icon('message')}<span><small>Email</small><strong>${CONFIG.email}</strong></span></a>
          </div>
        </div>
        <div class="footer__bottom">
          <div class="container footer__bottom-inner">
            <p class="footer__copyright">
              <span>Copyright © 2026 <a class="footer__copyright-link" href="https://kmtrend.com/" target="_blank" rel="noopener">KMTrend</a> <b aria-hidden="true">|</b> BYD Thành Công</span>
              <span class="footer__credit">Thiết kế và phát triển bởi <a href="https://kmtrend.com/" target="_blank" rel="noopener">KMTrend.com</a></span>
            </p>
            <div class="footer__legal"><a href="/chinh-sach-bao-mat/">Chính sách bảo mật</a><a href="/dieu-khoan-su-dung/">Điều khoản sử dụng</a></div>
          </div>
        </div>
      </footer>`;
  }

  function renderFloatingContact() {
    return `
      <div class="floating-contact" aria-label="Liên hệ nhanh">
        <a href="tel:${CONFIG.hotlineSales}" class="contact-fab contact-fab--social contact-fab--phone" aria-label="Gọi điện">
          <span class="contact-fab__core"><img src="/assets/images/contact/phone-white.svg" alt="" width="26" height="26"></span>
          <span class="contact-fab__label">Gọi điện</span>
        </a>
        <a href="${CONFIG.zaloUrl}" target="_blank" rel="noopener" class="contact-fab contact-fab--social contact-fab--zalo" aria-label="Chat Zalo">
          <span class="contact-fab__core"><img src="/assets/images/social/zalo.svg" alt="" width="36" height="36"></span>
          <span class="contact-fab__label">Zalo</span>
        </a>
        <a href="${CONFIG.messengerUrl}" target="_blank" rel="noopener" class="contact-fab contact-fab--social contact-fab--messenger" aria-label="Chat Messenger">
          <span class="contact-fab__core"><img src="/assets/images/contact/messenger-contact.svg" alt="" width="34" height="34"></span>
          <span class="contact-fab__label">Messenger</span>
        </a>
        <div class="floating-contact__bottom-row">
          <button type="button" class="floating-register-cta cta-attention" data-open-modal="lead" data-intent="Đăng ký tư vấn" aria-label="Đăng ký ngay để được tư vấn miễn phí">
            <span class="floating-register-cta__icon">${icon('document')}</span>
            <span class="floating-register-cta__copy"><strong>Đăng ký ngay</strong><small>Tư vấn miễn phí</small></span>
            <span class="floating-register-cta__arrow">${icon('chevronRight')}</span>
          </button>
          <button type="button" class="contact-fab contact-fab--top" data-scroll-top aria-label="Lên đầu trang">${icon('arrowUp')}</button>
        </div>
      </div>`;
  }

  function selectVehicleOptions(includeEmpty = true) {
    const empty = includeEmpty ? '<option value="">Chọn dòng xe</option>' : '';
    return empty + DATA.vehicles.map(v => `<option value="${v.name}" data-price="${v.price || ''}">${v.name}</option>`).join('');
  }

  function renderModals() {
    return `
      <div class="modal" id="lead-modal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
        <div class="modal__backdrop" data-close-modal></div>
        <div class="modal__dialog modal__dialog--form">
          <button class="modal__close" type="button" data-close-modal aria-label="Đóng">${icon('close')}</button>

          <aside class="modal__intro">
            <div class="lead-modal__brandline">
              <span class="lead-modal__brand-name">BYD Thành Công Cà Mau</span>
              <span class="lead-modal__status"><i aria-hidden="true"></i> Đang tiếp nhận</span>
            </div>
            <div class="lead-modal__logo-stage" aria-hidden="true">
              <span class="lead-modal__logo-glow"></span>
              <img src="/assets/images/logo-byd-thanh-cong-360.webp" srcset="/assets/images/logo-byd-thanh-cong-360.webp 360w, /assets/images/logo-byd-thanh-cong.webp 520w" sizes="(max-width: 768px) 190px, 240px" alt="" width="360" height="81">
              <small>BYD THÀNH CÔNG CÀ MAU</small>
            </div>
            <p class="lead-modal__kicker">TƯ VẤN CÁ NHÂN HÓA</p>
            <h2 data-lead-intro-title>Nhận tư vấn chính xác</h2>
            <p class="lead-modal__intro-copy">Thông tin của bạn được chuyển đến đội ngũ phụ trách để xác nhận giá xe, ưu đãi, lịch lái thử và phương án sở hữu phù hợp.</p>
            <div class="modal__trust">
              <span><b>${icon('check')}</b><span><strong>Thông tin minh bạch</strong><small>Không tự công bố giá hoặc ưu đãi chưa xác nhận.</small></span></span>
              <span><b>${icon('shield')}</b><span><strong>Bảo mật liên hệ</strong><small>Chỉ sử dụng cho mục đích tư vấn theo yêu cầu.</small></span></span>
              <span><b>${icon('clock')}</b><span><strong>Phản hồi trong giờ làm việc</strong><small>Ưu tiên liên hệ theo nhu cầu bạn đã chọn.</small></span></span>
            </div>
            <div class="lead-modal__hotline">
              <span>Cần hỗ trợ ngay?</span>
              <a href="tel:${CONFIG.hotlineSales}">${icon('phone')} ${formatPhone(CONFIG.hotlineSales)}</a>
            </div>
          </aside>

          <form class="lead-form" id="modal-lead-form" novalidate>
            <div class="lead-modal__form-head">
              <img class="lead-modal__form-logo" src="/assets/images/logo-byd-thanh-cong-360.webp" srcset="/assets/images/logo-byd-thanh-cong-360.webp 360w, /assets/images/logo-byd-thanh-cong.webp 520w" sizes="(max-width: 768px) 190px, 240px" alt="BYD Thành Công Cà Mau" width="360" height="81">
              <span class="lead-modal__step">ĐĂNG KÝ NHANH · KHOẢNG 01 PHÚT</span>
              <h2 id="lead-modal-title">Nhận tư vấn chính xác</h2>
              <p>Điền thông tin bên dưới. Tư vấn viên sẽ liên hệ để xác nhận nhu cầu, không gửi báo giá tự động.</p>
            </div>
            <input type="hidden" name="intent" value="Nhận báo giá">
            <input class="form-honeypot" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">

            <div class="lead-modal__fields">
              <div class="form-field">
                <label for="modal-name">Họ và tên <span aria-hidden="true">*</span></label>
                <div class="form-control-wrap">${icon('message')}<input id="modal-name" name="name" type="text" autocomplete="name" placeholder="Ví dụ: Nguyễn Văn A" required minlength="2"></div>
                <small class="form-error"></small>
              </div>
              <div class="form-field">
                <label for="modal-phone">Số điện thoại <span aria-hidden="true">*</span></label>
                <div class="form-control-wrap">${icon('phone')}<input id="modal-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="Nhập đủ 10 chữ số" required maxlength="10" pattern="^(0)(3|5|7|8|9)[0-9]{8}$"></div>
                <small class="form-error"></small>
              </div>
              <div class="form-field">
                <label for="modal-vehicle">Dòng xe quan tâm <span aria-hidden="true">*</span></label>
                <div class="form-control-wrap">${icon('steering')}<select id="modal-vehicle" name="vehicle" required>${selectVehicleOptions()}</select></div>
                <small class="form-error"></small>
              </div>
              <div class="form-field">
                <label for="modal-area">Khu vực <span aria-hidden="true">*</span></label>
                <div class="form-control-wrap">${icon('location')}<input id="modal-area" name="area" type="text" value="${CONFIG.defaultArea}" placeholder="Tỉnh / thành phố" required></div>
                <small class="form-error"></small>
              </div>
            </div>

            <label class="form-consent"><input type="checkbox" name="consent" required><span>Tôi đồng ý để đại lý liên hệ tư vấn theo thông tin đã cung cấp.</span></label>
            <div class="lead-modal__privacy-note">${icon('shield')}<span>Dữ liệu được xử lý theo <a href="/chinh-sach-bao-mat/" target="_blank">Chính sách bảo mật</a>. Bạn có thể yêu cầu cập nhật hoặc xóa thông tin liên hệ.</span></div>
            <button class="button button--primary button--block lead-modal__submit" type="submit"><span>Gửi yêu cầu tư vấn</span>${icon('chevronRight')}</button>
            <div class="form-status" role="status" aria-live="polite"></div>
          </form>

          <section class="lead-success" data-lead-success hidden aria-live="polite" aria-labelledby="lead-success-title">
            <div class="lead-success__icon" aria-hidden="true">✓</div>
            <h2 id="lead-success-title">Đã gửi thông tin thành công!</h2>
            <p>Cảm ơn Anh/Chị. Nhân viên BYD Cà Mau sẽ liên hệ trong thời gian sớm nhất.</p>
            <div class="lead-success__actions">
              <a class="button lead-success__call" href="tel:${CONFIG.confirmationHotline || '0848525352'}">Gọi ngay ${formatPhone(CONFIG.confirmationHotline || '0848525352')}</a>
              <button class="button lead-success__close" type="button" data-close-modal>Đóng cửa sổ</button>
            </div>
          </section>
        </div>
      </div>

      <div class="modal" id="calculator-modal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="calculator-title">
        <div class="modal__backdrop" data-close-modal></div>
        <div class="modal__dialog modal__dialog--calculator">
          <button class="modal__close" type="button" data-close-modal aria-label="Đóng">${icon('close')}</button>
          <div class="calculator__header">
            <span class="eyebrow">Công cụ tham khảo</span>
            <h2 id="calculator-title">Tính giá lăn bánh</h2>
            <p>Nhập giá và các khoản phí thực tế tại thời điểm đăng ký. Kết quả không phải báo giá chính thức.</p>
          </div>
          <div class="calculator-grid">
            <form id="registration-calculator" class="calculator-form">
              <div class="form-field">
                <label for="reg-vehicle">Dòng xe</label>
                <select id="reg-vehicle" name="vehicle">${selectVehicleOptions()}</select>
              </div>
              <div class="form-field">
                <label for="reg-price">Giá xe dự kiến (VNĐ)</label>
                <input id="reg-price" name="price" type="text" inputmode="numeric" placeholder="Ví dụ: 700.000.000" required>
              </div>
              <div class="form-row">
                <div class="form-field"><label for="reg-rate">Lệ phí trước bạ (%)</label><input id="reg-rate" name="registrationFeePercent" type="number" min="0" max="20" step="0.1" value="${CONFIG.registrationDefaults.registrationFeePercent}"></div>
                <div class="form-field"><label for="reg-plate">Phí biển số</label><input id="reg-plate" name="plateFee" type="text" inputmode="numeric" value="${CONFIG.registrationDefaults.plateFee.toLocaleString('vi-VN')}"></div>
              </div>
              <details class="calculator-details">
                <summary>Điều chỉnh các khoản phí khác ${icon('chevronDown')}</summary>
                <div class="form-row">
                  <div class="form-field"><label>Phí đường bộ</label><input name="roadMaintenanceFee" type="text" inputmode="numeric" value="${CONFIG.registrationDefaults.roadMaintenanceFee.toLocaleString('vi-VN')}"></div>
                  <div class="form-field"><label>Bảo hiểm TNDS</label><input name="civilLiabilityInsurance" type="text" inputmode="numeric" value="${CONFIG.registrationDefaults.civilLiabilityInsurance.toLocaleString('vi-VN')}"></div>
                  <div class="form-field"><label>Phí kiểm định</label><input name="inspectionFee" type="text" inputmode="numeric" value="${CONFIG.registrationDefaults.inspectionFee.toLocaleString('vi-VN')}"></div>
                  <div class="form-field"><label>Phí dịch vụ khác</label><input name="serviceFee" type="text" inputmode="numeric" value="0"></div>
                </div>
              </details>
              <button class="button button--dark button--block" type="submit">Tính chi phí dự kiến</button>
            </form>
            <div class="calculator-result" id="registration-result">
              <div class="calculator-result__placeholder">${icon('calculator')}<p>Nhập giá xe để xem tổng chi phí dự kiến.</p></div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal" id="finance-modal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="finance-title">
        <div class="modal__backdrop" data-close-modal></div>
        <div class="modal__dialog modal__dialog--calculator">
          <button class="modal__close" type="button" data-close-modal aria-label="Đóng">${icon('close')}</button>
          <div class="calculator__header">
            <span class="eyebrow">Công cụ tham khảo</span>
            <h2 id="finance-title">Ước tính trả góp</h2>
            <p>Phương pháp dư nợ giảm dần. Lãi suất và kết quả thực tế phụ thuộc hồ sơ và ngân hàng phê duyệt.</p>
          </div>
          <div class="calculator-grid">
            <form id="finance-calculator" class="calculator-form">
              <div class="form-field"><label for="fin-vehicle">Dòng xe</label><select id="fin-vehicle" name="vehicle">${selectVehicleOptions()}</select></div>
              <div class="form-field"><label for="fin-price">Giá xe dự kiến (VNĐ)</label><input id="fin-price" name="price" type="text" inputmode="numeric" placeholder="Ví dụ: 700.000.000" required></div>
              <div class="form-row">
                <div class="form-field"><label for="fin-down">Trả trước (%)</label><input id="fin-down" name="downPaymentPercent" type="number" min="10" max="90" step="1" value="${CONFIG.financingDefaults.downPaymentPercent}"></div>
                <div class="form-field"><label for="fin-term">Thời hạn vay (tháng)</label><select id="fin-term" name="termMonths">${[12,24,36,48,60,72,84,96].map(m => `<option value="${m}" ${m === CONFIG.financingDefaults.termMonths ? 'selected' : ''}>${m} tháng</option>`).join('')}</select></div>
              </div>
              <div class="form-field"><label for="fin-rate">Lãi suất dự kiến (%/năm)</label><input id="fin-rate" name="annualRatePercent" type="number" min="0" max="30" step="0.1" value="${CONFIG.financingDefaults.annualRatePercent}"></div>
              <button class="button button--dark button--block" type="submit">Tính khoản trả góp</button>
            </form>
            <div class="calculator-result" id="finance-result">
              <div class="calculator-result__placeholder">${icon('bank')}<p>Nhập giá xe để xem khoản vay và thanh toán tháng đầu.</p></div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderSiteShell(activePage = 'home') {
    const headerTarget = document.querySelector('[data-site-header]');
    const footerTarget = document.querySelector('[data-site-footer]');
    const floatingTarget = document.querySelector('[data-floating-contact]');
    const modalTarget = document.querySelector('[data-modals], [data-site-modals]');
    if (headerTarget) headerTarget.innerHTML = renderHeader(activePage);
    if (footerTarget) footerTarget.innerHTML = renderFooter();
    if (floatingTarget) floatingTarget.innerHTML = renderFloatingContact();
    if (modalTarget) modalTarget.innerHTML = renderModals();
  }

  window.BYD_COMPONENTS = {
    icon,
    formatPhone,
    formatCurrency,
    getPromotion,
    vehicleImage,
    renderHeader,
    renderVehicleCard,
    renderFooter,
    renderFloatingContact,
    renderModals,
    renderSiteShell,
    selectVehicleOptions
  };
})();
