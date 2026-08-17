'use strict';

(() => {
  const containerId = 'GTM-5NWJC98F';
  const interactionEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
  let loaded = false;
  let fallbackTimer;

  function cleanup() {
    interactionEvents.forEach(eventName => window.removeEventListener(eventName, load));
    window.clearTimeout(fallbackTimer);
  }

  function load() {
    if (loaded) return;
    loaded = true;
    cleanup();
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
    script.onerror = () => console.warn('[BYD] Google Tag Manager could not be loaded.');
    document.head.appendChild(script);
  }

  interactionEvents.forEach(eventName => window.addEventListener(eventName, load, { once: true, passive: true }));
  fallbackTimer = window.setTimeout(load, 5000);
})();
