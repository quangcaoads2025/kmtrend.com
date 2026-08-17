'use strict';

(() => {
  const { pathname, search, hash } = window.location;
  if (/\/index\.html$/i.test(pathname)) {
    const cleanPath = pathname.replace(/index\.html$/i, '');
    window.history.replaceState(null, '', `${cleanPath}${search}${hash}`);
  }
  const redirectTarget = document.body?.dataset.redirectTarget;
  if (redirectTarget) window.location.replace(`${redirectTarget}${search}${hash}`);
})();
