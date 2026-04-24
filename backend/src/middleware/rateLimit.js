// Simple in-memory rate limiting middleware
const rateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > data.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' } = {}) {
  return (req, res, next) => {
    const key = req.ip + ':' + req.baseUrl;
    const now = Date.now();

    let record = rateLimitStore.get(key);
    if (!record || now - record.windowStart > windowMs) {
      record = { count: 0, windowStart: now, windowMs };
      rateLimitStore.set(key, record);
    }

    record.count++;

    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(Math.max(0, max - record.count)));
    res.set('X-RateLimit-Reset', String(Math.ceil((record.windowStart + windowMs) / 1000)));

    if (record.count > max) {
      return res.status(429).json({ error: message });
    }

    next();
  };
}

// Stricter rate limit for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again in 15 minutes.'
});

// General API rate limit
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, please slow down.'
});
