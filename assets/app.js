
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
leadForm?.addEventListener('submit', event => {
  event.preventDefault();
  const status = document.getElementById('formStatus');
  if (status) {
    status.textContent = 'Đã ghi nhận yêu cầu. Kết nối Google Sheets hoặc CRM để nhận dữ liệu thực tế.';
  }
  leadForm.reset();
});

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


// Social solution tabs
const socialTabs = document.querySelectorAll('.social-tab');
const socialPanels = document.querySelectorAll('.social-panel');
socialTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    socialTabs.forEach(item => item.classList.remove('active'));
    socialPanels.forEach(panel => panel.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.panel)?.classList.add('active');
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
