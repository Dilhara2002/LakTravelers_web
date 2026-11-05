import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pages = {
  '/': ['Sri Lanka Vehicle Hire & Travel Enquiries', 'Explore Sri Lanka with Lak Travelers. View our vehicles and enquire on WhatsApp without creating an account.'],
  '/vehicles': ['Vehicles for Hire in Sri Lanka', 'Explore Lak Travelers vehicles and enquire about availability, routes and prices on WhatsApp.'],
  '/reviews': ['Customer Reviews', 'Read approved customer travel reviews and share your Sri Lanka journey with Lak Travelers.'],
  '/gallery': ['Travel Gallery', 'Explore travel photos from Lak Travelers journeys across Sri Lanka.'],
  '/about': ['About Us & Contact', 'Contact Lak Travelers, a Sri Lankan vehicle and travel enquiry service under IDW (Pvt) Ltd.'],
  '/privacy': ['Privacy Policy', 'How Lak Travelers handles account information, enquiries, reviews and photos.'],
  '/terms': ['Terms of Use', 'Terms for Lak Travelers enquiries, website use and customer submissions.'],
};
export default function PageMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const entry = pages[pathname] || (pathname.startsWith('/vehicles/') ? pages['/vehicles'] : ['Lak Travelers', 'Sri Lanka travel and vehicle enquiries.']);
    const title = `${entry[0]} | Lak Travelers`;
    const site = (import.meta.env.VITE_SITE_URL || 'https://laktravelers-web.pages.dev').replace(/\/+$/, '');
    document.title = title;
    const meta = (key, value, property = false) => {
      const attribute = property ? 'property' : 'name';
      let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!node) { node = document.createElement('meta'); node.setAttribute(attribute, key); document.head.appendChild(node); }
      node.content = value;
    };
    meta('description', entry[1]);
    meta('og:title', title, true); meta('og:description', entry[1], true);
    meta('og:url', site + pathname, true); meta('og:image', site + '/logo-2.png', true);
    meta('robots', pages[pathname] || pathname.startsWith('/vehicles/') ? 'index,follow' : 'noindex,follow');
    document.querySelector('link[rel="canonical"]').href = site + pathname;
  }, [pathname]);
  return null;
}
