// worker.js
// Cloudflare Workers - Single entry point for all API routes
// Static assets served by env.ASSETS.fetch()

// ── GitHub API Helper ─────────────────────────────────────────────

const BASE_GH = 'https://api.github.com';

function getConfig(env) {
  const GITHUB_TOKEN = (env.GITHUB_TOKEN || env.GITHUB_PAT || env.GH_TOKEN || '').trim();
  const GITHUB_REPO = env.GITHUB_REPO || 'thichlammoctools-collab/Website-Toyoko';
  const GITHUB_BRANCH = env.GITHUB_BRANCH || 'main';
  return { GITHUB_TOKEN, GITHUB_REPO, GITHUB_BRANCH };
}

function ghHeaders(cfg) {
  if (!cfg.GITHUB_TOKEN) throw new Error('GITHUB_TOKEN missing. Set it in Cloudflare Dashboard > Workers > Settings > Variables.');
  return {
    Authorization: `Bearer ${cfg.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'ToyokoWorker/1.0',
  };
}

function b64enc(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64dec(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function ghGet(path, env) {
  const cfg = getConfig(env);
  const url = `${BASE_GH}/repos/${cfg.GITHUB_REPO}/contents/${path}?ref=${cfg.GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: ghHeaders(cfg) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET ${path} failed: ${res.status}`);
  const d = await res.json();
  return { content: b64dec(d.content), sha: d.sha };
}

async function ghPut(path, contentStr, message, sha, isBase64, env) {
  const cfg = getConfig(env);
  const url = `${BASE_GH}/repos/${cfg.GITHUB_REPO}/contents/${path}`;
  const encoded = isBase64 ? contentStr : b64enc(contentStr);
  const body = { message, content: encoded, branch: cfg.GITHUB_BRANCH };
  if (sha) body.sha = sha;
  const res = await fetch(url, { method: 'PUT', headers: ghHeaders(cfg), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`GitHub PUT ${path} failed: ${res.status}`);
  return res.json();
}

async function ghDelete(path, sha, message, env) {
  const cfg = getConfig(env);
  const url = `${BASE_GH}/repos/${cfg.GITHUB_REPO}/contents/${path}`;
  const res = await fetch(url, { method: 'DELETE', headers: ghHeaders(cfg), body: JSON.stringify({ message, sha, branch: cfg.GITHUB_BRANCH }) });
  if (!res.ok) throw new Error(`GitHub DELETE ${path} failed: ${res.status}`);
  return res.json();
}

async function ghList(path, env) {
  const cfg = getConfig(env);
  const url = `${BASE_GH}/repos/${cfg.GITHUB_REPO}/contents/${path}?ref=${cfg.GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: ghHeaders(cfg) });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub LIST ${path} failed: ${res.status}`);
  return res.json();
}

// ── JWT Auth ─────────────────────────────────────────────────────

const TOKEN_TTL = 8 * 60 * 60 * 1000;

function getSecret(env) {
  return env.ADMIN_JWT_SECRET || '964b052419c18f6c085a51ce6a7b272c162746602d3d17878c9c76a43b62dd44';
}

function b64url(str) { return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ''); }

async function jwtSign(payload, env) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(getSecret(env)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const header = b64url(btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = b64url(btoa(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  return `${header}.${body}.${b64url(btoa(String.fromCharCode(...new Uint8Array(sig))))}`;
}

async function jwtVerify(token, env) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const [header, body, sig] = parts;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(getSecret(env)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`));
  const expectedB64 = b64url(btoa(String.fromCharCode(...new Uint8Array(expected))));
  if (sig !== expectedB64) throw new Error('Invalid signature');
  const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
  if (Date.now() > payload.exp) throw new Error('Token expired');
  return payload;
}

async function verifyAuth(request, env) {
  let token = null;
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) token = auth.slice(7);
  if (!token) {
    const cookies = Object.fromEntries((request.headers.get('cookie') || '').split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    }));
    token = cookies['admin_token'];
  }
  if (!token) throw new Error('No auth token');
  return jwtVerify(token, env);
}

// ── Response Helpers ─────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 
      ...CORS, 
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=15', 
      ...extra 
    },
  });
}

// ── Site Config Helpers ──────────────────────────────────────────

