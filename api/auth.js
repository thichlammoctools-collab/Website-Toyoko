// Vercel Serverless Function – GitHub OAuth for Decap CMS
// CommonJS format required for Vercel Node.js runtime

const https = require('https');

function httpsPost(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  const { code } = req.query;

  // Step 1: No code yet → redirect to GitHub
  if (!code) {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      scope: 'repo,user',
      allow_signup: 'false',
    });
    return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  }

  // Step 2: Exchange code for token
  try {
    const body = JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
    });

    const tokenData = await httpsPost({
      hostname: 'github.com',
      path: '/login/oauth/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, body);

    if (tokenData.error) {
      return res.status(400).send(`
        <html><body><script>
          (window.opener || window.parent).postMessage(
            'authorization:github:error:${encodeURIComponent(tokenData.error_description || tokenData.error)}',
            '*'
          );
        <\/script></body></html>
      `);
    }

    // Step 3: Map GitHub token to Decap CMS expected format
    // GitHub returns: { access_token, token_type, scope }
    // Decap CMS expects: { token, provider }
    const cmsToken = {
      token: tokenData.access_token,
      provider: 'github',
    };
    const content = JSON.stringify(cmsToken);
    const html = `<!DOCTYPE html>
<html><body>
<p>Đang đăng nhập, vui lòng đợi...</p>
<script>
  (function() {
    function sendToken() {
      var payload = ${JSON.stringify(content)};
      var message = 'authorization:github:success:' + payload;
      if (window.opener) {
        window.opener.postMessage(message, '*');
      } else if (window.parent !== window) {
        window.parent.postMessage(message, '*');
      }
      setTimeout(function() { window.close(); }, 1500);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', sendToken);
    } else {
      sendToken();
    }
  })();
<\/script>
</body></html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);

  } catch (err) {
    console.error('OAuth error:', err);
    return res.status(500).send(`
      <html><body><p>Lỗi xác thực: ${err.message}</p></body></html>
    `);
  }
};
