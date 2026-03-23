// Vercel Serverless Function – GitHub OAuth callback for Decap CMS
// Deploy at: api/auth.js → accessible as /api/auth

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    // Step 1: Redirect to GitHub auth
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      scope: 'repo,user',
    });
    return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  }

  // Step 2: Exchange code for token
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.status(401).send(`OAuth error: ${tokenData.error_description}`);
    }

    // Step 3: Return postMessage to CMS
    const script = `
      <script>
        window.opener.postMessage(
          'authorization:github:success:${JSON.stringify(tokenData)}',
          '*'
        );
      </script>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(script);
  } catch (err) {
    return res.status(500).send('Server error: ' + err.message);
  }
}
