import redis from '../lib/redis.js';

const getClientId = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  return req.socket?.remoteAddress || 'unknown';
};

export const rateLimit = ({ keyPrefix, windowSeconds, max }) => {
  return async (req, res, next) => {
    if (!redis || typeof redis.incr !== 'function' || typeof redis.expire !== 'function') {
      return next();
    }

    const clientId = getClientId(req);
    const key = `${keyPrefix}:${clientId}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      const remaining = Math.max(max - current, 0);
      res.setHeader('X-RateLimit-Limit', String(max));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Reset', String(windowSeconds));

      if (current > max) {
        return res.status(429).json({ error: 'Too many requests, please try again later.' });
      }

      return next();
    } catch (err) {
      console.error('Rate limit error:', err);
      return next();
    }
  };
};
