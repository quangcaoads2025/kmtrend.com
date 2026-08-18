'use strict';

(() => {
  const containerId = 'GTM-5NWJC98F';
  const interactionEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
  let loaded = false;
  let scheduled = false;
  let fallbackTimer = 0;

  // Keep the queue available immediately so conversion events can be recorded
  // even if the GTM library is intentionally loaded a little later.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  function cleanup() {
    interactionEvents.forEach((eventName) => window.removeEventListener(eventName, scheduleAfterPaint));
    window.clearTimeout(fallbackTimer);
  }

  function load() {
    if (loaded) return;
    loaded = true;
    scheduled = false;
    cleanup();

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
    script.onerror = () => console.warn('[BYD] Google Tag Manager could not be loaded.');
    document.head.appendChild(script);
  }

  function scheduleIdle() {
    if (loaded || scheduled) return;
    scheduled = true;

    const run = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(load, { timeout: 1400 });
      } else {
        window.setTimeout(load, 180);
      }
    };

    // Let the browser paint the user's current interaction first.
    if ('requestAnimationFrame' in window) {
      window.requestAnimationFrame(() => window.setTimeout(run, 0));
    } else {
      window.setTimeout(run, 0);
    }
  }

  function scheduleAfterPaint() {
    scheduleIdle();
  }

  interactionEvents.forEach((eventName) => {
    window.addEventListener(eventName, scheduleAfterPaint, { once: true, passive: true });
  });

  // On visits with no early interaction, warm analytics after the critical
  // rendering path instead of competing with the hero/LCP image.
  const scheduleFallback = () => {
    fallbackTimer = window.setTimeout(scheduleIdle, 1200);
  };

  if (document.readyState === 'complete') {
    scheduleFallback();
  } else {
    window.addEventListener('load', scheduleFallback, { once: true, passive: true });
  }

  // Expose a tiny hook for future conversion code without forcing GTM into
  // the critical rendering path.
  window.BYD_GTM = Object.freeze({ load, schedule: scheduleIdle });
})();
