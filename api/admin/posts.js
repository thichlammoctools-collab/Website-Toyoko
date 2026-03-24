// api/admin/posts.js
// GET    /api/admin/posts              → list all posts
// POST   /api/admin/posts {action:"save",   data:{...}}  → create or update
// POST   /api/admin/posts {action:"delete", slug:"..."}  → delete
//
// All writes also refresh _data/posts.json (the flat index used by the frontend)

const { verifyAuth } = require('./_auth');
const { getFile, putFile, deleteFile, listDir } = require('./_github');

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function rebuildIndex() {
  const files = await listDir('_data/posts');
  const posts = [];
  for (const f of files) {
    if (!f.name.endsWith('.json')) continue;
    const result = await getFile(f.path);
    if (result) {
      try { posts.push(JSON.parse(result.content)); } catch { /* skip malformed */ }
    }
  }
  // Sort by date descending, newest first
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const indexFile = await getFile('_data/posts.json');
  const indexContent = JSON.stringify({ data: posts }, null, 2);
  await putFile(
    '_data/posts.json',
    indexContent,
    'admin: rebuild posts.json index',
    indexFile ? indexFile.sha : undefined
  );
}

module.exports = async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try { verifyAuth(req); } catch {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // ── GET: list ────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const files = await listDir('_data/posts');
      const posts = [];
      for (const f of files) {
        if (!f.name.endsWith('.json')) continue;
        const result = await getFile(f.path);
        if (result) {
          try { posts.push(JSON.parse(result.content)); } catch { /* skip */ }
        }
      }
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.status(200).json({ ok: true, data: posts });
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
      const filePath = `_data/posts/${slug}.json`;
      try {
        const existing = await getFile(filePath);
        if (!existing) return res.status(404).json({ ok: false, error: 'Post not found' });
        await deleteFile(filePath, existing.sha, `admin: delete post ${slug}`);
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

      const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
      data.slug = slug;

      // Default date to today if not set
      if (!data.date) data.date = new Date().toISOString().slice(0, 10);

      const filePath = `_data/posts/${slug}.json`;
      try {
        const existing = await getFile(filePath);
        if (!data.id) data.id = String(Date.now());

        await putFile(
          filePath,
          JSON.stringify(data, null, 2),
          `admin: ${existing ? 'update' : 'create'} post ${slug}`,
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
