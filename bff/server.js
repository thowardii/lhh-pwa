import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

const app = express();
const PORT = process.env.BFF_PORT || process.env.PORT || 3001;
const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const API_KEY = process.env.GHL_API_KEY;
const LOCATION_ID = process.env.GHL_LOCATION_ID;

if (!API_KEY) {
  console.error('FATAL: GHL_API_KEY environment variable is required');
  process.exit(1);
}

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

app.all('/api/ghl/*', async (req, res) => {
  try {
    const ghlPath = req.path.replace('/api/ghl', '') || '/';
    const queryString = new URLSearchParams(req.query).toString();
    const fullPath = queryString ? `${ghlPath}?${queryString}` : ghlPath;
    const url = `${GHL_API_BASE}${fullPath}`;
    const isGetOrHead = ['GET', 'HEAD'].includes(req.method.toUpperCase());

    const headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Version': '2021-07-28',
    };

    let body;
    if (!isGetOrHead) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(req.body);
    }

    const resp = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    res.status(resp.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', locationId: LOCATION_ID || 'not-set' });
});

const staticDir = new URL('../frontend/dist', import.meta.url).pathname;
app.use(express.static(staticDir));
app.get('*', (_, res) => {
  res.sendFile(`${staticDir}/index.html`);
});

app.listen(PORT, () => {
  console.log(`LHH PWA running on http://localhost:${PORT}`);
  console.log(`Serving static from: ${staticDir}`);
  console.log(`GHL Location: ${LOCATION_ID || 'not-set'}`);
});
