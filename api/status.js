export default async function handler(req, res) {
  try {
    const cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(x => {
      const i = x.indexOf('=');
      return [x.slice(0, i).trim(), decodeURIComponent(x.slice(i + 1))];
    }));
    const session = JSON.parse(Buffer.from(cookies.apk_session || '', 'base64url').toString());
    if (!session.access_token || session.exp < Date.now()) throw new Error('GitHub is not connected.');
    const commit = String(req.query.commit || '');
    if (!commit) throw new Error('Missing commit.');
    const owner = process.env.GITHUB_OWNER || 'klav0628-droid';
    const repo = process.env.GITHUB_REPO || 'Website-to-APK';
    const gh = async path => {
      const r = await fetch('https://api.github.com' + path, { headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${session.access_token}`, 'X-GitHub-Api-Version': '2022-11-28' } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'GitHub API error');
      return d;
    };
    const data = await gh(`/repos/${owner}/${repo}/actions/runs?event=push&per_page=20`);
    const run = data.workflow_runs.find(x => x.head_sha === commit);
    if (!run) return res.json({ status: 'queued' });
    if (run.status !== 'completed') return res.json({ status: run.status, run: run.run_number });
    if (run.conclusion !== 'success') return res.json({ status: 'failed', run: run.run_number, conclusion: run.conclusion, url: run.html_url });
    const releases = await gh(`/repos/${owner}/${repo}/releases?per_page=20`);
    const release = releases.find(x => x.tag_name === `build-${run.run_number}`) || releases[0];
    const asset = release?.assets?.find(x => x.name.toLowerCase().endsWith('.apk'));
    res.json({ status: 'success', run: run.run_number, url: asset?.browser_download_url || release?.html_url || run.html_url, name: asset?.name || null });
  } catch (e) {
    res.status(400).json({ error: e.message || 'Status check failed.' });
  }
}
