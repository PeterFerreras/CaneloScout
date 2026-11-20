// Global portal content is independent of event configuration.
// Drafts are private; only published content is used by the public website.
export const SITE_DEFAULTS = Object.freeze({
  heroEyebrowEs: '🇺🇸 TRYOUT PARA BECAS · COLLEGE · HIGH SCHOOL',
  heroEyebrowEn: '🇺🇸 SCHOLARSHIP TRYOUT · COLLEGE · HIGH SCHOOL',
  heroTitleEs: 'CANELO SCOUT',
  heroTitleEn: 'CANELO SCOUT',
  heroAccentEs: 'INVITATIONAL',
  heroAccentEn: 'INVITATIONAL',
  heroDescriptionEs: 'Una sola plataforma para captar talento, validar solicitudes, completar equipos durante el evento y publicar perfiles deportivos listos para prensa y scouts.',
  heroDescriptionEn: 'One platform to scout talent, review applications, build teams during the event, and publish player profiles for media and scouts.',
  aboutTitleEs: 'DEL REGISTRO AL DIAMANTE',
  aboutTitleEn: 'FROM REGISTRATION TO THE DIAMOND',
  aboutDescriptionEs: 'La plataforma acompaña al organizador antes, durante y después del evento. Cada dato se captura una vez y se reutiliza en toda la operación.',
  aboutDescriptionEn: 'One platform supports organizers before, during, and after the event. Enter information once and reuse it across the operation.',
  footerDescriptionEs: 'Conectamos a los atletas con nuevas oportunidades mediante eventos y perfiles deportivos.',
  footerDescriptionEn: 'Connecting athletes to new opportunities through events and sports profiles.',
  seoTitleEs: 'Canelo Scout | Eventos y scouting deportivo',
  seoTitleEn: 'Canelo Scout | Events and sports scouting',
  seoDescriptionEs: 'Descubre eventos deportivos, inscripciones y perfiles de talento en Canelo Scout.',
  seoDescriptionEn: 'Explore sports events, registrations, and talent profiles at Canelo Scout.',
  contactEmail: '',
  instagramUrl: '',
  facebookUrl: '',
  youtubeUrl: '',
  heroImageUrl: ''
});

const limits = {
  heroEyebrowEs: 150, heroEyebrowEn: 150,
  heroTitleEs: 75, heroTitleEn: 75,
  heroAccentEs: 75, heroAccentEn: 75,
  heroDescriptionEs: 650, heroDescriptionEn: 650,
  aboutTitleEs: 110, aboutTitleEn: 110,
  aboutDescriptionEs: 950, aboutDescriptionEn: 950,
  footerDescriptionEs: 600, footerDescriptionEn: 600,
  seoTitleEs: 75, seoTitleEn: 75,
  seoDescriptionEs: 170, seoDescriptionEn: 170,
  contactEmail: 254,
  instagramUrl: 500, facebookUrl: 500, youtubeUrl: 500, heroImageUrl: 500
};
const optionalFields = new Set(['contactEmail', 'instagramUrl', 'facebookUrl', 'youtubeUrl', 'heroImageUrl']);
const socialFields = ['instagramUrl', 'facebookUrl', 'youtubeUrl', 'heroImageUrl'];

function validateSettings(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'Datos de configuración inválidos.' };
  }
  const result = {};
  for (const [key, maximum] of Object.entries(limits)) {
    const value = input[key];
    if (typeof value !== 'string') return { error: 'Completa el campo ' + key + '.' };
    const cleaned = value.trim();
    if (cleaned.length > maximum || (!optionalFields.has(key) && !cleaned)) {
      return { error: 'Revisa el contenido de ' + key + ' (máximo ' + maximum + ' caracteres).' };
    }
    result[key] = cleaned;
  }
  if (result.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.contactEmail)) {
    return { error: 'Introduce un correo de contacto válido.' };
  }
  for (const field of socialFields) {
    if (!result[field]) continue;
    try {
      const url = new URL(result[field]);
      if (url.protocol !== 'https:' || url.username || url.password || !url.hostname) {
        return { error: 'Los enlaces de imágenes y redes sociales deben utilizar HTTPS.' };
      }
    } catch {
      return { error: 'Revisa el enlace en ' + field + '.' };
    }
  }
  return { value: result };
}

export function createSiteSettings(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    published TEXT NOT NULL,
    draft TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    published_at TEXT NOT NULL
  )`);
  const defaults = JSON.stringify(SITE_DEFAULTS);
  const now = new Date().toISOString();
  db.prepare('INSERT OR IGNORE INTO site_settings (id, published, draft, updated_at, published_at) VALUES (1, ?, ?, ?, ?)')
    .run(defaults, defaults, now, now);

  const row = () => db.prepare('SELECT * FROM site_settings WHERE id = 1').get();
  const parse = value => ({ ...SITE_DEFAULTS, ...JSON.parse(value) });
  const publicSite = () => parse(row().published);
  const state = () => {
    const current = row();
    return {
      draft: parse(current.draft),
      published: parse(current.published),
      updatedAt: current.updated_at,
      publishedAt: current.published_at,
      hasUnpublishedChanges: current.draft !== current.published
    };
  };
  const save = (input, publish = false) => {
    const check = validateSettings(input);
    if (check.error) return check;
    const json = JSON.stringify(check.value);
    const timestamp = new Date().toISOString();
    if (publish) {
      db.prepare('UPDATE site_settings SET draft=?, published=?, updated_at=?, published_at=? WHERE id=1')
        .run(json, json, timestamp, timestamp);
    } else {
      db.prepare('UPDATE site_settings SET draft=?, updated_at=? WHERE id=1').run(json, timestamp);
    }
    return { value: state() };
  };
  return { publicSite, state, save };
}
