import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createSiteSettings } from '../server/site-settings.mjs';

test('site settings preserve independent drafts and published content', () => {
  const db = new DatabaseSync(':memory:');
  try {
    const settings = createSiteSettings(db);
    const original = settings.state();
    assert.equal(original.draft.heroTitleEs, 'CANELO SCOUT');
    assert.equal(original.draft.heroTitleEn, 'CANELO SCOUT');
    assert.equal(original.hasUnpublishedChanges, false);
    const draft = { ...original.draft, heroTitleEs: 'CANELO SCOUT PRESENTACIÓN',
      heroTitleEn: 'CANELO SCOUT DEMO', footerDescriptionEn: 'Welcome to Canelo Scout' };
    const saved = settings.save(draft);
    assert.equal(saved.error, undefined);
    assert.equal(saved.value.hasUnpublishedChanges, true);
    assert.equal(settings.publicSite().heroTitleEs, 'CANELO SCOUT');
    assert.equal(settings.state().draft.heroTitleEn, 'CANELO SCOUT DEMO');
    const published = settings.save(draft, true);
    assert.equal(published.error, undefined);
    assert.equal(published.value.hasUnpublishedChanges, false);
    assert.equal(settings.publicSite().heroTitleEs, 'CANELO SCOUT PRESENTACIÓN');
    assert.equal(settings.publicSite().footerDescriptionEn, 'Welcome to Canelo Scout');
    // Reconstructing the service must preserve published content.
    assert.equal(createSiteSettings(db).publicSite().heroTitleEn, 'CANELO SCOUT DEMO');
  } finally { db.close(); }
});

test('settings validation rejects missing languages and unsafe URLs', () => {
  const db = new DatabaseSync(':memory:');
  try {
    const settings = createSiteSettings(db);
    const valid = settings.state().draft;
    assert.match(settings.save({ ...valid, heroTitleEn: '' }).error, /heroTitleEn/);
    assert.match(settings.save({ ...valid, heroImageUrl: 'javascript:alert(1)' }).error, /HTTPS/);
    assert.match(settings.save({ ...valid, instagramUrl: 'http://instagram.com/example' }).error, /HTTPS/);
    assert.match(settings.save({ ...valid, contactEmail: 'invalid-email' }).error, /correo/);
    assert.equal(settings.save({ ...valid, instagramUrl: 'https://instagram.com/example' }).error, undefined);
  } finally { db.close(); }
});
