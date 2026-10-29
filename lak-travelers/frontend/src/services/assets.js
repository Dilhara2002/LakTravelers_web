const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const apiOrigin = configuredApiUrl
  ? configuredApiUrl.replace(/\/api\/?$/, '')
  : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001'
    : '';

export const resolveAssetUrl = (value, fallback = '') => {
  const path = typeof value === 'object' ? value?.image : value;
  if (!path || typeof path !== 'string') return fallback;
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiOrigin}${normalizedPath}`;
};
