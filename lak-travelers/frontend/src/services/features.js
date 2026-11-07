export const PUBLIC_AUTH_ENABLED = false;
// Set a flag to true to restore its existing implementation.
export const SHOW_TOUR_PACKAGES = false;
export const features = { tourPackages: SHOW_TOUR_PACKAGES, hotels: false, smartPlanner: false, community: false, instantBooking: false, marketplaceVehicles: false, chatbot: false };
export const publicRouteEnabled = (path) => !((path.startsWith('/tours') && !features.tourPackages) || (path.startsWith('/hotels') && !features.hotels) || (path === '/smart-planner' && !features.smartPlanner) || (path === '/community' && !features.community));

const vehicleNames = { 'toyota-axio-2016-hybrid': 'Toyota Axio 2016 Hybrid', 'suzuki-wagon-r-stingray-2018-hybrid': 'Suzuki Wagon R Stingray 2018 Hybrid' };
export const whatsappUrl = (context = {}) => {
 const { pathname = globalThis.location?.pathname || '/', service, vehicle, message } = typeof context === 'string' ? { message: context } : context;
 const vehicleName = vehicle || (pathname.startsWith('/vehicles/') ? vehicleNames[pathname.split('/')[2]] : undefined);


 const greeting = message || (
  vehicleName
   ? `Hello, I would like to enquire about the ${vehicleName}.`
   : service
   ? `Hello, I would like to enquire about ${service}.`
   : 'Hello, I would like to know more about your services.'
 );
 return `https://wa.me/94762898945?text=${encodeURIComponent(`LakTravelers |  ${greeting}`)}`;
};
