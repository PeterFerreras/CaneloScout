(() => {
  'use strict';
  const form = document.querySelector('#login-form');
  if (!form) return;
  const user = document.querySelector('#login-user');
  const password = document.querySelector('#login-password');
  const show = document.querySelector('#login-toggle-password');
  const submit = document.querySelector('#login-submit');
  const submitText = document.querySelector('#login-submit-text');
  const general = document.querySelector('#login-form-feedback');
  const caps = document.querySelector('#login-caps-warning');

  const errorFor = field => document.querySelector('#' + field.id + '-error');
  function check(field) {
    const value = field.value;
    let error = '';
    if (field === user) {
      if (!value.trim()) error = 'Ingresa tu nombre de usuario.';
      else if (!/^[A-Za-z0-9._-]{1,80}$/.test(value)) error = 'El usuario solo admite letras, números, punto, guion y guion bajo.';
    } else {
      if (!value) error = 'Ingresa tu contraseña.';
      else if (value.length < 12) error = 'La contraseña debe contener al menos 12 caracteres.';
      else if (value.length > 512) error = 'La contraseña supera el máximo de 512 caracteres.';
    }
    field.setAttribute('aria-invalid', String(!!error));
    errorFor(field).textContent = error;
    return !error;
  }

  for (const field of [user, password]) {
    field.addEventListener('blur', () => check(field));
    field.addEventListener('input', () => {
      if (field.getAttribute('aria-invalid') === 'true') check(field);
      general.hidden = true;
    });
  }
  show.addEventListener('click', () => {
    const nowVisible = password.type === 'password';
    password.type = nowVisible ? 'text' : 'password';
    show.textContent = nowVisible ? 'Ocultar' : 'Mostrar';
    show.setAttribute('aria-label', nowVisible ? 'Ocultar contraseña' : 'Mostrar contraseña');
    show.setAttribute('aria-pressed', String(nowVisible));
    password.focus({ preventScroll: true });
  });
  const capsState = event => { caps.hidden = !event.getModifierState?.('CapsLock'); };
  password.addEventListener('keydown', capsState);
  password.addEventListener('keyup', capsState);
  password.addEventListener('blur', () => { caps.hidden = true; });

  form.addEventListener('submit', event => {
    const userValid = check(user);
    const passwordValid = check(password);
    if (!userValid || !passwordValid) {
      event.preventDefault();
      general.textContent = 'Revisa los campos marcados para continuar.';
      general.hidden = false;
      (userValid ? password : user).focus();
      return;
    }
    submit.disabled = true;
    submitText.textContent = 'Validando acceso…';
  });
})();