'use strict';

(() => {
  const CORE = window.BYD_CORE;
  const CONFIG = window.BYD_CONFIG || {};
  if (!CORE) throw new Error('BYD_CORE must be loaded before form-submit-final.js');

  const { query: $, queryAll: $$, on, safeStorage } = CORE;
  const FORM_SELECTOR = '.lead-form';
  const PHONE_PATTERN = /^(0)(3|5|7|8|9)[0-9]{8}$/;
  const cooldownKey = 'byd:last-lead-submit';

  const fields = Object.freeze([
    { name: 'name', message: 'Vui lòng nhập họ và tên.', valid: value => value.length >= 2 },
    { name: 'phone', message: 'Số điện thoại Việt Nam phải đủ 10 chữ số.', valid: value => PHONE_PATTERN.test(value) },
    { name: 'vehicle', message: 'Vui lòng chọn dòng xe quan tâm.', valid: Boolean },
    { name: 'area', message: 'Vui lòng nhập khu vực.', valid: Boolean }
  ]);

  function cleanPhone(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 10);
  }

  function valueOf(form, name) {
    const field = $(`[name="${name}"]`, form);
    const value = name === 'phone' ? cleanPhone(field?.value) : String(field?.value || '').trim();
    if (field && name === 'phone') field.value = value;
    return value;
  }

  function setFieldError(field, message = '') {
    if (!field) return;
    const wrapper = field.closest('.form-field');
    const error = $('.form-error', wrapper || field.parentElement);
    field.classList.toggle('is-invalid', Boolean(message));
    field.setAttribute('aria-invalid', String(Boolean(message)));
    if (error) error.textContent = message;
  }

  function validate(form) {
    let firstInvalid = null;
    const data = {};

    fields.forEach((rule) => {
      const field = $(`[name="${rule.name}"]`, form);
      const value = valueOf(form, rule.name);
      data[rule.name] = value;
      const message = rule.valid(value) ? '' : rule.message;
      setFieldError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });

    const consent = $('[name="consent"]', form);
    if (consent) {
      const invalid = !consent.checked;
      consent.closest('.form-consent')?.classList.toggle('is-invalid', invalid);
      consent.setAttribute('aria-invalid', String(invalid));
      if (invalid && !firstInvalid) firstInvalid = consent;
    }

    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: true });
      firstInvalid.scrollIntoView({ behavior: CORE.reducedMotion.matches ? 'auto' : 'smooth', block: 'center' });
      return { valid: false, data };
    }
    return { valid: true, data };
  }

  function setStatus(form, type, message) {
    const status = $('.form-status', form);
    if (!status) return;
    status.className = `form-status${type ? ` is-${type}` : ''}`;
    status.textContent = message;
  }

  function appendHidden(form, name, value) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = String(value ?? '');
    form.appendChild(input);
  }

  function verifyConfiguration() {
    const endpoint = String(CONFIG.formEndpoint || '').trim();
    const map = CONFIG.googleFormFields || {};
    const validEndpoint = /^https:\/\/docs\.google\.com\/forms\/d\/e\/[^/]+\/formResponse$/i.test(endpoint);
    const validFields = ['name', 'phone', 'vehicle', 'area'].every(key => Boolean(map[key]));
    if (!validEndpoint || !validFields) throw new Error('Cấu hình Google Forms chưa hợp lệ.');
    return { endpoint, map };
  }

  function createGoogleFormRelay(endpoint, fields) {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const frameName = `byd-google-form-${token}`;

    const iframe = document.createElement('iframe');
    iframe.name = frameName;
    iframe.title = 'Gửi biểu mẫu tư vấn';
    iframe.hidden = true;
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('tabindex', '-1');

    const relay = document.createElement('form');
    relay.method = 'POST';
    relay.action = endpoint;
    relay.target = frameName;
    relay.acceptCharset = 'UTF-8';
    relay.hidden = true;
    relay.setAttribute('aria-hidden', 'true');

    Object.entries(fields).forEach(([name, value]) => appendHidden(relay, name, value));

    document.body.append(iframe, relay);
    return { iframe, relay };
  }

  function removeGoogleFormRelay(relay, iframe) {
    window.setTimeout(() => {
      relay?.remove();
      iframe?.remove();
    }, 30000);
  }

  async function postToGoogleForms(payload) {
    const { endpoint, map } = verifyConfiguration();
    if (!navigator.onLine) throw new Error('Thiết bị đang ngoại tuyến.');

    const fieldsToSend = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (map[key]) fieldsToSend[map[key]] = String(value ?? '');
    });
    fieldsToSend.fvv = '1';
    fieldsToSend.draftResponse = '[]';
    fieldsToSend.pageHistory = '0';
    fieldsToSend.submit = 'Submit';

    const { iframe, relay } = createGoogleFormRelay(endpoint, fieldsToSend);

    try {
      HTMLFormElement.prototype.submit.call(relay);
    } catch (error) {
      relay.remove();
      iframe.remove();
      throw error;
    }

    // Google Forms không cho đọc phản hồi chéo miền. Sau khi trình duyệt đã
    // nhận lệnh POST, chờ một nhịp ngắn rồi đóng giao diện; không chờ sự kiện
    // load của iframe vì Safari có thể không phát sự kiện này dù dữ liệu đã gửi.
    await new Promise(resolve => window.setTimeout(resolve, 700));
    removeGoogleFormRelay(relay, iframe);
  }

  function withinCooldown() {
    const last = Number(safeStorage.get(cooldownKey) || 0);
    const seconds = Number(CONFIG.formCooldownSeconds || 5);
    return Date.now() - last < seconds * 1000;
  }

  function showSuccess(form) {
    const modal = form.closest('#lead-modal');
    if (!modal) return;
    const dialog = $('.modal__dialog--form', modal);
    const intro = $('.modal__intro', modal);
    const success = $('[data-lead-success]', modal);
    form.hidden = true;
    if (intro) intro.hidden = true;
    if (success) success.hidden = false;
    dialog?.classList.add('is-success');
    $('.lead-success__call', success || modal)?.focus({ preventScroll: true });
  }

  function resetForm(form) {
    form.reset();
    const area = $('[name="area"]', form);
    if (area) area.value = CONFIG.defaultArea || 'Cà Mau';
    $$('[aria-invalid="true"]', form).forEach(field => setFieldError(field));
    $('.form-consent', form)?.classList.remove('is-invalid');
  }

  async function submit(form) {
    if (!form || form.dataset.submitting === 'true') return;
    if ($('[name="website"]', form)?.value) return;

    const result = validate(form);
    if (!result.valid) {
      setStatus(form, 'error', 'Vui lòng kiểm tra lại các trường bắt buộc.');
      return;
    }

    if (withinCooldown()) {
      setStatus(form, 'error', 'Yêu cầu vừa được gửi. Vui lòng chờ vài giây trước khi gửi lại.');
      return;
    }

    const button = $('button[type="submit"]', form);
    form.dataset.submitting = 'true';
    button?.setAttribute('aria-busy', 'true');
    if (button) button.disabled = true;
    setStatus(form, 'loading', 'Đang gửi thông tin…');

    try {
      await postToGoogleForms(result.data);
      safeStorage.set(cooldownKey, String(Date.now()));
      setStatus(form, 'success', 'Đã gửi thông tin thành công.');
      try {
        window.dataLayer?.push({ event: 'generate_lead', vehicle: result.data.vehicle, area: result.data.area });
        if (typeof window.fbq === 'function') window.fbq('track', 'Lead');
      } catch (_) {}
      resetForm(form);
      showSuccess(form);
    } catch (error) {
      console.error('[BYD] Lead submission failed:', error);
      const message = navigator.onLine
        ? 'Chưa gửi được dữ liệu. Vui lòng thử lại hoặc gọi hotline 0848 52 53 52.'
        : 'Thiết bị đang mất kết nối mạng. Vui lòng kết nối lại rồi gửi.';
      setStatus(form, 'error', message);
    } finally {
      form.dataset.submitting = 'false';
      button?.removeAttribute('aria-busy');
      if (button) button.disabled = false;
    }
  }

  on(document, 'submit', FORM_SELECTOR, (event, form) => {
    event.preventDefault();
    submit(form);
  }, true);

  on(document, 'input', `${FORM_SELECTOR} [name="phone"]`, (_event, input) => {
    input.value = cleanPhone(input.value);
    if (input.classList.contains('is-invalid')) setFieldError(input);
  }, true);

  on(document, 'change', `${FORM_SELECTOR} input, ${FORM_SELECTOR} select`, (_event, field) => {
    if (field.name === 'consent') field.closest('.form-consent')?.classList.remove('is-invalid');
    else if (field.classList.contains('is-invalid')) setFieldError(field);
  }, true);

  window.BYD_FORM = Object.freeze({ submit, validate });
})();
