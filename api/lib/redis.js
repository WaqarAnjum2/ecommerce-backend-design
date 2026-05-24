// Upstash Redis HTTP REST client — stateless, safe for serverless
import '../config/env.js';
import { Redis } from '@upstash/redis';

let redis;

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (url && token && !url.includes('[') && !token.includes('[')) {
  redis = new Redis({ url, token });
} else {
  redis = {
    get: async () => null,
    set: async () => null,
    del: async () => null,
    scan: async () => [0, []],
  };
  console.log('⚠️  Upstash Redis credentials are not configured. Caching is disabled.');
}

export default redis;
