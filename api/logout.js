export default function handler(req, res) {
  res.setHeader('Set-Cookie', 'apk_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  res.json({ ok: true });
}
