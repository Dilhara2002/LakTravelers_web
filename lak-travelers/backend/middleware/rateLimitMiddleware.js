export const createRateLimiter = ({ windowMs, max, message }) => {
 const buckets = new Map();
 return (req, res, next) => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  const key = `${req.ip}:${req.baseUrl || req.path}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }
  current.count += 1;
  if (current.count > max) {
    res.set('Retry-After', String(Math.ceil((current.resetAt - now) / 1000)));
    return res.status(429).json({ success: false, message });
  }
  return next();
 };
};

export const apiLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 500, message: 'Too many requests.' });
export const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many authentication attempts.' });
export const aiLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 30, message: 'AI request limit reached.' });
export const uploadLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 50, message: 'Upload limit reached.' });
