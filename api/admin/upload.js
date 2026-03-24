// api/admin/upload.js
// POST /api/admin/upload
// Body: { filename: "ten-anh.jpg", data: "<base64 string>", type: "image/jpeg" }
// Saves to public/images/products/<filename> via GitHub API
// Returns: { ok: true, url: "/images/products/<filename>" }

const { verifyAuth } = require('./_auth');
const { getFile, putFile } = require('./_github');

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try { verifyAuth(req); } catch {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = {};
  try {
    body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(req.body || '{}');
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid JSON' });
  }

  const { filename, data, type } = body;

  if (!filename || !data) {
    return res.status(400).json({ ok: false, error: 'filename and data are required' });
  }

  // Validate MIME type
  if (type && !ALLOWED_TYPES.includes(type.toLowerCase())) {
    return res.status(400).json({ ok: false, error: 'File type not allowed. Use JPEG, PNG, WebP, or GIF.' });
  }

  // Sanitize filename: only allow safe characters
  const safeName = filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/\.{2,}/g, '.')   // prevent path traversal via ..
    .replace(/^\./, '');        // no leading dot

  if (!safeName) {
    return res.status(400).json({ ok: false, error: 'Invalid filename' });
  }

  // Validate base64 size
  const estimated = Math.ceil((data.length * 3) / 4);
  if (estimated > MAX_SIZE_BYTES) {
    return res.status(400).json({ ok: false, error: 'File too large (max 5MB)' });
  }

  const filePath = `public/images/products/${safeName}`;

  try {
    // Check if file already exists (to get sha for update)
    const existing = await getFile(filePath);

    await putFile(
      filePath,
      data,          // already base64 from the client
      `admin: upload image ${safeName}`,
      existing ? existing.sha : undefined,
      true           // isBase64 = true, skip re-encoding
    );

    return res.status(200).json({ ok: true, url: `/images/products/${safeName}` });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};
