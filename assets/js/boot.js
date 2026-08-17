'use strict';
(function () {
  if (window.trustedTypes) {
    try {
      window.trustedTypes.createPolicy('default', {
        createHTML: value => String(value),
        createScript: value => String(value),
        createScriptURL: value => String(value)
      });
    } catch (_) {
    }
  }
  document.documentElement.classList.add('js');
})();
