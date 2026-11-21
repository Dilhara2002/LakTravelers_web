import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaCar, FaIdCard, FaMapMarkedAlt } from 'react-icons/fa';
import API, { downloadPartnerDocument } from '../services/partnerApi';
import { partnerCategories, editableStatuses, documentLabel, isPhoto, MAX_FILE_SIZE } from '../../../shared/partnerFields.mjs';
import '../styles/partners.css';

const icons = { guide: FaMapMarkedAlt, driver: FaIdCard, vehicle: FaCar };
const privacy = 'I consent to LakTravelers storing my identity and licence documents privately for partner verification and contacting me about my application.';
function Field({ field, value, onChange }) {
  const props = { id: `partner-${field.key}`, name: field.key, value: value || '', onChange: e => onChange(e.target.value), maxLength: field.type === 'textarea' ? 2000 : 300 };
  return <label htmlFor={props.id}>{field.label}
    {field.options ? <select {...props}><option value="">Select…</option>{field.options.map(value => <option key={value}>{value}</option>)}</select>
      : field.type === 'textarea' ? <textarea {...props} rows={3} />
        : <input {...props} type={field.type} min={field.key === 'year' ? 1950 : field.key === 'seats' ? 1 : 0} step={field.type === 'number' ? 1 : undefined} />}
  </label>;
}
function AccountForm({ run, busy, onLogin, onRegistered, loginView }) {
  // LT_SIGNUP_ONLY_V1: keep registration and existing-partner login separate.
  const [mode, setMode] = useState(loginView ? 'login' : 'register');
  useEffect(() => { setMode(loginView ? 'login' : 'register'); }, [loginView]);
  const [values, setValues] = useState({ name: '', email: '', password: '', token: '', consent: false });
  const set = (key, value) => setValues(old => ({ ...old, [key]: value }));
  const submit = e => { e.preventDefault(); run(async () => {
    const { data } = await API.post(`/auth/${mode}`, values);
    setValues(old => ({ ...old, password: '', token: '' }));
    if (mode === 'login') onLogin(data);
    else if (mode === 'register') onRegistered();
    else if (mode === 'reset') setMode('login');
    else if (mode === 'forgot') setMode('reset');
    return data.message || 'Logged in.';
  }); };
  return <section className="partner-card partner-account">
    <h1>Join the LakTravelers Partner Network</h1><p>Customer enquiries stay on WhatsApp — no customer account needed.</p>
    {loginView && <div className="partner-actions" aria-label="Existing partner account options">{[['login', 'Login'], ['forgot', 'Forgot password'], ['reset', 'Enter reset code']].map(([key, label]) => <button type="button" className="secondary" aria-pressed={mode === key} disabled={busy} key={key} onClick={() => setMode(key)}>{label}</button>)}</div>}
    <form onSubmit={submit}>
      <h2>{ { login: 'Welcome back', register: 'Create your account', forgot: 'Request a reset code', reset: 'Reset your password' }[mode]}</h2>
      {mode === 'register' && <label>Name<input required autoComplete="name" maxLength={150} value={values.name} onChange={e => set('name', e.target.value)} /></label>}
      <label>Email<input required type="email" autoComplete="email" maxLength={254} value={values.email} onChange={e => set('email', e.target.value)} /></label>
      {mode !== 'forgot' && <label>Password<input required type="password" minLength={mode === 'login' ? 1 : 12} maxLength={72} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={values.password} onChange={e => set('password', e.target.value)} /><small>New passwords: at least 12 characters (maximum 72 bytes).</small></label>}
      {mode === 'reset' && <label>Email reset code<input required autoComplete="one-time-code" value={values.token} onChange={e => set('token', e.target.value.trim())} /></label>}
      {['register', 'login'].includes(mode) && <label className="partner-check"><input type="checkbox" required={mode === 'register'} checked={values.consent} onChange={e => set('consent', e.target.checked)} /><span>{privacy} <Link to="/privacy">Privacy policy</Link>. Required when first joining.</span></label>}
      <button disabled={busy}>{busy ? 'Please wait…' : { register: 'Create Partner Account', login: 'Sign In', forgot: 'Send Reset Code', reset: 'Reset Password' }[mode]}</button>
    </form>
    <p className="lt-partner-auth-switch">{loginView ? <>New partner? <Link to="/partners/dashboard">Create an account</Link></> : <>Already registered? <Link to="/partners/dashboard?auth=login">Partner login</Link></>}</p>
  </section>;
}
function ApplicationEditor({ application, setApplication, run, busy, refresh }) {
  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const spec = partnerCategories[application.category];
  const editable = editableStatuses.includes(application.status);
  const save = async () => {
    const { data } = await API.put(`/applications/${application._id}`, { details: application.details, version: application.__v });
    setApplication(data); await refresh(); return data;
  };
  const upload = (slot, file, input) => run(async () => {
    if (!file || file.size > MAX_FILE_SIZE) throw new Error('Choose a file no larger than 5 MB.');
    const saved = await save();
    const form = new FormData(); form.append('version', String(saved.__v)); form.append('file', file);
    const { data } = await API.post(`/applications/${saved._id}/documents/${slot}`, form);
    setApplication(data); input.value = ''; await refresh(); return 'Document uploaded privately.';
  });
  return <section className="partner-card">
    <h2>{spec.label} application</h2><p className="partner-notice">{spec.requirement}</p>
    <p><strong>Status: {application.status}</strong> · Partner ID: <strong>{application.partnerId || "Pending ID"}</strong> · Reference: <small>{application._id}</small></p>
    {application.expiryDate && <p>Earliest licence/document expiry: {new Date(application.expiryDate).toLocaleDateString()}</p>}
    <ol className="partner-progress" aria-label="Application steps">{['Your details', 'Service details', 'Documents & submit'].map((label, i) => <li key={label}><button type="button" className="secondary" aria-current={step === i ? 'step' : undefined} disabled={busy} onClick={() => setStep(i)}>{i + 1}. {label}</button></li>)}</ol>
    {step < 2 && <fieldset disabled={!editable || busy} className="partner-fields">{(step === 0 ? spec.fields.slice(0, 6) : spec.fields.slice(6)).map(field => <Field key={field.key} field={field} value={application.details[field.key]} onChange={value => setApplication(old => ({ ...old, details: { ...old.details, [field.key]: value } }))} />)}</fieldset>}
    {step === 2 && <>
      <p>Photos: JPG, PNG or WebP. Identity/licence documents also accept PDF. Maximum 5 MB per file. Only you and authorized administrators can download documents.</p>
      <div className="partner-fields">{spec.documents.map(slot => <div className="partner-document" key={slot}>
        <label htmlFor={`upload-${slot}`}>{documentLabel(slot)} {application.documents[slot] ? '✓ Uploaded' : '(required)'}</label>
        {editable && <input id={`upload-${slot}`} type="file" disabled={busy} accept={isPhoto(slot) ? 'image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp,application/pdf'} onChange={e => { if (e.target.files[0]) upload(slot, e.target.files[0], e.target); }} />}
        {application.documents[slot] && <button type="button" className="secondary" disabled={busy} onClick={() => run(() => downloadPartnerDocument(API, `/applications/${application._id}/documents/${slot}`, `${slot}`))}>Download current file</button>}
      </div>)}</div>
      {editable && <label className="partner-check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>I confirm the details and documents are accurate. {privacy} Submission requires manual review and does not authorize self-drive rentals.</span></label>}
    </>}
    <div className="partner-actions">
      {step > 0 && <button className="secondary" disabled={busy} onClick={() => setStep(step - 1)}>Back</button>}
      {editable && <button className="secondary" disabled={busy} onClick={() => run(async () => { await save(); return 'Draft saved. You can resume later.'; })}>Save draft</button>}
      {step < 2 && <button disabled={busy} onClick={() => run(async () => { if (editable) await save(); setStep(step + 1); })}>Next</button>}
      {step === 2 && editable && <button disabled={busy || !consent} onClick={() => run(async () => {
        const saved = await save();
        const { data } = await API.post(`/applications/${saved._id}/submit`, { version: saved.__v, consent });
        setApplication(data.application); await refresh();
        return data.notification === 'sent' ? 'Application submitted. Email notification sent.' : 'Application submitted. Email delivery failed; your status is saved here.';
      })}>Submit for review</button>}
    </div>
    {!editable && <p>This application is locked during review. Approved/rejected/suspended details can only be reopened by an administrator. Contact <a href="mailto:laktravelers@gmail.com">laktravelers@gmail.com</a> for corrections.</p>}
    <details><summary>Application updates and correction requests</summary><ul className="partner-history">{[...application.history].reverse().map(event => <li key={event._id}><strong>{event.action}</strong> — {new Date(event.at).toLocaleString()}<p>{event.note}</p></li>)}</ul></details>
  </section>;
}
export default function Partners() {
  const location = useLocation(); const navigate = useNavigate();
  const [session, setSession] = useState(null); const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]); const [application, setApplication] = useState(null);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const landing = location.pathname === '/partners' || location.pathname === '/partners/';
  const selectedCategory = new URLSearchParams(location.search).get('category');
  const refresh = async () => { const { data } = await API.get('/applications'); setApplications(data); };
  useEffect(() => {
    let live = true;
    API.get('/auth/me').then(({ data }) => { if (live) setSession(data); }).catch(err => { if (live && err.response?.status !== 401) setError(err.message); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);
  useEffect(() => { if (session?.verified) refresh().catch(err => setError(err.message)); }, [session]);
  const run = async action => {
    setBusy(true); setError(''); setMessage('');
    try { const result = await action(); if (typeof result === 'string') setMessage(result); }
    catch (err) { setError(err.message); if (err.response?.status === 401) { setSession(null); setApplication(null); } }
    finally { setBusy(false); }
  };
  const start = kind => run(async () => { const { data } = await API.post('/applications', { category: kind }); setApplication(data); await refresh(); });
  return <div className="partner-page">
    {error && <p role="alert" className="partner-error">{error}</p>}{message && <p role="status" className="partner-success">{message}</p>}
    {landing ? <>
      <header className="partner-hero"><span>LAKTRAVELERS PARTNERS</span><h1 className="lt-partner-hero-title">Share your expertise.<br />Welcome the world.</h1><p>Join as a licensed guide, tourist driver or vehicle provider. Choose your category and review the requirements before creating an account.</p><Link className="partner-button" to={session ? "/partners/dashboard" : "/partners/dashboard?auth=login"}>{session ? 'Open partner dashboard' : 'Partner login'}</Link></header>
      <div className="partner-category-grid">{Object.entries(partnerCategories).map(([kind, spec]) => { const Icon = icons[kind]; return <section key={kind} className="partner-card"><Icon size={30} aria-hidden="true" /><h2>{spec.label}</h2><p className="partner-notice">{spec.requirement}</p><p>Identity checks and manual approval are mandatory. Save your application and return whenever you are ready.</p><Link className="partner-button" to={`/partners/dashboard?category=${kind}`}>Join as {spec.label}</Link></section>; })}</div>
      <p>Questions? <a href="mailto:laktravelers@gmail.com">laktravelers@gmail.com</a> · <a href="https://wa.me/94762898945">+94 76 289 8945</a></p>
    </> : loading ? <p role="status">Checking your session…</p> : !session ? <><p className="partner-notice">{partnerCategories[selectedCategory]?.requirement || 'Guides need a valid SLTDA licence. Drivers need a valid Tourist Driver ID and driving licence. Vehicle owners need valid vehicle documents.'}</p><AccountForm run={run} busy={busy} onLogin={data => { setSession(data); navigate('/', { replace: true }); }} onRegistered={() => navigate('/partners/dashboard?auth=login', { replace: true })} loginView={new URLSearchParams(location.search).get('auth') === 'login'} /></> : <>
      <header className="partner-dashboard-header"><div><h1>Partner dashboard</h1><p>{session.user.name} · {session.user.email}</p></div><button className="secondary" disabled={busy} onClick={() => run(async () => { await API.post('/auth/logout'); setSession(null); setApplications([]); setApplication(null); return 'Logged out.'; })}>Log out</button></header>
      {!session.verified ? <section className="partner-card"><h2>Verify your email</h2><p>Paste the verification code from your email. Codes expire after 30 minutes.</p><form onSubmit={e => { e.preventDefault(); run(async () => { await API.post('/auth/verify', { token: token.trim() }); const { data } = await API.get('/auth/me'); setSession(data); setToken(''); return 'Email verified. Choose a category to begin.'; }); }}><label>Verification code<input required autoComplete="one-time-code" value={token} onChange={e => setToken(e.target.value)} /></label><div className="partner-actions"><button disabled={busy}>Verify email</button><button type="button" className="secondary" disabled={busy} onClick={() => run(async () => (await API.post('/auth/send-verification')).data.message)}>Resend code</button></div></form></section> : <>
        <section className="partner-card"><h2>Your applications</h2><p>One account supports multiple categories and vehicles. Save a draft before switching applications.</p><div className="partner-actions">{Object.entries(partnerCategories).map(([kind, spec]) => <button key={kind} disabled={busy} className={selectedCategory === kind ? '' : 'secondary'} onClick={() => start(kind)}>Add {spec.label}</button>)}</div>
          {!applications.length && <p>No applications yet. Select a category above.</p>}
          <ul className="partner-application-list">{applications.map(item => <li key={item._id}><button className="secondary" disabled={busy} onClick={() => setApplication(item)}>{partnerCategories[item.category].label} {item.partnerId || "Pending ID"} {item.details.registrationNumber || ''} — {item.status}</button></li>)}</ul>
          <button className="secondary" disabled={busy} onClick={() => run(async () => { await refresh(); setApplication(null); return 'Latest application statuses loaded.'; })}>Refresh statuses</button>
        </section>
        {application && <ApplicationEditor key={application._id} application={application} setApplication={setApplication} run={run} busy={busy} refresh={refresh} />}
      </>}
    </>}
  </div>;
}
