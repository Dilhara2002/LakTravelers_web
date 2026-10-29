import { useEffect, useState } from 'react';
import API from '../services/api';

const imageURL = id => API.getUri({ url: `/gallery/photos/${id}` });

export default function PublicGallery() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);

  useEffect(() => {
    let current = true;
    API.get('/gallery').then(({ data }) => {
      if (current) setPhotos(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (current) setError('The gallery could not load. Please try again later.');
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (active === null) return;
    const keydown = event => {
      if (event.key === 'Escape') setActive(null);
      if (event.key === 'ArrowRight') setActive(index => (index + 1) % photos.length);
      if (event.key === 'ArrowLeft') setActive(index => (index - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [active, photos.length]);

  const selected = active === null ? null : photos[active];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">LakTravelers</p>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">Our Travel Gallery</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600">Real travel memories and beautiful places captured during our journeys across Sri Lanka.</p>
      </div>

      {loading && <p className="py-16 text-center text-slate-500" role="status">Loading travel photos...</p>}
      {error && <p className="py-12 text-center text-red-700" role="alert">{error}</p>}
      {!loading && !error && photos.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Travel memories are coming soon</h2>
          <p className="mt-2 text-slate-600">We will share photos from our real journeys here.</p>
        </div>
      )}
      {!loading && !error && photos.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <button key={photo._id} type="button" onClick={() => setActive(index)}
              className="group overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              aria-label={`Enlarge photo: ${photo.caption}`}>
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img src={imageURL(photo._id)} alt={photo.caption} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <p className="p-4 font-semibold text-slate-800">{photo.caption}</p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div role="dialog" aria-modal="true" aria-label="Travel photo viewer"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setActive(null)}>
          <button type="button" onClick={() => setActive(null)} aria-label="Close photo viewer"
            className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 font-bold text-slate-900">Close ×</button>
          <button type="button" aria-label="Previous photo" onClick={event => { event.stopPropagation(); setActive(index => (index - 1 + photos.length) % photos.length); }}
            className="absolute left-2 top-1/2 rounded-full bg-white/90 px-3 py-2 text-xl font-bold text-black sm:left-6">‹</button>
          <div className="max-w-[85vw] text-center" onClick={event => event.stopPropagation()}>
            <img src={imageURL(selected._id)} alt={selected.caption} className="mx-auto max-h-[75vh] max-w-full object-contain" />
            <p className="mt-4 text-sm font-medium text-white">{selected.caption}</p>
          </div>
          <button type="button" aria-label="Next photo" onClick={event => { event.stopPropagation(); setActive(index => (index + 1) % photos.length); }}
            className="absolute right-2 top-1/2 rounded-full bg-white/90 px-3 py-2 text-xl font-bold text-black sm:right-6">›</button>
        </div>
      )}
    </div>
  );
}
