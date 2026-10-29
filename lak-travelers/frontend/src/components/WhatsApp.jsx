import { useLocation } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { whatsappUrl } from '../services/features';
export default function WhatsApp() {
 const { pathname } = useLocation();
 return <a href={whatsappUrl({ pathname })} target="_blank" rel="noopener noreferrer" aria-label="Enquire with Lak Travelers on WhatsApp" className="travel-whatsapp fixed right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl hover:bg-green-700 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-green-700" style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}><FaWhatsapp size={30} /></a>;
}
