# LHH-26: VPS Research for iPad PWA Hosting

## Context

The L&H iPad PWA currently uses:
- **Vercel** (free tier) for the React static frontend
- **Railway** ($5-20/mo) for the Express BFF proxy to GHL

This works but splits hosting across two providers with limited headroom.
We have `deploy-combined.js` which packages both into a single Express server — one deployable unit ready for a VPS.

## Requirements

- Single-server deployment (frontend static files + Express BFF)
- Node.js runtime
- SSL/TLS (Let's Encrypt or provider-managed)
- Low monthly cost (<$15-20/mo target)
- US datacenter near Toledo/Great Lakes region (low latency)
- Simple management (small team, no dedicated ops)
- Ability to set DNS/CNAME for custom domain

## Providers Compared

### 1. DigitalOcean — Basic Droplet ($6/mo)

| Plan        | vCPU | RAM  | SSD  | Transfer | Price  |
|-------------|------|------|------|----------|--------|
| Basic $6    | 1    | 1 GB | 25 GB| 1 TB     | $6/mo  |
| Basic $12   | 1    | 2 GB | 50 GB| 2 TB     | $12/mo |
| Basic $24   | 2    | 4 GB | 80 GB| 4 TB     | $24/mo |

- **US datacenters**: New York (NYC), San Francisco (SFO), Toronto (YTO)
- NYC datacenter is closest to Toledo (~500mi, ~10ms latency)
- Simple control panel, large community, many tutorials
- Managed backups: 20% of Droplet cost
- Requires manual Node.js + nginx setup (or 1-click app)
- **Upside**: Familiar, well-documented, predictable pricing
- **Downside**: No Node.js 1-click, need to configure yourself

### 2. Akamai (Linode) — Shared CPU Nanode ($5/mo)

| Plan        | vCPU | RAM  | SSD  | Transfer | Price  |
|-------------|------|------|------|----------|--------|
| Nanode 1 GB | 1    | 1 GB | 25 GB| 1 TB     | $5/mo  |
| Linode 2 GB | 1    | 2 GB | 50 GB| 2 TB     | $12/mo |
| Linode 4 GB | 2    | 4 GB | 80 GB| 4 TB     | $24/mo |

- **US datacenters**: Newark (EWR), Atlanta (ATL), Dallas (DFW), Fremont (FRA)
- Newark is closest to Toledo (~500mi)
- Great documentation, StackScripts for automation
- NodeBalancer for $10/mo if scaling needed later
- **Upside**: Cheap entry point, good US east coast presence
- **Downside**: Legacy hardware on Nanode; G8 dedicated starts at $45/mo

### 3. Hetzner — Regular Performance CPX (€3-4/mo)

| Plan        | vCPU | RAM  | SSD  | Transfer    | Price    |
|-------------|------|------|------|-------------|----------|
| CPX11       | 2    | 2 GB | 40 GB| 20 TB       | ~$3.50/mo |
| CPX21       | 3    | 4 GB | 80 GB| 20 TB       | ~$6.50/mo |
| CPX31       | 4    | 8 GB | 160GB| 20 TB       | ~$12/mo   |

- **US datacenters**: Ashburn, VA (us-east); Hillsboro, OR (us-west)
- Ashburn is excellent for Toledo (~450mi, ~8ms)
- By far the best price/performance ratio
- Generous included traffic (20 TB)
- Hourly billing with monthly cap
- **Upside**: Cheapest, best specs for the money, US east coast presence
- **Downside**: Less US name recognition, interface is not as polished
- **Caveat**: Prices shown were ≈€3-12/mo; US pricing may differ slightly

### 4. Vultr — Cloud Compute Regular Performance ($5/mo)

| Plan          | vCPU | RAM  | SSD  | Transfer | Price  |
|---------------|------|------|------|----------|--------|
| $5 Regular    | 1    | 1 GB | 25 GB| 1 TB     | $5/mo  |
| $12 Regular   | 1    | 2 GB | 55 GB| 2 TB     | $12/mo |
| $24 Regular   | 2    | 4 GB | 80 GB| 4 TB     | $24/mo |

- **US datacenters**: New York, New Jersey, Chicago, Atlanta, Dallas, Seattle, Los Angeles, Miami
- **Chicago is the best option** — closest to Toledo (~230mi, ~5ms)
- Hourly billing, many OS options, one-click apps
- VX1 (modern) instances at $0.060/hr (~$43/mo for 8 GB) — newer but pricier
- **Upside**: Most US datacenter locations, Chicago datacenter is ideal for Toledo
- **Downside**: Mid-range pricing; premium instances (AMD/Intel) cost more

## Recommendation

**Vultr Regular Performance ($10-12/mo plan)** is the best choice for L&H:

| Reason | Detail |
|--------|--------|
| **Latency** | Chicago datacenter is ~230mi from Toledo — fastest option available |
| **Price** | $10-12/mo for 1 vCPU, 2 GB RAM, 55 GB SSD, 2 TB transfer |
| **Simplicity** | One-click Ubuntu deployment; then `apt install nodejs nginx certbot` |
| **Headroom** | 2 GB RAM is plenty for a Node.js Express server serving static files |
| **Solo deploy** | No need for Kubernetes, load balancers, or complex infra |

**Setup plan for Vultr:**
1. Deploy Ubuntu 22.04 LTS in Chicago (1 GB RAM / $6/mo or 2 GB / $12/mo)
2. Install Node.js 20 LTS, nginx, certbot (Let's Encrypt SSL)
3. Deploy combined app via `git pull && npm ci && npm run build && pm2 start deploy-combined.js`
4. Configure nginx as reverse proxy with SSL termination
5. Point custom domain (e.g., app.lhlh.solutions) at VPS IP

**Runner-up**: DigitalOcean at $12/mo (NYC datacenter) — nearly as good, more familiar tooling.

## Cost Comparison Summary

| Provider | Monthly Cost (recommended plan) | Latency to Toledo | Ease of Setup |
|----------|-------------------------------|-------------------|---------------|
| Vultr    | $10-12/mo                     | ★★★★★ (Chicago)   | ★★★★☆         |
| DigitalOcean | $12/mo                    | ★★★★☆ (NYC)      | ★★★★★         |
| Hetzner  | ~$3.50-6.50/mo               | ★★★★☆ (Ashburn)  | ★★★☆☆         |
| Linode   | $5-12/mo                      | ★★★★☆ (Newark)   | ★★★★☆         |

## What We Save

- Current: Vercel (free) + Railway ($5-20/mo) = **$5-20/mo split across providers**
- Proposed: Single VPS at **$10-12/mo** = consolidated, same or lower cost
- Plus: Full control, no provider lock-in, easier debugging, ability to add cron jobs or background workers later

## Next Steps

1. [ ] CEO signs off on Vultr as provider (or alternate choice)
2. [ ] Create account at Vultr, set up Chicago VPS
3. [ ] Write deployment playbook / Ansible script for repeatable setup
4. [ ] Migrate DNS to point at VPS
5. [ ] Deploy combined app, verify all 7 PWA features still work
6. [ ] Shut down Vercel + Railway deployments