const DEFAULT_SITE = {
  productCategories: ['Máy khoan', 'Máy mài', 'Máy cưa', 'Máy siết bulon/vít', 'Khác'],
  hero: { badge: '', titlePrefix: 'TOYOKO', titleRest: '', description: '', image: '/images/hero-machine.png', imageAlt: 'Máy cầm tay Toyoko' },
  about: { sectionLabel: 'Về chúng tôi', title: 'Toyoko – An tâm đồng hành cùng người thợ Việt', description1: '', description2: '', image: '/images/about.jpg', imageAlt: 'Kho hàng Quang Phú', badgeTitle: 'Chứng nhận nhập khẩu', badgeSubtitle: 'Toyoko Official Importer VN', primaryButtonText: 'Xem sản phẩm', primaryButtonHref: '/products.html', secondaryButtonText: 'Liên hệ', secondaryButtonHref: '/contact.html' },
  why: { sectionLabel: 'Tại sao chọn chúng tôi', title: 'Lợi ích khi mua hàng tại Quang Phú', cards: [
    { icon: '🏆', title: 'Chính hãng 100%', description: 'Nhà nhập khẩu trực tiếp từ nhà máy Toyoko, cam kết hàng chính hãng.' },
    { icon: '🚚', title: 'Giao hàng nhanh', description: 'Giao hàng toàn quốc, TP.HCM giao trong ngày.' },
    { icon: '🔧', title: 'Bảo hành chính hãng', description: 'Bảo hành 6 tháng, trung tâm bảo hành chuyên nghiệp.' },
    { icon: '💰', title: 'Giá cạnh tranh', description: 'Nhập thẳng từ nhà máy, giá tốt nhất thị trường.' },
    { icon: '📞', title: 'Hỗ trợ kỹ thuật', description: 'Đội ngũ kỹ thuật tư vấn miễn phí qua Zalo và điện thoại.' },
    { icon: '🤝', title: 'Đại lý chính thức', description: 'Chính sách đại lý hấp dẫn, hỗ trợ trưng bày và marketing.' },
  ]},
  footer: { desc: 'Công ty TNHH Quang Phú - Nhà phân phối độc quyền thương hiệu Toyoko tại Việt Nam.', phone: '0938 895 934', email: 'info@quangphugroup.com', address: '234 Bình Thới, Phường 10, Quận 11, HCM', hours: 'T2-T6: 8h-17h, T7: 8h-12h', exploreTitle: 'Khám phá', contactTitle: 'Liên hệ', linkHomeText: 'Trang chủ', linkProductsText: 'Sản phẩm', linkBlogText: 'Tuyển dụng', linkContactText: 'Liên hệ', copyright: '© 2024 Công ty TNHH Quang Phú. Tất cả quyền được bảo lưu.', tagline: 'Thương hiệu Toyoko – An tâm đồng hành cùng thợ Việt' }
};

function normalizeCats(cats) {
  const seen = new Set(), out = [];
  (Array.isArray(cats) ? cats : []).forEach(item => {
    const name = (typeof item === 'string' ? item : item?.name) || '';
    const clean = String(name).trim();
    if (!clean || seen.has(clean.toLowerCase())) return;
    seen.add(clean.toLowerCase()); out.push(clean);
  });
  if (!out.some(c => c.toLowerCase() === 'khác')) out.push('Khác');
  return out;
}

// ── KV API Helpers ─────────────────────────────────────────────

async function getProducts(env) {
  try { return JSON.parse(await env.quangphu.get('products')) || []; }
  catch { return []; }
}
async function saveProducts(products, env) {
  const sorted = [...(products || [])].sort((a, b) => Number(a.id) - Number(b.id));
  await env.quangphu.put('products', JSON.stringify(sorted));
}

async function getPosts(env) {
  try { return JSON.parse(await env.quangphu.get('posts')) || []; }
  catch { return []; }
}
async function savePosts(posts, env) {
  const sorted = [...(posts || [])].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  await env.quangphu.put('posts', JSON.stringify(sorted));
}

async function getSiteConfig(env) {
  try { return JSON.parse(await env.quangphu.get('site')) || DEFAULT_SITE; }
  catch { return DEFAULT_SITE; }
}
async function saveSiteConfig(config, env) {
  await env.quangphu.put('site', JSON.stringify(config || DEFAULT_SITE));
}

