import { servicePages } from './servicePages.js';

export const siteUrl = (import.meta.env?.VITE_SITE_URL || 'https://laktravelers.com').replace(/\/+$/, '');
export const pages = {
  '/': ['Sri Lanka Private Tours & Car Hire with Driver', 'Explore Sri Lanka with Lak Travelers. Discover private tours, reliable drivers, comfortable vehicles and personalized travel experiences. Enquire on WhatsApp.'],
  '/vehicles': ['Sri Lanka Vehicle Hire', 'Browse the Toyota Axio and Suzuki Wagon R from Lak Travelers. Discuss your Sri Lanka route, travel dates and vehicle availability on WhatsApp.'],
  '/vehicles/toyota-axio-2016-hybrid': ['Toyota Axio 2016 Hybrid Hire in Sri Lanka', 'Enquire about the Toyota Axio 2016 Hybrid for your Sri Lanka journey. Share your route, passenger count and luggage needs with Lak Travelers.'],
  '/vehicles/suzuki-wagon-r-stingray-2018-hybrid': ['Suzuki Wagon R Stingray Hire in Sri Lanka', 'Explore the Suzuki Wagon R Stingray 2018 Hybrid. Contact Lak Travelers to check availability and suitability for your Sri Lanka travel plans.'],
  '/reviews': ['Lak Travelers Customer Reviews', 'Read customer reviews of journeys with Lak Travelers in Sri Lanka, or share your own travel experience for review and publication.'],
  '/gallery': ['Sri Lanka Travel Gallery', 'See photos from Lak Travelers journeys across Sri Lanka and find inspiration for your own personalized travel itinerary.'],
  '/about': ['About Lak Travelers & Contact', 'Meet the team behind Lak Travelers, a travel and transportation brand of IDW Private Limited. Contact us to discuss your journey across Sri Lanka.'],
  '/privacy': ['Privacy Policy', 'Learn how Lak Travelers handles account details, travel enquiries, customer reviews and uploaded photos, and how to contact us about privacy.'],
  '/terms': ['Terms of Use', 'Read the terms for using the Lak Travelers website, making travel enquiries and submitting reviews or photos. Confirm trip arrangements with our team.'],
  ...Object.fromEntries(Object.entries(servicePages).map(([path, page]) => [path, [page.title, page.description]])),
};
export const normalizePath = path => path.replace(/\/+$/, '') || '/';
export function metadata(path) {
  const pathname = normalizePath(path);
  const entry = pages[pathname];
  return { title: `${entry?.[0] || 'Page unavailable'} | Lak Travelers`, description: entry?.[1] || 'This page is not available for public search. Explore Lak Travelers services or contact our team.', canonical: siteUrl + pathname, robots: entry ? 'index,follow' : 'noindex,follow' };
}
export function structuredData(path) {
  const pathname = normalizePath(path);
  if (!pages[pathname]) return [];
  const business = { '@type': 'TravelAgency', '@id': `${siteUrl}/#organization`, name: 'Lak Travelers', url: siteUrl, logo: `${siteUrl}/logo-2.png`, telephone: '+94762898945', email: 'wijesinghelageishan@gmail.com', address: { '@type': 'PostalAddress', streetAddress: '73/D Walagedara', addressLocality: 'Wattappola', addressCountry: 'LK' }, sameAs: ['https://www.facebook.com/share/1C47A29Ljm/?mibextid=wwXIfr'] };
  const graph = [business, { '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: siteUrl, name: 'Lak Travelers', publisher: { '@id': business['@id'] } }];
  if (pathname !== '/') {
    const crumbs = [{ name: 'Home', item: siteUrl + '/' }];
    if (pathname.startsWith('/vehicles/')) crumbs.push({ name: 'Vehicles', item: siteUrl + '/vehicles' });
    crumbs.push({ name: pages[pathname][0], item: siteUrl + pathname });
    graph.push({ '@type': 'BreadcrumbList', itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, ...crumb })) });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
