import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { metadata, siteUrl, structuredData } from '../services/seo';

export default function PageMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = metadata(pathname);
    document.title = page.title;
    const meta = (key, value, property = false) => {
      const attribute = property ? 'property' : 'name';
      let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!node) { node = document.createElement('meta'); node.setAttribute(attribute, key); document.head.appendChild(node); }
      node.content = value;
    };
    meta('description', page.description);
    meta('robots', page.robots);
    for (const prefix of ['og', 'twitter']) {
      const property = prefix === 'og';
      meta(`${prefix}:title`, page.title, property);
      meta(`${prefix}:description`, page.description, property);
      meta(`${prefix}:image`, siteUrl + '/logo-2.png', property);
      meta(`${prefix}:image:alt`, 'Lak Travelers logo', property);
    }
    meta('og:url', page.canonical, true);
    meta('og:type', 'website', true);
    meta('og:site_name', 'Lak Travelers', true);
    meta('twitter:card', 'summary_large_image');
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = page.canonical;
    let schema = document.getElementById('page-schema');
    if (!schema) { schema = document.createElement('script'); schema.id = 'page-schema'; schema.type = 'application/ld+json'; document.head.appendChild(schema); }
    schema.textContent = JSON.stringify(structuredData(pathname));
  }, [pathname]);
  return null;
}
