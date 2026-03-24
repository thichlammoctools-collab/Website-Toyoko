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

// Rebuild the flat products.json index from individual files
async function rebuildIndex() {
  const files = await listDir('_data/products');
  const products = [];
  for (const f of files) {
    if (!f.name.endsWith('.json')) continue;
    const result = await getFile(f.path);
    if (result) {
      try { products.push(JSON.parse(result.content)); } catch { /* skip malformed */ }
    }
  }
  // Sort by numeric id
  products.sort((a, b) => Number(a.id) - Number(b.id));

  const indexFile = await getFile('_data/products.json');
  const indexContent = JSON.stringify({ data: products }, null, 2);
  await putFile(
    '_data/products.json',
    indexContent,
    'admin: rebuild products.json index',
    indexFile ? indexFile.sha : undefined
  );
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
      const files = await listDir('_data/products');
      const products = [];
      for (const f of files) {
        if (!f.name.endsWith('.json')) continue;
        const result = await getFile(f.path);
        if (result) {
          try { products.push(JSON.parse(result.content)); } catch { /* skip */ }
        }
      }
      products.sort((a, b) => Number(a.id) - Number(b.id));
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
        await rebuildIndex();
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
        await rebuildIndex();
        return res.status(200).json({ ok: true, data });
      } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
      }
    }

    return res.status(400).json({ ok: false, error: `Unknown action: ${action}` });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
};
