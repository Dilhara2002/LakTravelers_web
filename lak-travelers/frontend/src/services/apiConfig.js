export function resolveApiURL(configured, hostname) {
  const value = configured?.trim();
  if (value) {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Invalid VITE_API_URL');
    const base = url.href.replace(/\/+$/, '');
    return base.endsWith('/api') ? base : `${base}/api`;
  }
  return ['localhost', '127.0.0.1', '[::1]'].includes(hostname)
    ? 'http://localhost:5001/api' : 'https://laktravelers-api.onrender.com/api';
}
