#!/usr/bin/env bash
set -euo pipefail

echo "=== L&H iPad PWA — Deployment Script ==="
echo ""

# --- Frontend (Vercel) ---
echo "--- Deploying frontend to Vercel ---"
cd "$(dirname "$0")/frontend"

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "ERROR: VERCEL_TOKEN not set."
  echo "Get a token at https://vercel.com/account/tokens"
  echo "Then run: VERCEL_TOKEN=xxx ./deploy.sh"
  exit 1
fi

npm ci
npm run build

npx vercel --prod --token="$VERCEL_TOKEN" --yes
echo "Frontend deployed!"

# --- BFF (Railway) ---
echo ""
echo "--- Deploying BFF to Railway ---"
cd "$(dirname "$0")/bff"

if [ -z "${RAILWAY_TOKEN:-}" ]; then
  echo "NOTE: RAILWAY_TOKEN not set. Manual Railway deploy required."
  echo "Steps:"
  echo "  1. Install Railway CLI: npm i -g @railway/cli"
  echo "  2. railway login"
  echo "  3. cd bff && railway up"
  echo "  4. Set env vars: GHL_API_KEY, GHL_LOCATION_ID, BFF_PORT=3001"
  echo "  5. Set FRONTEND_URL to your Vercel URL"
  exit 0
fi

npm ci
railway up
echo "BFF deployed!"
