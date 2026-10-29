// Set a flag to true to restore its existing implementation.
export const SHOW_TOUR_PACKAGES = false;
export const features = { tourPackages: SHOW_TOUR_PACKAGES, hotels: false, smartPlanner: false, community: false, instantBooking: false, marketplaceVehicles: false, chatbot: false };
export const publicRouteEnabled = (path) => !((path.startsWith('/tours') && !features.tourPackages) || (path.startsWith('/hotels') && !features.hotels) || (path === '/smart-planner' && !features.smartPlanner) || (path === '/community' && !features.community));
const pageNames = { '/': 'Home', '/about': 'About Us', '/reviews': 'Customer Reviews', '/vehicles': 'Vehicles', '/tours': 'Tours', '/privacy': 'Privacy Policy', '/smart-planner': 'Smart Planner', '/community': 'Community' };
const vehicleNames = { 'toyota-axio-2016-hybrid': 'Toyota Axio 2016 Hybrid', 'suzuki-wagon-r-stingray-2018-hybrid': 'Suzuki Wagon R Stingray 2018 Hybrid' };
export const whatsappUrl = (context = {}) => {
 const { pathname = globalThis.location?.pathname || '/', service, vehicle, message } = typeof context === 'string' ? { message: context } : context;
 const vehicleName = vehicle || vehicleNames[pathname.split('/')[2]];
 const page = pageNames[pathname] || pathname.split('/').filter(Boolean).map(part => part.replaceAll('-', ' ')).join(' / ') || 'Home';
 const subject = vehicleName ? `Service: Vehicle Booking | Vehicle: ${vehicleName}` : service ? `Service: ${service}` : `Page: ${page}`;
 const greeting = message || (vehicleName ? 'Hello, I would like to enquire about this vehicle.' : 'Hello, I would like to know more about your services.');
 return `https://wa.me/94723201365?text=${encodeURIComponent(`LakTravelers | Source: Website | ${subject} | ${greeting}`)}`;
};
