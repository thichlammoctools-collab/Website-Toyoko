// api/admin/auth.js
// POST /api/admin/auth  → login with username+password, returns JWT
// GET  /api/admin/auth  → verify current session

const { createToken, verifyAuth } = require('./_auth');
const crypto = require('crypto');

// Fallback credentials keep admin login usable when env vars are missing.
// Prefer setting ADMIN_USERNAME/ADMIN_PASSWORD in hosting env for production.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'quangphu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '0938895934@';

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = async function handler(req, res) {
  setCORSHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET: check if current token is valid ─────────────────────
  if (req.method === 'GET') {
    try {
      const payload = verifyAuth(req);
      return res.status(200).json({ ok: true, user: payload.sub });
    } catch {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
  }

  // ── POST: login ───────────────────────────────────────────────
  if (req.method === 'POST') {
    let body = {};
    try {
      if (typeof req.body === 'object' && req.body !== null) {
        body = req.body;
      } else if (typeof req.body === 'string') {
        body = JSON.parse(req.body);
      }
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }

    const { username, password } = body;

    // Constant-time comparison to prevent timing attacks
    const userMatch = username && crypto.timingSafeEqual(
      Buffer.from(username.padEnd(64)),
      Buffer.from(ADMIN_USERNAME.padEnd(64))
    );
    const passMatch = password && crypto.timingSafeEqual(
      Buffer.from(password.padEnd(64)),
      Buffer.from(ADMIN_PASSWORD.padEnd(64))
    );

    if (!userMatch || !passMatch) {
      return res.status(401).json({ ok: false, error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }

    const token = createToken(username);

    // Set httpOnly cookie as well as returning in body
    res.setHeader('Set-Cookie', `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`);
    return res.status(200).json({ ok: true, token });
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed' });
};
