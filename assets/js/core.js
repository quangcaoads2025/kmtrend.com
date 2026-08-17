'use strict';

(() => {
  const documentElement = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const query = (selector, root = document) => root.querySelector(selector);
  const queryAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#039;',
    '"': '&quot;'
  })[character]);

  const normalizeText = (value = '') => String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi-VN')
    .trim();

  const parseMoney = (value) => Number(String(value ?? '').replace(/[^0-9]/g, '')) || 0;
  const money = (value) => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

  const formatMoneyInput = (input) => {
    if (!input) return;
    const value = parseMoney(input.value);
    input.value = value ? new Intl.NumberFormat('vi-VN').format(value) : '';
  };

  const debounce = (callback, delay = 150) => {
    let timer;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callback(...args), delay);
    };
  };

  const rafThrottle = (callback) => {
    let scheduled = false;
    return (...args) => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        callback(...args);
      });
    };
  };

  const on = (target, eventName, selectorOrHandler, maybeHandler, options) => {
    if (!target) return () => {};
    const delegated = typeof selectorOrHandler === 'string';
    const handler = delegated ? maybeHandler : selectorOrHandler;
    const listener = delegated
      ? (event) => {
          const matched = event.target.closest(selectorOrHandler);
          if (matched && target.contains(matched)) handler(event, matched);
        }
      : handler;

    target.addEventListener(eventName, listener, options);
    return () => target.removeEventListener(eventName, listener, options);
  };

  const emit = (name, detail = {}) => document.dispatchEvent(new CustomEvent(name, { detail }));

  const scrollToElement = (target, extraOffset = 0) => {
    const element = typeof target === 'string' ? query(target) : target;
    if (!element) return;
    const header = query('.site-header');
    const tabs = query('.vehicle-tabs');
    const offset = (header?.offsetHeight || 0) + (tabs?.offsetHeight || 0) + extraOffset;
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  };

  const safeStorage = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (_) { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); return true; } catch (_) { return false; }
    },
    remove(key) {
      try { window.localStorage.removeItem(key); } catch (_) {}
    }
  };

  class FocusTrap {
    constructor(container) {
      this.container = container;
      this.previousFocus = null;
      this.onKeyDown = this.onKeyDown.bind(this);
    }

    get focusable() {
      if (!this.container) return [];
      return queryAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', this.container)
        .filter(element => !element.hidden && element.offsetParent !== null);
    }

    activate(preferredTarget) {
      this.previousFocus = document.activeElement;
      document.addEventListener('keydown', this.onKeyDown);
      window.requestAnimationFrame(() => {
        const target = preferredTarget || this.focusable[0] || this.container;
        target?.focus?.({ preventScroll: true });
      });
    }

    deactivate() {
      document.removeEventListener('keydown', this.onKeyDown);
      this.previousFocus?.focus?.({ preventScroll: true });
      this.previousFocus = null;
    }

    onKeyDown(event) {
      if (event.key !== 'Tab') return;
      const focusable = this.focusable;
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  };

  documentElement.classList.remove('no-js');
  documentElement.classList.add('js');

  window.BYD_CORE = Object.freeze({
    query,
    queryAll,
    clamp,
    escapeHtml,
    normalizeText,
    parseMoney,
    money,
    formatMoneyInput,
    debounce,
    rafThrottle,
    on,
    emit,
    scrollToElement,
    safeStorage,
    FocusTrap,
    reducedMotion,
    ready
  });
})();
