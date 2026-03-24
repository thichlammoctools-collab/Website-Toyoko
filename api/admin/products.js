// api/admin/products.js
// GET    /api/admin/products           → list all products
// POST   /api/admin/products  {action:"save",   data:{...}}  → create or update
// POST   /api/admin/products  {action:"delete", slug:"..."}  → delete
//
// All writes also refresh _data/products.json (the flat index used by the frontend)

const { verifyAuth } = require('./_auth');
const { getFile, putFile, deleteFile, listDir } = require('./_github');

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sortProducts(products) {
  products.sort((a, b) => Number(a.id) - Number(b.id));
  return products;
}

function normalizeCategoryName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

async function readProductsFromFiles() {
  const files = await listDir('_data/products');
  const jsonFiles = files.filter(f => f.name.endsWith('.json'));
  const loaded = await Promise.all(
    jsonFiles.map(async (f) => {
      const result = await getFile(f.path);
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

async function readProductsIndex() {
  const indexFile = await getFile('_data/products.json');
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

async function readProductsFast() {
  const fromIndex = await readProductsIndex();
  if (fromIndex.products) return fromIndex.products;
  return readProductsFromFiles();
}

async function writeProductsIndex(products, existingSha) {
  const sorted = sortProducts([...(products || [])]);
  const indexContent = JSON.stringify({ data: sorted }, null, 2);
  await putFile(
    '_data/products.json',
    indexContent,
    'admin: update products.json index',
    existingSha
  );
}

// Rebuild the flat products.json index from individual files
async function rebuildIndex() {
  const products = await readProductsFromFiles();
  const indexFile = await getFile('_data/products.json');
  await writeProductsIndex(products, indexFile ? indexFile.sha : undefined);
}

async function upsertProductInIndex(product) {
  const { products: indexProducts, sha } = await readProductsIndex();
  const products = indexProducts || await readProductsFromFiles();
  const idx = products.findIndex(p => p.slug === product.slug);
  if (idx >= 0) products[idx] = product;
  else products.push(product);
  await writeProductsIndex(products, sha || undefined);
}

async function removeProductFromIndex(slug) {
  const { products: indexProducts, sha } = await readProductsIndex();
  const products = indexProducts || await readProductsFromFiles();
  const filtered = products.filter(p => p.slug !== slug);
  await writeProductsIndex(filtered, sha || undefined);
}

async function replaceCategoryForProducts(oldCategory, newCategory) {
  const oldNorm = normalizeCategoryName(oldCategory).toLowerCase();
  const newNorm = normalizeCategoryName(newCategory);
  if (!oldNorm || !newNorm) return { updated: 0 };

  const { products: indexProducts, sha } = await readProductsIndex();
  const products = indexProducts || await readProductsFromFiles();
  const affected = products.filter(
    p => normalizeCategoryName(p.category).toLowerCase() === oldNorm
  );

  for (const product of affected) {
    const filePath = `_data/products/${product.slug}.json`;
    const existing = await getFile(filePath);
    const updated = { ...product, category: newNorm };
    await putFile(
      filePath,
      JSON.stringify(updated, null, 2),
      `admin: update category for ${product.slug}`,
      existing ? existing.sha : undefined
    );
  }

  const merged = products.map(p =>
    normalizeCategoryName(p.category).toLowerCase() === oldNorm
      ? { ...p, category: newNorm }
      : p
  );
  await writeProductsIndex(merged, sha || undefined);
  return { updated: affected.length };
}

module.exports = async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Auth check
  try { verifyAuth(req); } catch {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // ── GET: list ────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const products = await readProductsFast();
      return res.status(200).json({ ok: true, data: products });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ── POST: save or delete ─────────────────────────────────────
  if (req.method === 'POST') {
    let body = {};
    try {
      body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}');
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }

    const { action } = body;

    // ── DELETE ──
    if (action === 'delete') {
      const { slug } = body;
      if (!slug) return res.status(400).json({ ok: false, error: 'slug required' });
      const filePath = `_data/products/${slug}.json`;
      try {
        const existing = await getFile(filePath);
        if (!existing) return res.status(404).json({ ok: false, error: 'Product not found' });
        await deleteFile(filePath, existing.sha, `admin: delete product ${slug}`);
        await removeProductFromIndex(slug);
        return res.status(200).json({ ok: true });
      } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }
    }

    // ── SAVE (create / update) ──
    if (action === 'save') {
      const data = body.data;
      if (!data || !data.slug) return res.status(400).json({ ok: false, error: 'data.slug required' });

      // Sanitize slug: lowercase, no dots, no slashes
      const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
      data.slug = slug;

      const filePath = `_data/products/${slug}.json`;
      try {
        const existing = await getFile(filePath);
        // If new product and no id, generate one based on timestamp
        if (!data.id) data.id = String(Date.now());

        await putFile(
          filePath,
          JSON.stringify(data, null, 2),
          `admin: ${existing ? 'update' : 'create'} product ${slug}`,
          existing ? existing.sha : undefined
        );
        await upsertProductInIndex(data);
        return res.status(200).json({ ok: true, data });
      } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }
    }

    // ── BULK CATEGORY REPLACE ──
    if (action === 'bulk-category-replace') {
      const { oldCategory, newCategory } = body;
      if (!oldCategory || !newCategory) {
        return res.status(400).json({ ok: false, error: 'oldCategory and newCategory required' });
      }

      try {
        const result = await replaceCategoryForProducts(oldCategory, newCategory);
        return res.status(200).json({ ok: true, ...result });
      } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }
    }

    return res.status(400).json({ ok: false, error: `Unknown action: ${action}` });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
};
