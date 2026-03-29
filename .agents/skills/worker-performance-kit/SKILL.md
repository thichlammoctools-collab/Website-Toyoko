---
name: Cloudflare Worker Performance Kit
description: Documentation and patterns for implementing multi-layer caching, cache invalidation, and parallel fetching in Cloudflare Workers and Frontend JS.
---

# Cloudflare Worker Performance Kit

This skill provides a comprehensive approach to optimizing Cloudflare Workers and web applications for high performance. It covers caching at the Worker memory level, the Cloudflare Edge, and frontend parallelization.

## Core Principles

1.  **Cache Public, Invalidate Private**: Public GET requests should be cached at the edge. Private or admin actions must trigger targeted cache invalidation.
2.  **Memory > Network**: Accessing module-level variables is orders of magnitude faster than querying Cloudflare KV or durable objects.
3.  **Parallel > Sequential**: Fetching multiple resources simultaneously (using `Promise.all`) reduces the overall wait time for the user.

## Implementation Guide

### 1. Multi-Layer Caching (Worker)
- **In-Memory Cache**: Use a simple `Map` in the module scope to store KV results for short durations (e.g., 30s).
- **Edge Cache**: Use the `caches.default` API to store full Response objects at the Cloudflare Edge.

### 2. Cache Invalidation
- When a `POST`, `PUT`, or `DELETE` request is successful, use `cache.delete()` on the specific API URLs that were modified.
- Clear corresponding in-memory cache entries.

### 3. Frontend Parallelization
- Instead of:
  ```javascript
  const site = await fetchSite();
  const products = await fetchProducts();
  ```
- Use:
  ```javascript
  const [site, products] = await Promise.all([fetchSite(), fetchProducts()]);
  ```

### 4. Cache-Control Header Strategy
- **Static Assets** (JS, CSS, Images): `public, max-age=86400, s-maxage=31536000, immutable`
- **Public API Data**: `public, max-age=15, s-maxage=60, stale-while-revalidate=120`
- **Sensitive/Admin Data**: `no-store`

## Examples
See the `templates/` directory for ready-to-use boilerplate.
