// functions/api/admin/posts.js
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

async function rebuildIndex(env) {
  const files = await listDir('_data/posts', env);
  const posts = [];
  for (const f of files) {
    if (!f.name.endsWith('.json')) continue;
    const result = await getFile(f.path, env);
    if (result) {
      try { posts.push(JSON.parse(result.content)); } catch { /* skip malformed */ }
    }
  }
  
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const indexFile = await getFile('_data/posts.json', env);
  const indexContent = JSON.stringify({ data: posts }, null, 2);
  await putFile(
    '_data/posts.json',
    indexContent,
    'admin: rebuild posts.json index',
    indexFile ? indexFile.sha : undefined,
    false,
    env
  );
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
      const files = await listDir('_data/posts', env);
      const posts = [];
      for (const f of files) {
        if (!f.name.endsWith('.json')) continue;
        const result = await getFile(f.path, env);
        if (result) {
          try { posts.push(JSON.parse(result.content)); } catch { /* skip */ }
        }
      }
      posts.sort((a, b) => new Date(b.date) - new Date(a.date));
      return jsonResponse({ ok: true, data: posts });
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
      const filePath = `_data/posts/${slug}.json`;
      try {
        const existing = await getFile(filePath, env);
        if (!existing) return jsonResponse({ ok: false, error: 'Post not found' }, 404);
        await deleteFile(filePath, existing.sha, `admin: delete post ${slug}`, env);
        await rebuildIndex(env);
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

      if (!data.date) data.date = new Date().toISOString().slice(0, 10);

      const filePath = `_data/posts/${slug}.json`;
      try {
        const existing = await getFile(filePath, env);
        if (!data.id) data.id = String(Date.now());

        await putFile(
          filePath,
          JSON.stringify(data, null, 2),
          `admin: ${existing ? 'update' : 'create'} post ${slug}`,
          existing ? existing.sha : undefined,
          false,
          env
        );
        await rebuildIndex(env);
        return jsonResponse({ ok: true, data });
      } catch (err) {
        return jsonResponse({ ok: false, error: err.message }, 500);
      }
    }

    return jsonResponse({ ok: false, error: `Unknown action: ${action}` }, 400);
  }

  return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
}
