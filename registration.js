(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const active = $('#active-event');
  const form = $('#form');
  if (!active || !form) return;

  const eventId = active.dataset.id || '';
  const preview = active.dataset.preview === 'true';
  const startDate = active.dataset.starts || '';
  let currentStep = 1;
  let toastTimeout;

  function notice(message) {
    const target = $('#toast');
    target.textContent = message;
    target.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => target.classList.remove('show'), 3600);
  }

  function ageAtEvent(dateString) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString) || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null;
    const born = new Date(dateString + 'T12:00:00');
    const event = new Date(startDate + 'T12:00:00');
    if (!Number.isFinite(+born) || !Number.isFinite(+event) || born >= event) return null;
    let years = event.getFullYear() - born.getFullYear();
    if (event.getMonth() < born.getMonth() ||
       (event.getMonth() === born.getMonth() && event.getDate() < born.getDate())) years--;
    return years;
  }

  function refreshGuardian() {
    const age = ageAtEvent($('[name="birth"]').value);
    $('#age').textContent = age === null ? '' : 'Edad durante el evento: ' + age + ' años';
    const requiresGuardian = age !== null && age < 18;
    $('#guardian').style.display = requiresGuardian ? 'block' : 'none';
    $('[name="guardian"]').required = requiresGuardian;
    $('[name="guardianPhone"]').required = requiresGuardian;
  }

  function showStep(number) {
    currentStep = Math.min(4, Math.max(1, number));
    $$('.step').forEach(step => step.classList.toggle('active', Number(step.dataset.s) === currentStep));
    $$('.steps [data-s]').forEach(button => {
      const activeStep = Number(button.dataset.s) === currentStep;
      button.classList.toggle('active', activeStep);
      button.setAttribute('aria-current', activeStep ? 'step' : 'false');
    });
    $('#prev').style.display = currentStep === 1 ? 'none' : '';
    $('#next').style.display = currentStep === 4 ? 'none' : '';
    $('#submit').style.display = currentStep === 4 ? '' : 'none';
    $('#formarea').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validateStep(number) {
    if (preview) return true;
    let valid = true;
    const step = $('.step[data-s="' + number + '"]');
    step.querySelectorAll('[required]').forEach(input => {
      const good = input.checkValidity() && (input.type !== 'file' || !!input.files.length);
      input.closest('.field')?.classList.toggle('bad', !good);
      input.setAttribute('aria-invalid', String(!good));
      if (!good) valid = false;
    });
    if (number === 1 && ageAtEvent($('[name="birth"]').value) === null) {
      const birth = $('[name="birth"]');
      birth.closest('.field')?.classList.add('bad');
      birth.setAttribute('aria-invalid', 'true');
      valid = false;
    }
    return valid;
  }

  async function encodeUpload(file, maxSize) {
    if (!file || file.size > maxSize * 1024 * 1024) {
      throw new Error('Selecciona un archivo de hasta ' + maxSize + ' MB.');
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
      reader.readAsDataURL(file);
    });
  }

  function handleUpload(input, previewId, maxSize) {
    const target = $('#' + previewId);
    const file = input.files?.[0];
    target.classList.remove('show');
    target.textContent = '';
    if (!file) return;
    if (file.size > maxSize * 1024 * 1024) {
      input.value = '';
      notice('El archivo supera el límite de ' + maxSize + ' MB.');
      return;
    }
    target.textContent = '✓ ' + file.name + ' · ' + (file.size / 1048576).toFixed(2) + ' MB';
    target.classList.add('show');
  }

  $('[name="birth"]').addEventListener('change', refreshGuardian);
  $('#photo').addEventListener('change', event => handleUpload(event.target, 'photop', 5));
  $('#receipt').addEventListener('change', event => handleUpload(event.target, 'receiptp', 8));
  $('#prev').addEventListener('click', () => showStep(currentStep - 1));
  $('#next').addEventListener('click', () => {
    if (validateStep(currentStep)) showStep(currentStep + 1);
    else notice('Revisa los campos marcados antes de continuar.');
  });
  $$('.steps [data-s]').forEach(button => button.addEventListener('click', () => {
    const target = Number(button.dataset.s);
    if (preview || target <= currentStep) return showStep(target);
    for (let step = currentStep; step < target; step++) {
      if (!validateStep(step)) return notice('Completa los campos requeridos para avanzar.');
    }
    showStep(target);
  }));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (preview) return notice('Vista previa completada. No se envió una inscripción.');
    for (let step = 1; step <= 4; step++) {
      if (!validateStep(step)) {
        showStep(step);
        return notice('Revisa los datos y autorizaciones de este paso.');
      }
    }
    const button = $('#submit');
    button.disabled = true;
    button.textContent = 'Enviando solicitud…';
    try {
      const fields = Object.fromEntries(new FormData(form));
      const [photo, receipt] = await Promise.all([
        encodeUpload($('#photo').files[0], 5),
        encodeUpload($('#receipt').files[0], 8)
      ]);
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, fields, photo, receipt })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo enviar la solicitud.');
      $('#formarea').style.display = 'none';
      $('#success').style.display = 'block';
      $('#code').textContent = result.id;
      $('#success').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      notice(error.message || 'No se pudo enviar la solicitud. Intenta nuevamente.');
    } finally {
      button.disabled = false;
      button.textContent = 'Enviar solicitud';
    }
  });

  if (preview) $('#submit').textContent = 'Finalizar vista previa';
  refreshGuardian();
  showStep(1);
})();
