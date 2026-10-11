const https = require('https');
const http = require('http');

module.exports = (req, res) => {
  const target = req.query && req.query.url;
  if (!target) return res.status(400).send('Missing url parameter');
  let parsed;
  try { parsed = new URL(target); } catch { return res.status(400).send('Invalid url parameter'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) return res.status(400).send('Unsupported URL protocol');
  const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36' };
  if (req.headers.range) headers.Range = req.headers.range;
  const client = parsed.protocol === 'https:' ? https : http;
  const upstream = client.get(parsed, { headers, timeout: 50000 }, (response) => {
    res.statusCode = response.statusCode || 502;
    for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control']) {
      if (response.headers[key]) res.setHeader(key, response.headers[key]);
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
    response.pipe(res);
  });
  upstream.on('timeout', () => upstream.destroy(new Error('Upstream timeout')));
  upstream.on('error', (err) => {
    if (!res.headersSent) res.status(502).send('Audio proxy failed: ' + err.message);
    else res.end();
  });
};
