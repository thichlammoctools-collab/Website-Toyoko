// functions/api/products.js
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL('/_data/products.json', request.url);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const assetRes = await env.ASSETS.fetch(new Request(url));
    if (assetRes.ok) {
        let jsonStr = await assetRes.text();
        let parsed = JSON.parse(jsonStr);
        if (parsed.data) parsed = parsed.data;
        return new Response(JSON.stringify(parsed), { headers, status: 200 });
    }
    return new Response('[]', { headers, status: 200 });
  } catch (err) {
    return new Response('[]', { headers, status: 200 });
  }
}
