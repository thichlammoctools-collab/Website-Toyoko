// functions/api/admin/products.js
import { verifyAuth } from './_auth.js';
import { getFile, putFile, deleteFile, listDir } from './_github.js';

function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCORSHeaders(), 'Content-Type': 'application/json' },
  });
}

function sortProducts(products) {
  products.sort((a, b) => Number(a.id) - Number(b.id));
  return products;
}

function normalizeCategoryName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

async function readProductsFromFiles(env) {
  const files = await listDir('_data/products', env);
  const jsonFiles = files.filter(f => f.name.endsWith('.json'));
  const loaded = await Promise.all(
    jsonFiles.map(async (f) => {
      const result = await getFile(f.path, env);
      if (!result) return null;
      try {
        return JSON.parse(result.content);
      } catch {
        return null;
      }
    })
  );
  return sortProducts(loaded.filter(Boolean));
}

async function readProductsIndex(env) {
  const indexFile = await getFile('_data/products.json', env);
  if (!indexFile) return { products: null, sha: null };

  try {
    const parsed = JSON.parse(indexFile.content);
    const products = Array.isArray(parsed)
      ? parsed
      : (Array.isArray(parsed.data) ? parsed.data : null);
    if (!products) return { products: null, sha: indexFile.sha };
    return { products: sortProducts(products), sha: indexFile.sha };
  } catch {
    return { products: null, sha: indexFile.sha };
  }
}

async function readProductsFast(env) {
  const fromIndex = await readProductsIndex(env);
  if (fromIndex.products) return fromIndex.products;
  return readProductsFromFiles(env);
}

async function writeProductsIndex(products, existingSha, env) {
  const sorted = sortProducts([...(products || [])]);
  const indexContent = JSON.stringify({ data: sorted }, null, 2);
  await putFile(
    '_data/products.json',
    indexContent,
    'admin: update products.json index',
    existingSha,
    false,
    env
  );
}

async function upsertProductInIndex(product, env) {
  const { products: indexProducts, sha } = await readProductsIndex(env);
  const products = indexProducts || await readProductsFromFiles(env);
  const idx = products.findIndex(p => p.slug === product.slug);
  if (idx >= 0) products[idx] = product;
  else products.push(product);
  await writeProductsIndex(products, sha || undefined, env);
}

async function removeProductFromIndex(slug, env) {
  const { products: indexProducts, sha } = await readProductsIndex(env);
  const products = indexProducts || await readProductsFromFiles(env);
  const filtered = products.filter(p => p.slug !== slug);
  await writeProductsIndex(filtered, sha || undefined, env);
}

async function replaceCategoryForProducts(oldCategory, newCategory, env) {
  const oldNorm = normalizeCategoryName(oldCategory).toLowerCase();
  const newNorm = normalizeCategoryName(newCategory);
  if (!oldNorm || !newNorm) return { updated: 0 };

  const { products: indexProducts, sha } = await readProductsIndex(env);
  const products = indexProducts || await readProductsFromFiles(env);
  const affected = products.filter(
    p => normalizeCategoryName(p.category).toLowerCase() === oldNorm
  );

  for (const product of affected) {
    const filePath = `_data/products/${product.slug}.json`;
    const existing = await getFile(filePath, env);
    const updated = { ...product, category: newNorm };
    await putFile(
      filePath,
      JSON.stringify(updated, null, 2),
      `admin: update category for ${product.slug}`,
      existing ? existing.sha : undefined,
      false,
      env
    );
  }

  const merged = products.map(p =>
    normalizeCategoryName(p.category).toLowerCase() === oldNorm
      ? { ...p, category: newNorm }
      : p
  );
  await writeProductsIndex(merged, sha || undefined, env);
  return { updated: affected.length };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: getCORSHeaders() });
  }

  try {
    await verifyAuth(request, env);
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  if (request.method === 'GET') {
    try {
      const products = await readProductsFast(env);
      return jsonResponse({ ok: true, data: products });
    } catch (err) {
      return jsonResponse({ ok: false, error: err.message }, 500);
    }
  }

  if (request.method === 'POST') {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
    }

    const { action } = body;

    if (action === 'delete') {
      const { slug } = body;
      if (!slug) return jsonResponse({ ok: false, error: 'slug required' }, 400);
      const filePath = `_data/products/${slug}.json`;
      try {
        const existing = await getFile(filePath, env);
        if (!existing) return jsonResponse({ ok: false, error: 'Product not found' }, 404);
        await deleteFile(filePath, existing.sha, `admin: delete product ${slug}`, env);
        await removeProductFromIndex(slug, env);
        return jsonResponse({ ok: true });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message }, 500);
      }
    }

    if (action === 'save') {
      const data = body.data;
      if (!data || !data.slug) return jsonResponse({ ok: false, error: 'data.slug required' }, 400);

      const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
      data.slug = slug;

      const filePath = `_data/products/${slug}.json`;
      try {
        const existing = await getFile(filePath, env);
        if (!data.id) data.id = String(Date.now());

        await putFile(
          filePath,
          JSON.stringify(data, null, 2),
          `admin: ${existing ? 'update' : 'create'} product ${slug}`,
          existing ? existing.sha : undefined,
          false,
          env
        );
        await upsertProductInIndex(data, env);
        return jsonResponse({ ok: true, data });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message }, 500);
      }
    }

    if (action === 'bulk-category-replace') {
      const { oldCategory, newCategory } = body;
      if (!oldCategory || !newCategory) {
        return jsonResponse({ ok: false, error: 'oldCategory and newCategory required' }, 400);
      }

      try {
        const result = await replaceCategoryForProducts(oldCategory, newCategory, env);
        return jsonResponse({ ok: true, ...result });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message }, 500);
      }
    }

    return jsonResponse({ ok: false, error: `Unknown action: ${action}` }, 400);
  }

  return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
}
