// Minimal in-memory fixed-window rate limiter (single process, so no shared store is needed).
// key(req) picks who is limited: the client IP for public routes, the user id after auth.
export function rateLimit({ windowMs, max, key = (req) => req.ip, message = 'Za dużo zapytań, spróbuj później.' }) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, windowMs).unref();
  return (req, res, next) => {
    const k = key(req);
    const now = Date.now();
    const entry = hits.get(k);
    if (!entry || entry.reset <= now) hits.set(k, { count: 1, reset: now + windowMs });
    else if (++entry.count > max) {
      res.set('Retry-After', Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
