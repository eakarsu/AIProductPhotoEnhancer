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

// AI-specific rate limiter: 20 requests per hour per user/IP
const aiRateLimitStore = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of aiRateLimitStore.entries()) {
    if (now - data.windowStart > 60 * 60 * 1000) aiRateLimitStore.delete(key);
  }
}, 30 * 60 * 1000);

export function aiRateLimiter(req, res, next) {
  const userId = req.user?.id || req.ip;
  const key = `ai:${userId}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const maxRequests = 20;

  let record = aiRateLimitStore.get(key);
  if (!record || now - record.windowStart > windowMs) {
    record = { count: 0, windowStart: now };
    aiRateLimitStore.set(key, record);
  }
  record.count++;

  res.set('X-RateLimit-Limit', String(maxRequests));
  res.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - record.count)));

  if (record.count > maxRequests) {
    return res.status(429).json({ error: 'AI rate limit exceeded. Max 20 requests per hour.' });
  }
  next();
}
