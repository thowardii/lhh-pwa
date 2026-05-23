# L&H Home Solutions — iPad PWA

Production frontend: https://lhh-pwa.vercel.app
Production BFF: https://lhh-bff.up.railway.app

## Architecture

[iPad Safari] → [Vercel (static PWA)] → [Railway (Express BFF)] → [GHL API]

## Structure

```
lhh-pwa/
├── bff/          # Express proxy server (Railway)
│   ├── server.js
│   └── package.json
└── frontend/     # React + Vite PWA (Vercel)
    ├── src/
    │   ├── pages/         # 7 page components
    │   ├── components/    # Layout, shared
    │   └── services/      # GHL API client
    ├── vite.config.js
    └── package.json
```

## Development

```bash
# BFF
cd bff
cp .env.example .env  # edit with GHL_API_KEY
npm run dev

# Frontend (separate terminal)
cd frontend
cp .env.example .env  # edit with VITE_GHL_LOCATION_ID
npm run dev
```

## Deployment

- Frontend: `cd frontend && npm run build` → deploy `dist/` to Vercel
- BFF: `cd bff` → deploy to Railway with `GHL_API_KEY` and `GHL_LOCATION_ID` env vars

## Features

1. **Dashboard** — today's jobs / upcoming appointments
2. **Contact Lookup** — search by name/phone, view/edit, add tags, upsert
3. **Add Contact** — quick-add with address
4. **Job Scoping** — create/update pipeline opportunities with contact linking
5. **Send Invoice** — create invoice, send via email or SMS, line items
6. **Payment Link** — create invoice + SMS payment link to customer
7. **Photo Capture** — iPad camera capture, upload to GHL media library
