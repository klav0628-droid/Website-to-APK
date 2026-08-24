export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(x => {
      const i = x.indexOf('=');
      return [x.slice(0, i).trim(), decodeURIComponent(x.slice(i + 1))];
    }));
    const session = JSON.parse(Buffer.from(cookies.apk_session || '', 'base64url').toString());
    if (!session.access_token || session.exp < Date.now()) throw new Error('GitHub is not connected.');

    const { name, url, iconBase64 } = req.body || {};
    if (!name || !url || !iconBase64) throw new Error('App name, website URL and logo are required.');
    if (!/^https?:\/\//i.test(url)) throw new Error('Website URL must start with http:// or https://');

    const owner = process.env.GITHUB_OWNER || 'klav0628-droid';
    const repo = process.env.GITHUB_REPO || 'Website-to-APK';
    const branch = 'main';
    const token = session.access_token;
    const gh = async (path, options = {}) => {
      const r = await fetch('https://api.github.com' + path, {
        ...options,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'GitHub API error');
      return d;
    };

    const safeName = String(name).replace(/[^a-zA-Z0-9._ -]/g, '').trim().slice(0, 40) || 'Web App';
    const ref = await gh(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
    const parent = ref.object.sha;
    const commit = await gh(`/repos/${owner}/${repo}/git/commits/${parent}`);
    const baseTree = commit.tree.sha;
    const config = `APP_NAME=${safeName}\nWEBSITE_URL=${url}\n`;

    const b1 = await gh(`/repos/${owner}/${repo}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: config, encoding: 'utf-8' }) });
    const b2 = await gh(`/repos/${owner}/${repo}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: iconBase64, encoding: 'base64' }) });
    const tree = await gh(`/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTree,
        tree: [
          { path: 'app-config.properties', mode: '100644', type: 'blob', sha: b1.sha },
          { path: 'app-icon.base64', mode: '100644', type: 'blob', sha: b2.sha }
        ]
      })
    });
    const newCommit = await gh(`/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({ message: `Generate APK: ${safeName}`, tree: tree.sha, parents: [parent] })
    });
    await gh(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, { method: 'PATCH', body: JSON.stringify({ sha: newCommit.sha, force: false }) });

    res.json({ ok: true, commit: newCommit.sha, actions: `https://github.com/${owner}/${repo}/actions`, releases: `https://github.com/${owner}/${repo}/releases` });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Generation failed.' });
  }
}
