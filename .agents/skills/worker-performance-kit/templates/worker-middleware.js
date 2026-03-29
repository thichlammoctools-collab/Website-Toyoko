// worker-middleware.js
// Pattern for implementing high-performance caching in Cloudflare Workers

const MEM_CACHE = new Map();
const MEM_TTL = 30000; // 30 seconds

/**
 * Get item from in-memory cache
 */
function memGet(key) {
  const e = MEM_CACHE.get(key);
  if (e && Date.now() - e.ts < MEM_TTL) return e.data;
  if (e) MEM_CACHE.delete(key);
  return null;
}

/**
 * Store item in in-memory cache
 */
function memSet(key, data) {
  MEM_CACHE.set(key, { data, ts: Date.now() });
}

/**
 * Wrapper for Cloudflare Edge Cache API
 * @param {Request} request 
 * @param {Response} response 
 * @param {ExecutionContext} ctx 
 */
async function storeInEdgeCache(request, response, ctx) {
  const cache = caches.default;
  ctx.waitUntil(cache.put(request, response.clone()));
}

/**
 * Common Cache-Control Headers
 */
const CACHE_HEADERS = {
  STATIC: 'public, max-age=86400, s-maxage=31536000, immutable',
  PUBLIC_API: 'public, max-age=15, s-maxage=60, stale-while-revalidate=120',
  NO_STORE: 'no-store, no-cache, must-revalidate, proxy-revalidate'
};

export { memGet, memSet, storeInEdgeCache, CACHE_HEADERS };
