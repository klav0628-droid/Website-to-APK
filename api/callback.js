export default async function handler(req, res) {
  try {
    const { code, state } = req.query || {};
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(x => {
      const i = x.indexOf('=');
      return [x.slice(0, i).trim(), decodeURIComponent(x.slice(i + 1))];
    }));
    if (!code || !state || state !== cookies.oauth_state) return res.status(400).send('Invalid OAuth state.');

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI
      })
    });
    const token = await tokenRes.json();
    if (!token.access_token) return res.status(401).send('GitHub authorization failed.');

    const session = Buffer.from(JSON.stringify({ access_token: token.access_token, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
    const frontend = process.env.FRONTEND_URL || 'https://klav0628-droid.github.io/Website-to-APK/';
    res.setHeader('Set-Cookie', `apk_session=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);
    res.setHeader('Location', frontend + '?connected=1');
    res.statusCode = 302;
    res.end();
  } catch (e) {
    res.status(500).send('OAuth callback error.');
  }
}
