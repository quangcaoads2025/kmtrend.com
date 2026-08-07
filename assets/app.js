
const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

menuButton?.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.main-nav a').forEach(link => {
  link.addEventListener('click', () => {
    mainNav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

const leadForm = document.getElementById('leadForm');
if (leadForm) {
  const status = document.getElementById('formStatus');
  const submitButton = leadForm.querySelector('button[type="submit"]');
  const googleTarget = document.getElementById('googleFormTarget');
  const usesGoogleForm = leadForm.dataset.googleForm === 'true';
  const phoneInput = leadForm.querySelector('input[name="entry.379654823"]');
  let isSending = false;
  let submitTimeout;

  const validatePhone = () => {
    if (!phoneInput) return true;

    // Chỉ giữ chữ số và giới hạn tối đa 10 số.
    phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 10);
    const isValid = /^0\d{9}$/.test(phoneInput.value);
    phoneInput.setCustomValidity(
      isValid ? '' : 'Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0.'
    );
    return isValid;
  };

  phoneInput?.addEventListener('input', validatePhone);
  phoneInput?.addEventListener('blur', validatePhone);

  const finishGoogleSubmit = () => {
    if (!isSending) return;
    isSending = false;
    window.clearTimeout(submitTimeout);
    if (status) {
      status.textContent = 'Gửi thông tin thành công! KMTrend sẽ liên hệ tư vấn trong thời gian sớm nhất.';
      status.classList.remove('is-error', 'is-sending');
      status.classList.add('is-success');
    }
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('is-loading');
    }
    leadForm.reset();
  };

  googleTarget?.addEventListener('load', finishGoogleSubmit);

  leadForm.addEventListener('submit', event => {
    if (!validatePhone()) {
      event.preventDefault();
      phoneInput?.reportValidity();
      phoneInput?.focus();
      return;
    }

    if (!usesGoogleForm) {
      event.preventDefault();
      if (status) status.textContent = 'Đã ghi nhận yêu cầu tư vấn.';
      leadForm.reset();
      return;
    }

    if (!leadForm.checkValidity()) {
      event.preventDefault();
      leadForm.reportValidity();
      return;
    }

    isSending = true;
    if (status) {
      status.textContent = 'Đang gửi thông tin...';
      status.classList.remove('is-error', 'is-success');
      status.classList.add('is-sending');
    }
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('is-loading');
    }

    // Dự phòng cho trường hợp trình duyệt không phát sự kiện load của iframe.
    submitTimeout = window.setTimeout(finishGoogleSubmit, 7000);
  });
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.animate(
        [{opacity:0, transform:'translateY(18px)'}, {opacity:1, transform:'translateY(0)'}],
        {duration:520, easing:'ease-out', fill:'both'}
      );
      observer.unobserve(entry.target);
    }
  });
}, {threshold:.12});

document.querySelectorAll('.service-card,.process-card,.project-card,.article-card,.detail-grid article').forEach(el => {
  observer.observe(el);
});


// Social solution tabs — keyboard and ARIA complete.
const socialTabs = Array.from(document.querySelectorAll('.social-tab'));
const socialPanels = Array.from(document.querySelectorAll('.social-panel'));
const activateSocialTab = (tab, moveFocus = false) => {
  socialTabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
  });
  socialPanels.forEach((panel) => {
    const active = panel.id === tab.dataset.panel;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });
  if (moveFocus) tab.focus();
};
socialTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateSocialTab(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % socialTabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + socialTabs.length) % socialTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = socialTabs.length - 1;
    activateSocialTab(socialTabs[nextIndex], true);
  });
});


// V8: đóng menu khi bấm ra ngoài header
document.addEventListener('click', event => {
  const nav = document.querySelector('.premium-main-nav');
  const toggle = document.querySelector('.premium-menu-toggle');
  const header = document.querySelector('.premium-site-header');
  if (!nav || !toggle || !header) return;
  if (!header.contains(event.target) && nav.classList.contains('open')) {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});


// Nút liên hệ, Đăng ký ngay và nút lên đầu trang — chỉ hiện sau màn hình đầu tiên để không che nội dung.
const backTopButton = document.querySelector('.floating-back-top');
const floatingContact = document.querySelector('.floating-contact');
const floatingRegisterButtons = Array.from(document.querySelectorAll('.floating-register-cta'));

const setFloatingToolsVisible = (visible) => {
  backTopButton?.classList.toggle('is-visible', visible);
  floatingContact?.classList.toggle('is-visible', visible);
  floatingRegisterButtons.forEach((button) => button.classList.toggle('is-visible', visible));
};

if ('IntersectionObserver' in window) {
  const floatingSentinel = document.createElement('span');
  floatingSentinel.setAttribute('aria-hidden', 'true');
  floatingSentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none';
  document.body.prepend(floatingSentinel);
  const floatingObserver = new IntersectionObserver(([entry]) => {
    setFloatingToolsVisible(!entry.isIntersecting);
  }, { rootMargin: '520px 0px 0px 0px', threshold: 0 });
  floatingObserver.observe(floatingSentinel);
} else {
  setFloatingToolsVisible(false);
}

backTopButton?.addEventListener('click', () => {
  window.scrollTo({top:0, behavior:'smooth'});
});

document.querySelectorAll('.floating-register-cta').forEach(button => {
  button.addEventListener('click', event => {
    const href = button.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({behavior:'smooth', block:'center'});
    window.setTimeout(() => {
      target.querySelector?.('input, select, textarea')?.focus({preventScroll:true});
    }, 650);
  });
});
