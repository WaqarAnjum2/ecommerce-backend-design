import redis from '../lib/redis.js';

const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), ms)),
  ]);
};

// Cache-Control header for private routes
export function noCacheHeaders(req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (next) next();
}

// Middleware factory to check cache
export function cacheMiddleware(keyPrefix, ttlSeconds = 3600) {
  return async (req, res, next) => {
    // If redis is not configured, skip caching
    if (!redis || typeof redis.get !== 'function') {
      return next();
    }

    try {
      // Build unique cache key based on query params or path params
      let key = keyPrefix;
      if (req.params.id) {
        key = `${keyPrefix}:${req.params.id}`;
      } else if (Object.keys(req.query).length > 0) {
        // Sort query params for consistent keys
        const sortedQuery = Object.keys(req.query)
          .sort()
          .reduce((acc, k) => {
            acc[k] = req.query[k];
            return acc;
          }, {});
        const queryHash = Buffer.from(JSON.stringify(sortedQuery)).toString('base64');
        key = `${keyPrefix}:query:${queryHash}`;
      } else {
        key = `${keyPrefix}:default`;
      }

      // Store key and TTL on res object for storeInCache helper
      res.cacheKey = key;
      res.cacheTtl = ttlSeconds;

      // Try fetching from Redis
      const cachedData = await withTimeout(redis.get(key), 800);
      if (cachedData) {
        // Set Edge CDN header
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
        // If cachedData is string, parse it, otherwise return it directly
        const parsed = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        return res.json(parsed);
      }

      res.setHeader('X-Cache', 'MISS');
      next();
    } catch (err) {
      console.error('Cache middleware error:', err);
      next();
    }
  };
}

// Helper to store response in cache
export async function storeInCache(res, data) {
  if (res.cacheKey && redis && typeof redis.set === 'function') {
    try {
      // In serverless, store the stringified version
      await withTimeout(redis.set(res.cacheKey, JSON.stringify(data), {
        ex: res.cacheTtl || 3600
      }), 800);
    } catch (err) {
      console.error('Failed to store in cache:', err);
    }
  }
}

// Helper to invalidate cache keys by pattern/prefix
export async function invalidateCache(...patterns) {
  if (!redis || typeof redis.del !== 'function') return;

  try {
    for (const pattern of patterns) {
      // For Upstash Redis, let's scan for keys starting with the pattern or match exactly
      let cursor = '0';
      const keysToDelete = new Set();

      // Check if it's a simple exact key delete first
      keysToDelete.add(pattern);

      // Perform a scan to find matching keys (e.g. prefix match)
      if (typeof redis.scan === 'function') {
        try {
          do {
            const [nextCursor, keys] = await redis.scan(cursor, { match: `${pattern}*`, count: 100 });
            cursor = nextCursor;
            if (keys && keys.length > 0) {
              keys.forEach(k => keysToDelete.add(k));
            }
          } while (cursor !== '0' && cursor !== 0);
        } catch (scanErr) {
          console.error(`Scan failed for pattern ${pattern}:`, scanErr);
        }
      }

      const keysArray = Array.from(keysToDelete);
      if (keysArray.length > 0) {
        await redis.del(...keysArray);
        console.log(`Deleted keys: ${keysArray.join(', ')}`);
      }
    }
  } catch (err) {
    console.error('Failed to invalidate cache:', err);
  }
}
