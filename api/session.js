export default function handler(req, res) {
  try {
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(x => {
      const i = x.indexOf('=');
      return [x.slice(0, i).trim(), decodeURIComponent(x.slice(i + 1))];
    }));
    const s = JSON.parse(Buffer.from(cookies.apk_session || '', 'base64url').toString());
    if (!s.access_token || s.exp < Date.now()) throw new Error('expired');
    res.json({ connected: true });
  } catch {
    res.status(401).json({ connected: false });
  }
}
