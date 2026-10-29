import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function GoogleSignIn() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let active = true;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    if (clientId) API.get('/users/google/config', { timeout: 15000 }).then(({ data }) => {
      if (active) setAvailable(data.enabled && data.clientId === clientId);
    }).catch(() => { /* Keep email authentication available when Google is unconfigured. */ });
    return () => { active = false; };
  }, []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [linkRequired, setLinkRequired] = useState(false);
  const [password, setPassword] = useState('');
  const credential = useRef(null);
  const inFlight = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const requested = location.state?.from ? `${location.state.from.pathname}${location.state.from.search || ''}` : new URLSearchParams(location.search).get('returnTo');
  const destination = requested?.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\') ? requested : '/';
  async function signIn(token, linkPassword) {
    if (inFlight.current) return;
    if (!token) { setMessage('Google sign-in was not completed. Please choose your account again.'); return; }
    inFlight.current = true; setBusy(true); setMessage('');
    try {
      const { data } = await API.post('/users/google', { token, ...(linkPassword ? { password: linkPassword } : {}) }, { timeout: 20000 });
      credential.current = null; setPassword('');
      localStorage.setItem('userInfo', JSON.stringify(data));
      window.dispatchEvent(new Event('storage'));
      navigate(destination, { replace: true });
    } catch (error) {
      if (error.response?.data?.code === 'GOOGLE_LINK_REQUIRED') {
        credential.current = token; setLinkRequired(true);
        setMessage('Confirm your existing LakTravelers password to link your Google account.');
      } else {
        credential.current = null; setLinkRequired(false); setPassword('');
        const messages = { 400: 'Please choose your Google account again.', 401: 'Your Google sign-in expired or could not be verified. Please try again.',
          403: 'This account is unavailable or awaiting approval. Please contact us.', 409: 'This account may already be linked. Try your original sign-in method.',
          429: 'Too many attempts. Please wait a few minutes.', 503: 'Google sign-in is temporarily unavailable. Use email and password or try again later.' };
        setMessage(error.response ? messages[error.response.status] || 'Sign-in could not be completed. Please try again.' : 'Cannot reach the sign-in service. Check your connection and try again.');
      }
    } finally { inFlight.current = false; setBusy(false); }
  }
  if (!available) return null;
  return <div className="mt-6 space-y-3 text-center" aria-busy={busy}>
    <p className="text-sm text-slate-500">Or continue with</p>
    <div className="flex justify-center" inert={busy}>
      <GoogleLogin text="continue_with" shape="pill" size="large" theme="outline" ux_mode="popup"
        onSuccess={({ credential: token }) => signIn(token)}
        onError={() => setMessage('Google sign-in was cancelled or could not open. Please try again and allow the popup.')} />
    </div>
    {busy && <p role="status" className="text-sm text-blue-700">Signing in securely…</p>}
    {message && <p role="alert" className="text-sm text-slate-700">{message}</p>}
    {linkRequired && <div className="space-y-3 text-left">
      <label className="block text-sm font-semibold text-slate-700">Existing account password
        <input type="password" autoComplete="current-password" maxLength={1024} value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" />
      </label>
      <button type="button" disabled={busy || !password} onClick={() => signIn(credential.current, password)} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-50">Link and sign in</button>
    </div>}
    <p className="text-xs text-slate-500">Closed the Google window? Choose Continue with Google to try again.</p>
  </div>;
}
