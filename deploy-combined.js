import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'frontend', 'dist');

const app = express();
const PORT = process.env.PORT || 3000;
const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const API_KEY = process.env.GHL_API_KEY;
const LOCATION_ID = process.env.GHL_LOCATION_ID;

if (!API_KEY) {
  console.error('FATAL: GHL_API_KEY environment variable is required');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many requests.' },
});

app.all(/\/api\/ghl\/.*/, limiter, async (req, res) => {
  try {
    const ghlPath = req.path.replace('/api/ghl', '') || '/';
    const qs = new URLSearchParams(req.query).toString();
    const url = `${GHL_API_BASE}${qs ? `${ghlPath}?${qs}` : ghlPath}`;
    const isGet = ['GET', 'HEAD'].includes(req.method.toUpperCase());
    const headers = { 'Authorization': `Bearer ${API_KEY}`, 'Version': '2021-07-28' };
    let body;
    if (!isGet && !['GET', 'HEAD'].includes(req.method)) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(req.body);
    }
    const resp = await fetch(url, { method: req.method, headers, body });
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
    res.status(resp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', locationId: LOCATION_ID || 'not-set' });
});

app.use(express.static(DIST, {
  setHeaders(res, path) {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

app.get(/(.*)/, (_, res) => {
  const index = join(DIST, 'index.html');
  if (existsSync(index)) {
    res.setHeader('Content-Type', 'text/html');
    res.send(readFileSync(index, 'utf-8'));
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`LHH PWA + BFF running on http://0.0.0.0:${PORT}`);
  console.log(`GHL Location: ${LOCATION_ID || 'not-set'}`);
});
