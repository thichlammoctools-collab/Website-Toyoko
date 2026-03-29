// functions/api/admin/_auth.js
// Cloudflare Workers Web Crypto JWT Implementation

const TOKEN_TTL  = 8 * 60 * 60 * 1000; // 8 hours in ms

function getJwtSecret(env) {
  return env.ADMIN_JWT_SECRET || '964b052419c18f6c085a51ce6a7b272c162746602d3d17878c9c76a43b62dd44';
}

function b64url(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getCryptoKey(secret) {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function sign(payload, env) {
  const secret = getJwtSecret(env);
  const key = await getCryptoKey(secret);
  
  const header = b64url(btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64url(btoa(JSON.stringify(payload)));
  
  const enc = new TextEncoder();
  const data = enc.encode(`${header}.${body}`);
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const signatureB64 = b64url(btoa(String.fromCharCode(...new Uint8Array(signature))));
  
  return `${header}.${body}.${signatureB64}`;
}

export async function verify(token, env) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  
  const [header, body, sig] = parts;
  
  // Re-sign to verify
  const secret = getJwtSecret(env);
  const key = await getCryptoKey(secret);
  const enc = new TextEncoder();
  const data = enc.encode(`${header}.${body}`);
  const expectedSignature = await crypto.subtle.sign('HMAC', key, data);
  const expectedSignatureB64 = b64url(btoa(String.fromCharCode(...new Uint8Array(expectedSignature))));
  
  if (sig !== expectedSignatureB64) {
    throw new Error('Invalid token signature');
  }
  
  const payloadStr = atob(body.replace(/-/g, '+').replace(/_/g, '/'));
  const payload = JSON.parse(payloadStr);
  
  if (Date.now() > payload.exp) throw new Error('Token expired');
  return payload;
}

export async function createToken(username, env) {
  return await sign({ sub: username, exp: Date.now() + TOKEN_TTL, iat: Date.now() }, env);
}

function parseCookies(cookieStr) {
  return (cookieStr || '').split(';').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=');
    if (k) acc[k.trim()] = decodeURIComponent(v.join('='));
    return acc;
  }, {});
}

export async function verifyAuth(request, env) {
  let token = null;

  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    // try reading cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);
    token = cookies['admin_token'];
  }

  if (!token) throw new Error('No auth token');
  return await verify(token, env);
}
