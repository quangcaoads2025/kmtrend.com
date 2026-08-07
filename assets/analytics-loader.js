(() => {
  let loaded = false;
  const load = () => {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({'gtm.start': Date.now(), event: 'gtm.js'});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-TVF3WXRN';
    document.head.appendChild(script);
  };
  ['pointerdown','keydown','touchstart','scroll'].forEach((event) =>
    window.addEventListener(event, load, {once:true, passive:true})
  );
  window.addEventListener('load', () => window.setTimeout(load, 10000), {once:true});
})();
