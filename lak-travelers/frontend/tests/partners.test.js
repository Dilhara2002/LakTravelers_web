import test from 'node:test';
import assert from 'node:assert/strict';
import { partnerCategories, isPhoto, editableStatuses, statuses } from '../../shared/partnerFields.mjs';
import { PUBLIC_AUTH_ENABLED, whatsappUrl, features } from '../src/services/features.js';
test('partner forms have distinct required fields and documents, with no duplicate keys', () => {
  assert.deepEqual(Object.keys(partnerCategories), ['guide', 'driver', 'vehicle']);
  for (const spec of Object.values(partnerCategories)) {
    assert.equal(new Set(spec.fields.map(f => f.key)).size, spec.fields.length);
    assert.equal(new Set(spec.documents).size, spec.documents.length);
    assert.ok(spec.fields.some(f => f.type === 'date' && f.key.endsWith('Expiry')));
  }
  assert.ok(partnerCategories.guide.fields.some(f => f.key === 'licenceNumber'));
  assert.ok(partnerCategories.driver.fields.some(f => f.key === 'touristDriverId'));
  assert.ok(partnerCategories.vehicle.fields.some(f => f.key === 'registrationNumber'));
  assert.equal(isPhoto('profilePhoto'), true);
  assert.equal(isPhoto('nicFront'), false);
  assert.deepEqual(editableStatuses, ['Draft', 'Changes Requested']);
  assert.equal(statuses.length, 7);
});
test('customer booking remains an account-free WhatsApp enquiry', () => {
  assert.equal(PUBLIC_AUTH_ENABLED, false);
  assert.equal(features.instantBooking, false);
  const url = new URL(whatsappUrl({ pathname: '/vehicles/toyota-axio-2016-hybrid' }));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/94762898945');
  assert.match(url.searchParams.get('text'), /Toyota Axio 2016 Hybrid/);
});
