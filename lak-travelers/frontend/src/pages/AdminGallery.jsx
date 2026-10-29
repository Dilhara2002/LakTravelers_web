import { useEffect, useState } from 'react';
import API from '../services/api';

function PrivatePhoto({ id, alt }) {
  const [url, setURL] = useState('');
  useEffect(() => {
    let alive = true;
    let objectURL = '';
    API.get(`/gallery/admin/photos/${id}`, { responseType: 'blob' })
      .then(({ data }) => {
        objectURL = URL.createObjectURL(data);
        if (alive) setURL(objectURL);
        else URL.revokeObjectURL(objectURL);
      }).catch(() => {});
    return () => {
      alive = false;
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [id]);
  return url ? <img src={url} alt={alt} className="h-44 w-full object-cover" />
    : <div className="flex h-44 items-center justify-center bg-slate-100 text-slate-500">Image preview</div>;
}

export default function AdminGallery() {
  const [photos, setPhotos] = useState([]);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      const { data } = await API.get('/gallery/admin');
      setPhotos(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot load admin gallery. Please sign in as an administrator.');
    } finally { setLoading(false); }
  }
  useEffect(() => { reload(); }, []);

  async function upload(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError(''); setMessage('');
    if (!file || !caption.trim()) { setError('Choose a photo and enter a caption.'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPG, PNG or WebP photo smaller than 5 MB.'); return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      form.append('caption', caption.trim());
      await API.post('/gallery', form, { headers: { 'Content-Type': undefined }, timeout: 60000 });
      setCaption(''); setFile(null);
      formElement.reset();
      setMessage('Photo uploaded privately. Choose Publish to show it on the public gallery.');
      await reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Photo upload failed.');
    } finally { setBusy(false); }
  }

  async function setPublished(photo) {
    setError(''); setMessage(''); setBusy(true);
    try {
      await API.patch(`/gallery/${photo._id}`, { published: !photo.published });
      setMessage(!photo.published ? 'Photo published.' : 'Photo hidden from the public gallery.');
      await reload();
    } catch (err) { setError(err.response?.data?.message || 'Could not update photo.'); }
    finally { setBusy(false); }
  }

  async function editCaption(photo) {
    const value = window.prompt('Enter a new caption (1–160 characters)', photo.caption);
    if (value === null || !value.trim()) return;
    setError(''); setBusy(true);
    try {
      await API.patch(`/gallery/${photo._id}`, { caption: value.trim() });
      await reload();
    } catch (err) { setError(err.response?.data?.message || 'Could not update caption.'); }
    finally { setBusy(false); }
  }

  async function remove(photo) {
    if (!window.confirm(`Permanently delete this gallery photo?\n${photo.caption}`)) return;
    setError(''); setBusy(true);
    try {
      await API.delete(`/gallery/${photo._id}`);
      setMessage('Gallery photo deleted.');
      await reload();
    } catch (err) { setError(err.response?.data?.message || 'Could not delete photo.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Manage Travel Gallery</h1>
      <p className="mt-2 text-slate-600">Upload real tour photographs. New photos are private until you publish them.</p>
      <form onSubmit={upload} className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block text-sm font-semibold text-slate-700">Photo (JPG/PNG/WebP, max 5 MB)
          <input className="mt-2 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" required
            onChange={event => setFile(event.target.files?.[0] || null)} />
        </label>
        <label className="block text-sm font-semibold text-slate-700">Caption
          <input className="mt-2 block w-full rounded-lg border border-slate-300 p-3" type="text" maxLength={160} required
            placeholder="Example: Scenic journey near Ella" value={caption} onChange={event => setCaption(event.target.value)} />
        </label>
        <button type="submit" disabled={busy} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Upload Photo</button>
      </form>
      {error && <p className="mt-4 text-red-700" role="alert">{error}</p>}
      {message && <p className="mt-4 text-green-700" role="status">{message}</p>}
      {loading ? <p role="status" className="mt-10">Loading photos…</p> : error ? null : photos.length === 0 ? <p className="mt-10 text-slate-600">No gallery photos uploaded yet.</p> :
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map(photo => (
            <article key={photo._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <PrivatePhoto id={photo._id} alt={photo.caption} />
              <div className="space-y-3 p-4">
                <p className="font-semibold text-slate-800">{photo.caption}</p>
                <p className={`text-xs font-bold ${photo.published ? 'text-green-700' : 'text-amber-700'}`}>{photo.published ? 'Published' : 'Private draft'}</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <button disabled={busy} type="button" onClick={() => setPublished(photo)} className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white disabled:opacity-50">{photo.published ? 'Unpublish' : 'Publish'}</button>
                  <button disabled={busy} type="button" onClick={() => editCaption(photo)} className="rounded-lg border px-3 py-2 disabled:opacity-50">Edit</button>
                  <button disabled={busy} type="button" onClick={() => remove(photo)} className="rounded-lg border border-red-300 px-3 py-2 text-red-700 disabled:opacity-50">Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>}
    </div>
  );
}
