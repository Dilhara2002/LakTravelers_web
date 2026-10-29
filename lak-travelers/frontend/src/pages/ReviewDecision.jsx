import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { Photo } from './CustomerReviews';
export default function ReviewDecision() {
 const { id } = useParams(); const [params] = useSearchParams();
 const action = params.get('action');
 const [review, setReview] = useState(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
 useEffect(() => {
  let active = true;
  API.get(`/customer-reviews/moderation/${id}`).then(({ data }) => { if (active) setReview(data); }).catch(err => { if (active) setMessage(err.response?.data?.message || 'Unable to load this review.'); });
  return () => { active = false; };
 }, [id]);
 const confirm = async () => {
  setBusy(true);
  try {
   const { data } = await API.post(`/customer-reviews/${id}/decision`, { status: action === 'approve' ? 'approved' : 'rejected' });
   setMessage(data.message); setReview(current => ({ ...current, status: data.status }));
   localStorage.setItem('reviewsUpdatedAt', String(Date.now()));
  } catch(err) { setMessage(err.response?.data?.message || 'Decision failed. Try again.'); }
  finally { setBusy(false); }
 };
 const processed = review && !['pending','draft'].includes(review.status);
 return <section className="max-w-3xl mx-auto py-16 px-4 pb-28"><h1 className="text-3xl font-bold">Review confirmation</h1><p className="mt-2 text-slate-600">LakTravelers · A Brand of IDW (Pvt) Ltd</p>
 {message && <p role="status" className="my-5 rounded-xl bg-blue-50 p-4">{message}</p>}
 {!review && !message && <p role="status" className="mt-6">Loading review…</p>}
 {review && <article className="mt-8 bg-white border rounded-3xl p-6"><h2 className="text-xl font-bold">{review.name || review.draftLabel}</h2><p className="text-amber-600 my-3" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</p><time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleString()}</time><p className="my-5 whitespace-pre-wrap break-words">{review.comment || 'No review text supplied yet.'}</p><div className="flex gap-3 flex-wrap">{review.images.map(photo => <Photo key={photo} id={photo} moderate />)}</div>
 {processed ? <p className="mt-6">Already processed: {review.status}.</p> : ['approve','reject'].includes(action) ? <><p className="my-6">Opening this page has not changed the review. Confirm below to {action} it.</p><button disabled={busy || (action === 'approve' && (!review.name?.trim() || review.comment?.trim().length < 10))} onClick={confirm} className="bg-blue-600 text-white rounded-xl px-6 py-3 font-bold disabled:opacity-50">{busy ? 'Saving…' : `Confirm ${action}`}</button></> : <p className="mt-6">Choose a decision from the review moderation page.</p>}
 </article>}
 <Link className="inline-block mt-6 text-blue-700 underline" to="/admin/reviews">Back to review moderation</Link></section>;
}
