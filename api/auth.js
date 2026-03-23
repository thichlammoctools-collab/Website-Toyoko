// Vercel Serverless Function – GitHub OAuth for Decap CMS
const https = require('https');

module.exports = async function handler(req, res) {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
  
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.status(500).send('OAuth not configured on server');
  }

  // Set highly permissive CORS for Decap CMS popup communication
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  const { code } = req.query;

  // Step 1: Initial redirect to GitHub
  if (!code) {
    const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user`;
    return res.redirect(redirectUrl);
  }

  // Step 2: Exchange code for token
  try {
    const postData = JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: code
    });

    const options = {
      hostname: 'github.com',
      path: '/login/oauth/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const tokenResponse = await new Promise((resolve, reject) => {
      const gReq = https.request(options, (gRes) => {
        let data = '';
        gRes.on('data', chunk => data += chunk);
        gRes.on('end', () => {
          try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
        });
      });
      gReq.on('error', reject);
      gReq.write(postData);
      gReq.end();
    });

    if (tokenResponse.error) {
       return res.send(`<html><body><script>
        window.opener.postMessage('authorization:github:error:${JSON.stringify(tokenResponse)}', '*');
        window.close();
      </script></body></html>`);
    }

    // Decap expects exactly this format
    // Match the official react-netlify-identity / decap-oauth pattern
    const message = {
      token: tokenResponse.access_token,
      provider: 'github'
    };

    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Ghi nhận đăng nhập...</title>
</head>
<body>
    <script>
      const receiveMessage = (message) => {
          const payload = message.data;
          window.opener.postMessage(
            'authorization:github:success:${JSON.stringify(message)}',
            message.origin
          );
          window.removeEventListener("message", receiveMessage, false);
          window.close();
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.end(html);

  } catch (error) {
    console.error(error);
    return res.status(500).send('Authentication failed');
  }
};
