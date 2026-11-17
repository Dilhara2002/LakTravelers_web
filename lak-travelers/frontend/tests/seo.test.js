import test from 'node:test';
import assert from 'node:assert/strict';
import { pages, metadata, structuredData } from '../src/services/seo.js';
import { servicePages } from '../src/services/servicePages.js';

test('only known public pages are indexable, including normalized trailing slashes', () => {
  for (const path of Object.keys(pages)) {
    assert.equal(metadata(path).robots, 'index,follow');
    assert.equal(metadata(path + '/').canonical, metadata(path).canonical);
  }
  for (const path of ['/admin/login', '/admin/reviews', '/login', '/profile', '/tours', '/hotels', '/vehicles/missing', '/missing']) {
    assert.equal(metadata(path).robots, 'noindex,follow');
    assert.deepEqual(structuredData(path), []);
  }
  assert.equal(new Set(Object.keys(pages).map(path => metadata(path).title)).size, Object.keys(pages).length);
  assert.equal(new Set(Object.keys(pages).map(path => metadata(path).description)).size, Object.keys(pages).length);
});
test('landing pages use verified schema and ordered breadcrumbs', () => {
  assert.equal(Object.keys(servicePages).length, 4);
  for (const path of Object.keys(servicePages)) {
    const schema = structuredData(path);
    assert.equal(schema['@context'], 'https://schema.org');
    assert.equal(schema['@graph'][0].telephone, '+94762898945');
    const crumbs = schema['@graph'].find(item => item['@type'] === 'BreadcrumbList').itemListElement;
    assert.equal(crumbs.at(-1).item, metadata(path).canonical);
    assert.deepEqual(crumbs.map(item => item.position), [1, 2]);
    assert.ok(!JSON.stringify(schema).includes('aggregateRating'));
  }
});
