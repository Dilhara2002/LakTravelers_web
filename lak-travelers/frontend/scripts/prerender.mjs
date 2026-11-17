import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer, loadEnv } from 'vite';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import process from 'node:process';
import { dirname } from 'node:path';

// Reuse Vite's JSX loader and the actual landing component; no browser or API calls.
const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env };
const server = await createServer({ mode: 'production', server: { middlewareMode: true, hmr: false, ws: false }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom', define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(env.VITE_SITE_URL || 'https://laktravelers.com') } });
try {
  const { pages, metadata, structuredData, siteUrl } = await server.ssrLoadModule('/src/services/seo.js');
  const { servicePages } = await server.ssrLoadModule('/src/services/servicePages.js');
  const { default: ServiceLanding } = await server.ssrLoadModule('/src/pages/ServiceLanding.jsx');
  const template = await readFile('dist/index.html', 'utf8');
  const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const htmlFor = (path, content = '') => {
    const page = metadata(path);
    const head = `<title>${escape(page.title)}</title>\n` +
      [['description', page.description], ['robots', page.robots], ['twitter:card', 'summary_large_image'], ['twitter:title', page.title], ['twitter:description', page.description], ['twitter:image', siteUrl + '/logo-2.png'], ['twitter:image:alt', 'Lak Travelers logo']].map(([name, value]) => `<meta name="${name}" content="${escape(value)}" />`).join('\n') +
      [['og:type', 'website'], ['og:site_name', 'Lak Travelers'], ['og:title', page.title], ['og:description', page.description], ['og:url', page.canonical], ['og:image', siteUrl + '/logo-2.png'], ['og:image:alt', 'Lak Travelers logo']].map(([name, value]) => `<meta property="${name}" content="${escape(value)}" />`).join('\n') +
      `<link rel="canonical" href="${escape(page.canonical)}" /><script id="page-schema" type="application/ld+json">${JSON.stringify(structuredData(path)).replaceAll('<', '\\u003c')}</script>`;
    return template.replace(/<title>[\s\S]*?<\/title>/g, '').replace(/<meta\s+(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, '').replace(/<link rel="canonical"[^>]*>/g, '').replace('</head>', `${head}\n</head>`).replace('<div id="root"></div>', `<div id="root">${content}</div>`);
  };
  for (const path of Object.keys(pages)) {
    const content = servicePages[path] ? renderToString(createElement(MemoryRouter, { initialEntries: [path] }, createElement('main', null, createElement(ServiceLanding, { path })))) : '';
    const file = path === '/' ? 'dist/index.html' : `dist${path}.html`;
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, htmlFor(path, content));
  }
  await writeFile('dist/app.html', htmlFor('/unavailable'));
  await writeFile('dist/404.html', htmlFor('/404', '<main class="p-12 text-center"><h1>404 — Page not found</h1><p><a href="/">Return to Lak Travelers</a></p></main>'));
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.keys(pages).map(path => `  <url><loc>${escape(siteUrl + path)}</loc></url>`).join('\n')}\n</urlset>\n`;
  await writeFile('dist/sitemap.xml', sitemap);
  await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`Generated metadata for ${Object.keys(pages).length} public routes; pre-rendered ${Object.keys(servicePages).length} service pages.`);
} finally {
  await server.close();
}
