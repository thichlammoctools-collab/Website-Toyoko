const fs = require('fs');

let code = fs.readFileSync('worker.js', 'utf8');

// Chunk 1: Replace Index Helpers (Lines 170-216 approx)
const helpersRegex = /\/\/ -- Products Index Helpers --[\s\S]*?\/\/ -- Main Export --/m;
const newHelpers = // -- KV API Helpers ---------------------------------------------

async function getProducts(env) {
  try { return JSON.parse(await env.DATA_KV.get('products')) || []; }
  catch { return []; }
}
async function saveProducts(products, env) {
  const sorted = [...(products || [])].sort((a, b) => Number(a.id) - Number(b.id));
  await env.DATA_KV.put('products', JSON.stringify(sorted));
}

async function getPosts(env) {
  try { return JSON.parse(await env.DATA_KV.get('posts')) || []; }
  catch { return []; }
}
async function savePosts(posts, env) {
  const sorted = [...(posts || [])].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  await env.DATA_KV.put('posts', JSON.stringify(sorted));
}

async function getSiteConfig(env) {
  try { return JSON.parse(await env.DATA_KV.get('site')) || DEFAULT_SITE; }
  catch { return DEFAULT_SITE; }
}
async function saveSiteConfig(config, env) {
  await env.DATA_KV.put('site', JSON.stringify(config || DEFAULT_SITE));
}

// -- Main Export --;
code = code.replace(helpersRegex, newHelpers);

// Chunk 2: Public API (Lines 229-293)
const publicApiRegex = /if \(pathname === '\/api\/products'\) \{[\s\S]*?\}

    \/\/ -- Admin API \(requires auth\) --/m;
const newPublicApi = if (pathname === '/api/products') {
      return json(await getProducts(env));
    }

    if (pathname === '/api/posts') {
      return json(await getPosts(env));
    }

    if (pathname === '/api/site') {
      const d = await getSiteConfig(env);
      return json({ ...d, productCategories: normalizeCats(d.productCategories || DEFAULT_SITE.productCategories) });
    }

    // -- Admin API (requires auth) --;
code = code.replace(publicApiRegex, newPublicApi);

// Chunk 3: Admin Products
const adminProdRegex = /if \(pathname === '\/api\/admin\/products'\) \{[\s\S]*?\/\/ Admin Posts/m;
const newAdminProd = if (pathname === '/api/admin/products') {
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
            const norm = s => String(s || '').trim().replace(/\\s+/g, ' ').toLowerCase();
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

          return json({ ok: false, error: \Unknown action: \\ }, 400);
        }
      }

      // Admin Posts;
code = code.replace(adminProdRegex, newAdminProd);

fs.writeFileSync('worker2.js', code);
console.log('Done replacement part 1');
