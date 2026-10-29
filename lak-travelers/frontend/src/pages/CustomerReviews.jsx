import { useEffect, useRef, useState } from 'react';
import PhotoLightbox from '../components/PhotoLightbox';
import API from '../services/api';
import { Link } from 'react-router-dom';
export function Photo({ id, moderate, open }) {
 const [failed, setFailed] = useState(false);
 const [url, setUrl] = useState('');
 useEffect(() => {
  let active = true, objectUrl;
  API.get(`/customer-reviews/${moderate ? 'moderation/' : ''}photos/${id}`, { responseType: 'blob', timeout: 20000 }).then(({ data }) => {
   if (active) { objectUrl = URL.createObjectURL(data); setUrl(objectUrl); }
  }).catch(() => { if (active) setFailed(true); });
  return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
 }, [id, moderate]);
 return url ? (open ? <button onClick={event => {
 const images = Array.from(event.currentTarget.closest('article').querySelectorAll('[data-review-photo]'), image => image.src);
 open({ images, initialIndex: images.indexOf(url) });
 }} aria-label="Enlarge customer photo"><img data-review-photo src={url} alt="Customer travel photo" loading="lazy" className="w-24 h-24 rounded-xl object-cover" /></button> : <img src={url} alt="Submitted customer travel photo" className="max-h-64 max-w-full rounded-xl object-contain" />) : <span className="text-xs text-slate-500">{failed ? 'Photo unavailable' : 'Loading photo…'}</span>;
}
function ReviewEditor({ review, onSaved }) {
 const [name, setName] = useState(review.name || ''), [comment, setComment] = useState(review.comment || ''), [rating, setRating] = useState(review.rating);
 const [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
 const save = async e => {
  e.preventDefault(); setBusy(true); setNotice('');
  try { const { data } = await API.patch(`/customer-reviews/${review._id}/details`, { name, comment, rating }); onSaved(data); setNotice('Saved. Approve only after confirming these are genuine customer details.'); }
  catch (err) { setNotice(err.response?.data?.message || 'Could not save review.'); }
  finally { setBusy(false); }
 };
 return <form onSubmit={save} className="mt-5 border-t pt-5"><fieldset disabled={busy} className="space-y-4"><legend className="font-bold">Edit review details</legend>
 <label className="block">Customer name<input value={name} maxLength={80} onChange={e => setName(e.target.value)} className="block w-full border rounded-xl p-3 mt-2" /></label>
 <label className="block">Actual review text<textarea value={comment} maxLength={2000} rows={4} onChange={e => setComment(e.target.value)} className="block w-full border rounded-xl p-3 mt-2" /></label>
 <fieldset><legend>Rating</legend><div className="flex gap-1">{[1,2,3,4,5].map(n => <label key={n} className="cursor-pointer"><input type="radio" name={`rating-${review._id}`} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" /><span aria-hidden="true" className={`block px-2 py-2 text-3xl rounded-lg peer-focus-visible:outline ${n <= rating ? 'text-amber-500' : 'text-slate-400'}`}>★</span><span className="sr-only">{n} stars</span></label>)}</div></fieldset>
 <button type="submit" className="rounded-xl border border-blue-600 px-4 py-2 text-blue-700">{busy ? 'Saving…' : 'Save changes'}</button></fieldset>{notice && <p role="status" className="mt-3 text-sm">{notice}</p>}</form>;
}
export default function CustomerReviews({ moderate = false, embedded = false }) {
 const [reviews, setReviews] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
 const [name, setName] = useState(''), [rating, setRating] = useState(''), [comment, setComment] = useState('');
 const [photos, setPhotos] = useState([]), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [lightbox, setLightbox] = useState('');
 const photoRef = useRef([]), website = useRef(null);
 useEffect(() => () => photoRef.current.forEach(p => URL.revokeObjectURL(p.url)), []);
 useEffect(() => {
  let active = true, inFlight = false;
  const refresh = async () => {
   if (inFlight) return;
   inFlight = true;
   try { const { data } = await API.get(`/customer-reviews${moderate ? '/moderation' : ''}`, { timeout: 15000 }); if (active) { setReviews(data); setError(''); } }
   catch { if (active) setError('Reviews could not be loaded. Please refresh to try again.'); }
   finally { inFlight = false; if (active) setLoading(false); }
  };
  refresh();
  const timer = !moderate ? setInterval(refresh, 10000) : null;
  window.addEventListener('focus', refresh);
  const onStorage = event => { if (event.key === 'reviewsUpdatedAt') refresh(); };
  window.addEventListener('storage', onStorage);
  return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('storage', onStorage); };
 }, [moderate]);
 const changePhotos = next => { photoRef.current = next; setPhotos(next); };
 const addPhotos = e => {
  const files = Array.from(e.target.files); e.target.value = '';
  if (photos.length + files.length > 5 || files.some(f => !['image/jpeg','image/png','image/webp'].includes(f.type) || f.size > 5 * 1024 * 1024)) { setNotice('Choose up to 5 JPG, PNG or WebP photos, maximum 5 MB each.'); return; }
  setNotice(''); changePhotos([...photos, ...files.map(file => ({ file, url: URL.createObjectURL(file) }))]);
 };
 const submit = async e => {
  e.preventDefault(); setNotice('');
  if (!name.trim() || comment.trim().length < 10 || !rating || /[<>]/.test(name + comment)) { setNotice('Enter your name, a rating and at least 10 characters of plain text.'); return; }
  const body = new FormData(); body.append('name', name.trim()); body.append('rating', rating); body.append('comment', comment.trim()); body.append('website', website.current.value);
  photos.forEach(p => body.append('photos', p.file)); setBusy(true);
  try {
   const { data } = await API.post('/customer-reviews', body, { headers: { 'Content-Type': undefined }, timeout: 60000 });
   setNotice(data.message); setName(''); setRating(''); setComment(''); photos.forEach(p => URL.revokeObjectURL(p.url)); changePhotos([]);
  } catch (err) { setNotice(err.response?.data?.message || 'Unable to submit. Please try again.'); }
  finally { setBusy(false); }
 };
 const approve = async (id, status) => {
  setBusy(true); setNotice('');
  try { await API.post(`/customer-reviews/${id}/decision`, { status }); localStorage.setItem('reviewsUpdatedAt', String(Date.now())); setReviews(reviews.filter(r => r._id !== id)); setNotice(`Review ${status}.`); }
  catch (err) { setNotice(err.response?.data?.message || 'Could not update review.'); }
  finally { setBusy(false); }
 };
 const retryNotification = async id => {
  setBusy(true); setNotice('');
  try { const { data } = await API.post(`/customer-reviews/${id}/notify`); setNotice(data.message); setReviews(current => current.map(r => r._id === id ? {...r, notification:data.notification} : r)); }
  catch(err) { setNotice(err.response?.data?.message || 'Notification retry failed.'); }
  finally { setBusy(false); }
 };
 const Heading = embedded ? 'h2' : 'h1';
 const input = 'block mt-2 w-full rounded-xl border border-slate-300 p-3 focus:outline-blue-600';
 return <section className="mx-auto max-w-6xl px-4 py-12 md:py-20 pb-28">
 <Heading className="text-3xl md:text-5xl font-black">{moderate ? 'Review Moderation' : 'Customer Reviews'}</Heading>
 <p className="mt-4 mb-10 text-slate-500">{moderate ? 'Complete the private drafts with genuine customer details, save your changes, then approve them for public display.' : 'Share your Sri Lanka journey with Lak Travelers. Reviews appear after approval.'}</p>
 <div className={`grid gap-10 ${moderate || embedded ? '' : 'lg:grid-cols-2'}`}>
 {!moderate && !embedded && <form id="write-review" onSubmit={submit} className="bg-white rounded-3xl border p-6 md:p-8 shadow-sm self-start"><h2 className="text-2xl font-bold mb-6">Share your experience</h2><fieldset disabled={busy} className="space-y-5">
 <label className="block font-medium">Your name<input required maxLength={80} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className={input} /></label>
 <fieldset><legend className="font-medium mb-2">Your rating (required)</legend><div className="flex gap-1 sm:gap-2">{[1,2,3,4,5].map(n => <label key={n} className="cursor-pointer text-center"><input required type="radio" name="rating" value={n} checked={Number(rating) === n} onChange={e => setRating(e.target.value)} className="peer sr-only" /><span aria-hidden="true" className={`block rounded-lg px-2 sm:px-3 py-2 text-3xl peer-focus-visible:outline peer-focus-visible:outline-blue-600 ${n <= Number(rating) ? 'text-amber-500 bg-amber-50' : 'text-slate-400 bg-slate-50'}`}>★</span><span className="sr-only">{n} {n === 1 ? 'star' : 'stars'}</span></label>)}</div></fieldset>
 <label className="block font-medium">Your review<textarea required minLength={10} maxLength={2000} rows={5} value={comment} onChange={e => setComment(e.target.value)} className={input} /><span className="text-xs text-slate-500">10–2000 characters. Please avoid personal contact information.</span></label>
 <label className="block font-medium">Travel photos (optional)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addPhotos} className="block mt-2 w-full text-sm" /><span className="text-xs text-slate-500">Up to 5 photos, maximum 5 MB each. Approved photos will be public.</span></label>
 <div className="flex flex-wrap gap-3">{photos.map((p,i) => <div key={p.url}><img src={p.url} alt={`Selected photo ${i+1}`} className="w-24 h-24 rounded-xl object-cover" /><button type="button" aria-label={`Remove photo ${i+1}`} className="text-red-700 text-sm underline" onClick={() => { URL.revokeObjectURL(p.url); changePhotos(photos.filter((_,j) => i !== j)); }}>Remove</button></div>)}</div>
 <div hidden><label>Leave empty<input ref={website} name="website" tabIndex={-1} autoComplete="off" /></label></div>
 <button className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white disabled:opacity-50" type="submit">{busy ? 'Submitting…' : 'Submit Review'}</button></fieldset>
 {notice && <p role="status" className="mt-5 rounded-xl bg-blue-50 p-4 text-blue-900">{notice}</p>}</form>}
 <div className="space-y-6">{loading && <p role="status">Loading reviews…</p>}{error && <p role="alert" className="text-red-700">{error}</p>}
 {!loading && !error && !reviews.length && <div className="bg-white p-10 rounded-3xl border border-dashed"><h2 className="text-xl font-bold">{moderate ? 'No reviews awaiting approval' : 'No reviews yet'}</h2><p className="mt-3 text-slate-500">{moderate ? 'New submissions will appear here.' : 'Have you travelled with us? Be the first to share your experience.'}</p>{!moderate && <Link to={embedded ? '/reviews#write-review' : '#write-review'} className="inline-block mt-5 rounded-xl bg-blue-600 px-5 py-3 text-white font-bold">Write a Review</Link>}</div>}
 {reviews.map(r => <article key={r._id} className="bg-white p-6 rounded-3xl border shadow-sm"><h2 className="text-xl font-bold break-words">{r.name || r.draftLabel || 'Unnamed review'}</h2>{moderate && <p className="mt-1 text-sm text-blue-700">{r.status === 'draft' ? `${r.draftLabel || 'Admin draft'} — private` : 'Pending approval'}</p>}<div className="text-amber-600 my-2" aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div><time dateTime={r.createdAt} className="text-sm text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</time><p className="my-4 whitespace-pre-wrap break-words">{r.comment}</p><div className="flex flex-wrap gap-2">{r.images.map(id => <Photo key={id} id={id} moderate={moderate} open={setLightbox} />)}</div>{moderate && <ReviewEditor review={r} onSaved={data => setReviews(current => current.map(item => item._id === data._id ? { ...item, ...data } : item))} />}{moderate && <div className="flex flex-wrap gap-4 mt-6"><button disabled={busy || !r.name?.trim() || (r.comment?.trim().length || 0) < 10} onClick={() => approve(r._id,'approved')} className="bg-blue-600 text-white rounded-xl px-4 py-2 disabled:opacity-50">Approve</button><button disabled={busy} onClick={() => approve(r._id,'rejected')} className="border text-red-700 rounded-xl px-4 py-2 disabled:opacity-50">Reject</button>{r.status === 'pending' && <button disabled={busy} onClick={() => retryNotification(r._id)} className="border rounded-xl px-4 py-2 text-blue-700 disabled:opacity-50">Retry email notification</button>}</div>}{moderate && r.status === 'pending' && <p className="mt-3 text-sm text-slate-600">Email: {r.notification?.status || 'not-sent'}</p>}</article>)}</div></div>
 {embedded && reviews.length > 0 && <Link to="/reviews" className="inline-block mt-6 text-blue-700 font-bold underline">Write a Review</Link>}
 {moderate && notice && <p role="status" className="mt-6 p-4 bg-blue-50 rounded-xl">{notice}</p>}
 {lightbox && <PhotoLightbox {...lightbox} onClose={() => setLightbox('')} />}
 </section>;
}