// ── Main Export ───────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── Public API ──

    if (pathname === '/api/products') {
      return json(await getProducts(env));
    }

    if (pathname === '/api/posts') {
      return json(await getPosts(env));
    }

    if (pathname === '/api/site') {
      const d = await getSiteConfig(env);
      return json({ ...d, productCategories: normalizeCats(d.productCategories || DEFAULT_SITE.productCategories) });
    }

    // ── Admin API (requires auth) ──

    if (pathname.startsWith('/api/admin/')) {

      // ── Login (NO auth required) ──
      if (pathname === '/api/admin/auth' && request.method === 'POST') {
        const { username, password } = await request.json();
        if (username === (env.ADMIN_USERNAME || 'quangphu') && password === (env.ADMIN_PASSWORD || '0938895934@')) {
          const token = await jwtSign({ sub: username, exp: Date.now() + TOKEN_TTL, iat: Date.now() }, env);
          return json({ ok: true, token }, 200, { 'Set-Cookie': `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800` });
        }
        return json({ ok: false, error: 'Sai tên đăng nhập hoặc mật khẩu' }, 401);
      }

      // All other admin routes require auth
      try { await verifyAuth(request, env); }
      catch { return json({ ok: false, error: 'Unauthorized' }, 401); }

      // Admin Auth (GET - check session)
      if (pathname === '/api/admin/auth') {
        if (request.method === 'GET') {
          try {
            const p = await verifyAuth(request, env);
            return json({ ok: true, user: p.sub });
          } catch { return json({ ok: false, error: 'Unauthorized' }, 401); }
        }
      }

      if (pathname === '/api/admin/products') {
        if (request.method === 'GET') {
          try { return json({ ok: true, data: await getProducts(env) }); }
          catch (e) { return json({ ok: false, error: e.message }, 500); }
        }
        if (request.method === 'POST') {
          const body = await request.json();
          const { action } = body;

          if (action === 'delete') {
            const { slug } = body;
            const prods = await getProducts(env);
            await saveProducts(prods.filter(p => p.slug !== slug), env);
            return json({ ok: true });
          }

          if (action === 'save') {
            const data = body.data;
            if (!data?.slug) return json({ ok: false, error: 'data.slug required' }, 400);
            const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
            data.slug = slug;
            if (!data.id) data.id = String(Date.now());
            
            const prods = await getProducts(env);
            const idx = prods.findIndex(p => p.slug === slug);
            if (idx >= 0) prods[idx] = data; else prods.push(data);
            await saveProducts(prods, env);
            return json({ ok: true, data });
          }

          if (action === 'bulk-category-replace') {
            const { oldCategory, newCategory } = body;
            const prods = await getProducts(env);
            const norm = s => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
            let updated = 0;
            const merged = prods.map(p => {
               if (norm(p.category) === norm(oldCategory)) {
                  updated++;
                  return { ...p, category: newCategory };
               }
               return p;
            });
            await saveProducts(merged, env);
            return json({ ok: true, updated });
          }

          return json({ ok: false, error: `Unknown action: ${action}` }, 400);
        }
      }

      // Admin Posts
      if (pathname === '/api/admin/posts') {
        if (request.method === 'GET') {
          try { return json({ ok: true, data: await getPosts(env) }); }
          catch (e) { return json({ ok: false, error: e.message }, 500); }
        }
        if (request.method === 'POST') {
          const body = await request.json();
          const { action } = body;

          if (action === 'delete') {
            const { slug } = body;
            const posts = await getPosts(env);
            await savePosts(posts.filter(p => p.slug !== slug), env);
            return json({ ok: true });
          }

          if (action === 'save') {
            const data = body.data;
            if (!data?.slug) return json({ ok: false, error: 'data.slug required' }, 400);
            const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
            data.slug = slug;
            if (!data.id) data.id = String(Date.now());
            
            const posts = await getPosts(env);
            const idx = posts.findIndex(p => p.slug === slug);
            if (idx >= 0) posts[idx] = data; else posts.push(data);
            await savePosts(posts, env);
            return json({ ok: true, data });
          }
          return json({ ok: false, error: `Unknown action: ${action}` }, 400);
        }
      }

      // Admin Site Config
      if (pathname === '/api/admin/site') {
        if (request.method === 'GET') {
          try {
            const d = await getSiteConfig(env);
            return json({ ok: true, data: { ...d, productCategories: normalizeCats(d.productCategories || DEFAULT_SITE.productCategories) } });
          } catch (e) { return json({ ok: false, error: e.message }, 500); }
        }
        if (request.method === 'POST') {
          try {
            const { data } = await request.json();
            const current = await getSiteConfig(env);
            const merged = {
              productCategories: Array.isArray(data.productCategories) ? normalizeCats(data.productCategories) : normalizeCats(current.productCategories || DEFAULT_SITE.productCategories),
              hero: { ...DEFAULT_SITE.hero, ...(current.hero || {}), ...(data.hero || {}) },
              about: { ...DEFAULT_SITE.about, ...(current.about || {}), ...(data.about || {}) },
              why: { ...DEFAULT_SITE.why, ...(current.why || {}), ...(data.why || {}) },
              footer: { ...DEFAULT_SITE.footer, ...(current.footer || {}), ...(data.footer || {}) },
            };
            await saveSiteConfig(merged, env);
            return json({ ok: true, data: merged });
          } catch (e) { return json({ ok: false, error: e.message }, 500); }
        }
      }

      // Admin Upload
      if (pathname === '/api/admin/upload' && request.method === 'POST') {
        try {
          const { filename, data, type } = await request.json();
          if (!filename || !data) return json({ ok: false, error: 'filename and data required' }, 400);
          const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
          if (type && !allowed.includes(type.toLowerCase())) return json({ ok: false, error: 'File type not allowed' }, 400);
          
          const base64Data = data.includes(',') ? data.split(',')[1] : data;
          const safeName = filename.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/\.{2,}/g, '.').replace(/^\./, '');
          if (!safeName) return json({ ok: false, error: 'Invalid filename' }, 400);
          
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
          }
          
          await env.quangphu.put(`image:${safeName}`, bytes.buffer, {
             metadata: { contentType: type || 'image/png' }
          });
          
          return json({ ok: true, url: `/images/products/${safeName}` });
        } catch (e) { return json({ ok: false, error: e.message }, 500); }
      }

      // ── API: Migrate to KV ──
      // Call this once to move everything from Github repo to Cloudflare KV Setup
      if (pathname === '/api/admin/migrate-to-kv') {
         try {
           // Read products
           const f_prod = await ghGet('_data/products.json', env);
           let p_arr = [];
           if (f_prod) {
              const p = JSON.parse(f_prod.content);
              p_arr = Array.isArray(p) ? p : (p.data || []);
           } else {
              const files = await ghList('_data/products', env);
              for (const f of files.filter(x=>x.name.endsWith('.json'))) {
                const r = await ghGet(f.path, env);
                if (r) { try { p_arr.push(JSON.parse(r.content)); } catch(e){} }
              }
           }
           await saveProducts(p_arr, env);
  
           // Read posts
           let po_arr = [];
           const f_posts = await ghGet('_data/posts.json', env);
           if (f_posts) {
               const p = JSON.parse(f_posts.content);
               po_arr = Array.isArray(p) ? p : (p.data || []);
           } else {
               const files2 = await ghList('_data/posts', env);
               for (const f of files2.filter(x=>x.name.endsWith('.json'))) {
                 const r = await ghGet(f.path, env);
                 if (r) { try { po_arr.push(JSON.parse(r.content)); } catch(e){} }
               }
           }
           await savePosts(po_arr, env);
  
           // Read Site
           const f_site = await ghGet('_data/site.json', env);
           const siteCfg = f_site ? JSON.parse(f_site.content) : DEFAULT_SITE;
           await saveSiteConfig(siteCfg, env);
  
           return json({ ok: true, message: 'Migrated products, posts, and site completely to KV!' });
         } catch (e) {
           return json({ ok: false, error: e.message }, 500);
         }
      }

      return json({ ok: false, error: 'Not found' }, 404);
    }

    // ── Public Image Serving from KV ──
    if (pathname.startsWith('/images/products/') && request.method === 'GET') {
      const safeName = pathname.replace('/images/products/', '');
      const { value, metadata } = await env.quangphu.getWithMetadata(`image:${safeName}`, { type: 'arrayBuffer' });
      if (!value) return new Response('Not found', { status: 404 });
      return new Response(value, { 
        headers: { 
          'Content-Type': (metadata && metadata.contentType) ? metadata.contentType : 'image/png',
          'Cache-Control': 'public, max-age=86400, s-maxage=31536000'
        } 
      });
    }

    // ── Static Assets (HTML, CSS, JS, images, _data, etc.) ──
    return env.ASSETS.fetch(request);
  }
};

