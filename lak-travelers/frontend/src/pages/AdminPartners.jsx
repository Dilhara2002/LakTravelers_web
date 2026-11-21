import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { downloadPartnerDocument } from '../services/partnerApi';
import { partnerCategories, statuses, documentLabel } from '../../../shared/partnerFields.mjs';
import '../styles/partners.css';
const config = { headers: { 'X-Requested-With': 'LakTravelersPartner' } };
const transitions = { Submitted: ['Under Review', 'Changes Requested', 'Rejected'], 'Under Review': ['Approved', 'Changes Requested', 'Rejected'], Approved: ['Suspended', 'Changes Requested'], Suspended: ['Under Review', 'Changes Requested', 'Rejected'], Rejected: ['Changes Requested'] };
export default function AdminPartners() {
  const [filters, setFilters] = useState({ search: '', status: '', category: '', expiring: false });
  const [result, setResult] = useState({ applications: [], total: 0, page: 1 });
  const [selected, setSelected] = useState(null); const [status, setStatus] = useState('');
  const [note, setNote] = useState(''); const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const load = async (page = 1, values = filters) => { const { data } = await API.get('/partners/admin/applications', { params: { ...values, expiring: String(values.expiring), page } }); setResult(data); };
  useEffect(() => { API.get('/partners/admin/applications').then(({ data }) => setResult(data)).catch(err => setError(err.message)); }, []);
  const run = async action => { setBusy(true); setError(''); setMessage(''); try { await action(); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const open = async id => { const { data } = await API.get(`/partners/admin/applications/${id}`); setSelected(data); setStatus(''); setNote(''); setVerified(false); };
  return <div className="partner-page">
    <Link to="/dashboard">← Admin dashboard</Link><h1>Partner Management</h1>
    <p>Review documents privately. Verify licences with the issuing authority before approval. No application grants self-drive authorization.</p>
    {error && <p role="alert" className="partner-error">{error}</p>}{message && <p role="status" className="partner-success">{message}</p>}
    <form className="partner-card" onSubmit={e => { e.preventDefault(); run(() => load()); }}>
      <div className="partner-fields">
        <label>Search name, email or vehicle registration<input maxLength={100} value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} /></label>
        <label>Category<select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option>{Object.entries(partnerCategories).map(([key, spec]) => <option key={key} value={key}>{spec.label}</option>)}</select></label>
        <label>Status<select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{statuses.map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="partner-check"><input type="checkbox" checked={filters.expiring} onChange={e => setFilters({ ...filters, expiring: e.target.checked })} />Expired or expiring within 30 days</label>
      </div>
      <div className="partner-actions"><button disabled={busy}>Filter</button><button type="button" className="secondary" disabled={busy} onClick={() => run(async () => { const next = { search: '', category: '', status: 'Approved', expiring: false }; setFilters(next); await load(1, next); })}>Approved partner directory</button></div>
    </form>
    <section className="partner-card"><h2>Applications ({result.total})</h2><ul className="partner-application-list">{result.applications.map(item => <li key={item._id}><button className="secondary" disabled={busy} onClick={() => run(() => open(item._id))}>{item.details.name || 'Draft'} · {partnerCategories[item.category].label} · {item.status}{item.expiryDate ? ` · Expires ${new Date(item.expiryDate).toLocaleDateString()}` : ''}</button></li>)}</ul>
      {!result.applications.length && <p>No matching applications.</p>}
      <div className="partner-actions"><button className="secondary" disabled={busy || result.page <= 1} onClick={() => run(() => load(result.page - 1))}>Previous</button><span>Page {result.page}</span><button className="secondary" disabled={busy || result.page * 25 >= result.total} onClick={() => run(() => load(result.page + 1))}>Next</button></div>
    </section>
    {selected && <section className="partner-card"><h2>{partnerCategories[selected.category].label} — {selected.status}</h2><p>Reference: {selected._id}</p>
      <dl className="partner-fields">{partnerCategories[selected.category].fields.map(field => <div key={field.key}><dt>{field.label}</dt><dd>{selected.details[field.key] || 'Not provided'}</dd></div>)}</dl>
      <h2>Private documents</h2><div className="partner-actions">{Object.keys(selected.documents).map(slot => <button key={slot} className="secondary" disabled={busy} onClick={() => run(async () => { await downloadPartnerDocument(API, `/partners/admin/applications/${selected._id}/documents/${slot}`, slot); await open(selected._id); })}>{documentLabel(slot)}</button>)}</div>
      <p>Downloaded documents contain sensitive personal information. Review securely and remove local copies when no longer needed.</p>
      {selected.licenceVerifiedAt && <p>Last manual verification: {new Date(selected.licenceVerifiedAt).toLocaleString()} by {selected.licenceVerifiedBy}</p>}
      {!!transitions[selected.status]?.length && <form onSubmit={e => { e.preventDefault(); run(async () => {
        const { data } = await API.post(`/partners/admin/applications/${selected._id}/decision`, { version: selected.__v, status, note, licencesVerified: verified }, config);
        setMessage(data.notification === 'sent' ? 'Decision saved and email sent.' : 'Decision saved. Email failed; retry from audit history.');
        await open(selected._id); await load(result.page);
      }); }}>
        <label>Decision<select required value={status} onChange={e => setStatus(e.target.value)}><option value="">Select action…</option>{transitions[selected.status].map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Reason / correction instructions (visible to partner)<textarea required minLength={3} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} /></label>
        {status === 'Approved' && <label className="partner-check"><input required type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} /><span>I manually checked identity, document validity and licences with the issuing authorities. I recorded verification evidence in the note. This does not authorize self-drive rentals.</span></label>}
        <button disabled={busy || !status}>Save decision</button>
      </form>}
      <h2 className="mt-6">Audit history</h2><ul className="partner-history">{[...selected.history].reverse().map(event => <li key={event._id}><strong>{event.action}</strong> · {new Date(event.at).toLocaleString()} · Actor: {event.actor}<p>{event.note}</p><span>Email: {event.notification}</span>{['failed', 'pending'].includes(event.notification) && <button className="secondary" disabled={busy} onClick={() => run(async () => { const { data } = await API.post(`/partners/admin/applications/${selected._id}/notifications/${event._id}/retry`, {}, config); setMessage(`Email delivery: ${data.notification}`); await open(selected._id); })}>Retry email</button>}</li>)}</ul>
    </section>}
  </div>;
}
