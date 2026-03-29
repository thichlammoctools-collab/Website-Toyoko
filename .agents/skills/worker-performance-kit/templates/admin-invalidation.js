// admin-invalidation.js
// Template for ensuring edge and in-memory cache consistency

/**
 * Invalidate cache for a specific API route
 * @param {string} path - The relative path of the API
 * @param {Request} request 
 */
async function invalidateCache(path, request) {
  const cache = caches.default;
  const url = new URL(request.url);
  const target = new URL(`/api/${path}`, url.origin).toString();
  await cache.delete(new Request(target));
  
  // Also clear in-memory cache if using one
  if (typeof MEM_CACHE !== 'undefined') {
    MEM_CACHE.delete(path);
  }
}

/**
 * Example usage in an admin POST handler
 */
/*
if (pathname === '/api/admin/products' && request.method === 'POST') {
  // 1. Perform write operation
  await env.DATABASE.put('products', JSON.stringify(data));
  
  // 2. Schedule invalidation
  ctx.waitUntil(invalidateCache('products', request));
  
  // 3. Return response with no-store
  return json({ ok: true }, 200, { 'Cache-Control': 'no-store' });
}
*/

export { invalidateCache };
