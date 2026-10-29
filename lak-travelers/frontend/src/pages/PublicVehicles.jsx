import { Link, useParams } from 'react-router-dom';
import { whatsappUrl } from '../services/features';
import toyota from '../assets/toyota-axio.jpg';
import suzuki from '../assets/suzuki-wagon-r.jpg';
const vehicles = [
 { id: 'toyota-axio-2016-hybrid', name: 'Toyota Axio 2016 Hybrid', image: toyota, alt: 'White Toyota Axio beside a lake and Buddhist temple in Sri Lanka' },
 { id: 'suzuki-wagon-r-stingray-2018-hybrid', name: 'Suzuki Wagon R Stingray 2018 Hybrid', image: suzuki, alt: 'White Suzuki Wagon R Stingray beside a tropical reservoir in Sri Lanka' },
];
export default function PublicVehicles({ detail = false, embedded = false }) {
 const Heading = embedded ? 'h2' : 'h1';
 const { id } = useParams();
 const shown = detail ? vehicles.filter(v => v.id === id) : vehicles;
 return <section className="max-w-6xl mx-auto px-4 py-16"><Heading className="text-4xl font-black text-slate-900">Our Vehicles</Heading><p className="mt-4 mb-10 text-lg text-slate-500">Tell us about your journey in Sri Lanka. Contact us for availability and a personal quote.</p>
 {!shown.length && <p>This vehicle is not currently listed. <Link className="text-blue-600 underline" to="/vehicles">View our vehicles</Link></p>}
 <div className="grid md:grid-cols-2 gap-8">{shown.map(v => <article key={v.id} className="bg-white rounded-3xl overflow-hidden shadow-lg"><Link to={`/vehicles/${v.id}`}><img src={v.image} alt={v.alt} width="1400" height="788" loading="lazy" decoding="async" className="w-full aspect-video object-cover" /></Link><div className="p-6"><h2 className="text-2xl font-bold">{v.name}</h2><a href={whatsappUrl({ vehicle: v.name })} target="_blank" rel="noopener noreferrer" className="inline-block mt-6 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700">Enquire on WhatsApp</a></div></article>)}</div></section>;
}
