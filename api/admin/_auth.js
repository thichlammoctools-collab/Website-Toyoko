// JWT auth middleware for admin API endpoints
// Usage: const { verifyAuth } = require('./_auth');
//        const payload = verifyAuth(req); // throws on failure

const crypto = require('crypto');

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || '';
const TOKEN_TTL  = 8 * 60 * 60 * 1000; // 8 hours in ms

// ── Minimal JWT (HS256) implementation ──────────────────────────
function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function sign(payload) {
  const header  = b64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body    = b64url(Buffer.from(JSON.stringify(payload)));
  const sig     = b64url(
    crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest()
  );
  return `${header}.${body}.${sig}`;
}

function verify(token) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [header, body, sig] = parts;
  const expected = b64url(
    crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest()
  );
  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('Invalid token signature');
  }
  const payload = JSON.parse(Buffer.from(body, 'base64').toString('utf8'));
  if (Date.now() > payload.exp) throw new Error('Token expired');
  return payload;
}

function createToken(username) {
  return sign({ sub: username, exp: Date.now() + TOKEN_TTL, iat: Date.now() });
}

/**
 * Extract and verify JWT from request.
 * Accepts: Authorization: Bearer <token>  OR  cookie: admin_token=<token>
 * Returns payload on success, throws on failure.
 */
function verifyAuth(req) {
  let token = null;

  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    const cookies = parseCookies(req.headers['cookie'] || '');
    token = cookies['admin_token'];
  }

  if (!token) throw new Error('No auth token');
  return verify(token);
}

function parseCookies(cookieStr) {
  return cookieStr.split(';').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=');
    if (k) acc[k.trim()] = decodeURIComponent(v.join('='));
    return acc;
  }, {});
}

module.exports = { createToken, verifyAuth };
