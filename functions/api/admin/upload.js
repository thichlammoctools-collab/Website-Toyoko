// functions/api/admin/upload.js
import { verifyAuth } from './_auth.js';
import { getFile, putFile } from './_github.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...getCORSHeaders(), 'Content-Type': 'application/json' },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: getCORSHeaders() });
  }

  try {
    await verifyAuth(request, env);
  } catch {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
  }

  const { filename, data, type } = body;

  if (!filename || !data) {
    return jsonResponse({ ok: false, error: 'filename and data are required' }, 400);
  }

  if (type && !ALLOWED_TYPES.includes(type.toLowerCase())) {
    return jsonResponse({ ok: false, error: 'File type not allowed. Use JPEG, PNG, WebP, or GIF.' }, 400);
  }

  const safeName = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/\.{2,}/g, '.')
    .replace(/^\./, '');

  if (!safeName) {
    return jsonResponse({ ok: false, error: 'Invalid filename' }, 400);
  }

  const estimated = Math.ceil((data.length * 3) / 4);
  if (estimated > MAX_SIZE_BYTES) {
    return jsonResponse({ ok: false, error: 'File too large (max 5MB)' }, 400);
  }

  const filePath = `public/images/products/${safeName}`;

  try {
    const existing = await getFile(filePath, env);

    await putFile(
      filePath,
      data,         
      `admin: upload image ${safeName}`,
      existing ? existing.sha : undefined,
      true,         
      env
    );

    return jsonResponse({ ok: true, url: `/images/products/${safeName}` });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message }, 500);
  }
}
