import { useEffect, useState } from 'react';
import PhotoLightbox from '../components/PhotoLightbox';
import API from '../services/api';
import destinations from '../data/sriLankaGallery.json';

const imageURL = id => API.getUri({ url: `/gallery/photos/${id}` });
const categories = ['All', ...new Set(destinations.map(photo => photo.category))];

export default function PublicGallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('All');
  const [active, setActive] = useState(null);
  const visible = category === 'All' ? destinations : destinations.filter(photo => photo.category === category);

  useEffect(() => {
    let current = true;
    API.get('/gallery').then(({ data }) => {
      if (current) setPhotos(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (current) setError('Our own travel photos are temporarily unavailable.');
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">LakTravelers</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Explore Sri Lanka – Photo Gallery</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">Discover the island's heritage, mountain landscapes, tropical beaches and wildlife through photographs by credited photographers.</p>
      </header>
      <div className="mb-6 flex flex-wrap justify-center gap-2" aria-label="Filter destinations">
        {categories.map(item => <button key={item} type="button" aria-pressed={category === item}
          onClick={() => setCategory(item)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${category === item ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-500'}`}>{item}</button>)}
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-slate-500">
        <span aria-live="polite">{visible.length} destination photos</span>
        <a href="#destination-photo-credits" className="underline underline-offset-2 hover:text-blue-700" onClick={() => { const credits = document.getElementById('destination-photo-credits'); if (credits) credits.open = true; }}></a>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((photo, index) => <article key={photo.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <button type="button" onClick={() => setActive({ images: visible.map(p => p.src), captions: visible.map(p => p.caption), index })}
            className="group block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" aria-label={`Enlarge photo: ${photo.caption}`}>
            <div className="aspect-[4/3] overflow-hidden bg-slate-100"><img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
            <div className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-blue-600">{photo.category}</p><h2 className="mt-1 font-semibold text-slate-900">{photo.caption}</h2></div>
          </button>
        </article>)}
      </div>
      
      
      {active && <PhotoLightbox images={active.images} captions={active.captions} label="Travel photo" initialIndex={active.index} onClose={() => setActive(null)} />}
    </main>
  );
}
