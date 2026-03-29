// functions/api/admin/auth.js
import { createToken, verifyAuth } from './_auth.js';

function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: getCORSHeaders() });
  }

  const ADMIN_USERNAME = env.ADMIN_USERNAME || 'quangphu';
  const ADMIN_PASSWORD = env.ADMIN_PASSWORD || '0938895934@';

  if (request.method === 'GET') {
    try {
      const payload = await verifyAuth(request, env);
      return new Response(JSON.stringify({ ok: true, user: payload.sub }), {
        status: 200,
        headers: { ...getCORSHeaders(), 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...getCORSHeaders(), 'Content-Type': 'application/json' },
      });
    }
  }

  if (request.method === 'POST') {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...getCORSHeaders(), 'Content-Type': 'application/json' },
      });
    }

    const { username, password } = body;

    let userMatch = false;
    let passMatch = false;
    if (username && password) {
       userMatch = username === ADMIN_USERNAME;
       passMatch = password === ADMIN_PASSWORD;
    }

    if (!userMatch || !passMatch) {
      return new Response(JSON.stringify({ ok: false, error: 'Sai tên đăng nhập hoặc mật khẩu' }), {
        status: 401,
        headers: { ...getCORSHeaders(), 'Content-Type': 'application/json' },
      });
    }

    const token = await createToken(username, env);

    const matchHeaders = {
       ...getCORSHeaders(),
       'Content-Type': 'application/json',
       'Set-Cookie': `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`
    };

    return new Response(JSON.stringify({ ok: true, token }), {
      status: 200,
      headers: matchHeaders,
    });
  }

  return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
    status: 405,
    headers: { ...getCORSHeaders(), 'Content-Type': 'application/json' },
  });
}
