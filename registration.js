function encodeUpload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.querySelectorAll('.nav [data-v]:not([data-v="home"]):not([data-v="register"])')
  .forEach(button => { button.hidden = true; });
document.querySelectorAll('[onclick]').forEach(element => {
  const action = element.getAttribute('onclick');
  if (/^go\('(admin|roster|event|media)'\)/.test(action)) element.remove();
});
go('register');
const activeEvent = document.querySelector('#active-event');
const preview = activeEvent.dataset.preview === 'true';
const homeButton = document.querySelector('[data-v="home"]');
const goHome = () => { location.href = '/'; };
if (homeButton) homeButton.onclick = goHome;
document.querySelector('.brand').onclick = goHome;
if (preview) {
  $('#submit').textContent = 'Finalizar vista previa';
  $('#next').onclick = () => setStep(step + 1);
}
document.querySelectorAll('.steps [data-s]').forEach(button => {
  button.onclick = () => {
    const target = Number(button.dataset.s);
    if (preview || target <= step) return setStep(target);
    for (let previous = step; previous < target; previous++) {
      if (!valid(previous)) return toast('Completa los campos requeridos antes de continuar.');
    }
    setStep(target);
  };
});

$('#form').onsubmit = async event => {
  event.preventDefault();
  if (preview) return toast('Vista previa completada. No se envió una inscripción.');
  if (![1, 2, 3, 4].every(valid)) return toast('Revisa los campos del registro.');
  const button = $('#submit');
  button.disabled = true;
  try {
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const [photo, receipt] = await Promise.all([
      encodeUpload($('#photo').files[0]), encodeUpload($('#receipt').files[0])
    ]);
    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: activeEvent.dataset.id, fields, photo, receipt })
    });
    const result = await response.json();
    if (!response.ok) return toast(result.error);
    $('#code').textContent = result.id;
    $('#formarea').style.display = 'none';
    $('#success').style.display = 'block';
  } catch {
    toast('No se pudo enviar la solicitud. Intenta de nuevo.');
  } finally {
    button.disabled = false;
  }
};

