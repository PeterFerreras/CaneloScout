// Global site administration, separate from per-event settings.
export function render(data, { escape }) {
  const settings = data.draft;
  const field = (key, label, kind = 'input', max = 200) => {
    const value = escape(settings[key] ?? '');
    const required = /^(hero|about|footerDescription|seoTitle|seoDescription)/.test(key) ? 'required' : '';
    if (kind === 'textarea') return `<label>${label}<textarea name="${key}" maxlength="${max}" ${required} rows="3">${value}</textarea></label>`;
    return `<label>${label}<input name="${key}" type="text" maxlength="${max}" ${required} value="${value}"></label>`;
  };
  const contentColumns = (heading, keys) => `<section class="card site-settings-panel">
    <div class="site-settings-heading"><h3>${heading}</h3><p>Configura los textos que se mostrarán según el idioma del visitante.</p></div>
    <div class="site-settings-languages">
      ${['Es', 'En'].map(language => `<div class="site-language-column">
        <h4><span class="site-language-code">${language === 'Es' ? 'ES' : 'EN'}</span>
          ${language === 'Es' ? 'Español' : 'English'}</h4>
        ${keys.map(([key, label, kind, max]) => field(key + language, label, kind, max)).join('')}
      </div>`).join('')}
    </div></section>`;
  const status = data.hasUnpublishedChanges
    ? '<span class="tag site-draft-state">Cambios sin publicar</span>'
    : '<span class="tag ok">Sitio actualizado</span>';
  const image = settings.heroImageUrl
    ? `<div class="site-image-preview"><img src="${escape(settings.heroImageUrl)}" alt="Imagen de portada configurada" loading="lazy"></div>`
    : '<p class="site-image-empty">Sin imagen externa: se utilizará la composición gráfica original de Canelo Scout.</p>';

  return `<div class="site-settings">
    <div class="card site-settings-overview">
      <div><span class="eyebrow">GESTIÓN DE CONTENIDO</span><h3>Administración del sitio web</h3>
        <p>Modifica el portal público de Canelo Scout sin editar archivos de código. La configuración de eventos se mantiene independiente.</p>
        <div class="site-settings-status">${status}
          <small>Última publicación: ${escape(data.publishedAt?.replace('T', ' ').slice(0, 16) || '—')} UTC</small></div>
      </div>
      <div class="site-settings-links"><a class="btn light" href="/admin/site/preview" target="_blank" rel="noopener">Vista previa del borrador ↗</a>
        <a class="btn light" href="/" target="_blank" rel="noopener">Ver sitio publicado ↗</a></div>
    </div>
    <form class="site-settings-form" data-action="site">
      ${contentColumns('Portada del sitio', [
        ['heroEyebrow', 'Etiqueta superior', 'input', 150],
        ['heroTitle', 'Título principal', 'input', 75],
        ['heroAccent', 'Título destacado', 'input', 75],
        ['heroDescription', 'Descripción principal', 'textarea', 650]
      ])}
      ${contentColumns('Presentación institucional', [
        ['aboutTitle', 'Título de la sección', 'input', 110],
        ['aboutDescription', 'Descripción institucional', 'textarea', 950]
      ])}
      ${contentColumns('Contenido del pie de página', [
        ['footerDescription', 'Descripción del portal', 'textarea', 600]
      ])}
      ${contentColumns('Posicionamiento SEO', [
        ['seoTitle', 'Título de la página', 'input', 75],
        ['seoDescription', 'Descripción para buscadores', 'textarea', 170]
      ])}
      <section class="card site-settings-panel">
        <div class="site-settings-heading"><h3>Contacto, redes sociales e imagen</h3>
          <p>Estos datos son comunes a las dos versiones del portal. Los enlaces externos deben comenzar con https://</p></div>
        <div class="site-settings-contact">
          <label>Correo de contacto<input type="email" name="contactEmail" maxlength="254" value="${escape(settings.contactEmail)}" placeholder="contacto@dominio.com"></label>
          <label>Instagram<input type="url" name="instagramUrl" maxlength="500" value="${escape(settings.instagramUrl)}" placeholder="https://instagram.com/..."></label>
          <label>Facebook<input type="url" name="facebookUrl" maxlength="500" value="${escape(settings.facebookUrl)}" placeholder="https://facebook.com/..."></label>
          <label>YouTube<input type="url" name="youtubeUrl" maxlength="500" value="${escape(settings.youtubeUrl)}" placeholder="https://youtube.com/..."></label>
          <label class="site-image-input">URL de imagen para la portada
            <input type="url" name="heroImageUrl" maxlength="500" value="${escape(settings.heroImageUrl)}" placeholder="https://.../portada.jpg">
          </label>
        </div>${image}
      </section>
      <div class="site-settings-savebar">
        <div><strong>Borradores y publicación</strong><small>Guardar borrador no altera lo que ven los visitantes. Publicar aplica los cambios al portal.</small></div>
        <div class="site-settings-buttons">
          <button type="submit" name="action" value="save" class="btn light">Guardar borrador</button>
          <button type="submit" name="action" value="publish" class="btn red">Publicar cambios</button>
        </div>
      </div>
    </form>
  </div>`;
}
