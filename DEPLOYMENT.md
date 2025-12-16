# Deployment Guide - Market Insights AI Frontend

## Vercel Deployment

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository connected to Vercel

### Step 1: Connect Repository

1. Go to Vercel Dashboard → Add New Project
2. Import from GitHub: `patelyakshit/lm-marketinsights-fe`
3. Framework Preset: Vite (auto-detected)
4. Build Command: `npm run build`
5. Output Directory: `dist`

### Step 2: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

```bash
# ============================================
# REQUIRED - Backend Connection
# ============================================
# Replace with your Railway backend URL
VITE_SOCKET_BASE=wss://your-railway-app.up.railway.app/ws
VITE_SOCKET_VOICE=wss://your-railway-app.up.railway.app/ws/audio
VITE_API_BASE_URL=https://your-railway-app.up.railway.app

# ============================================
# REQUIRED - ArcGIS Configuration
# ============================================
VITE_ARCGIS_API_KEY=your_arcgis_api_key
VITE_DEFAULT_WEBMAP_ID=your_webmap_id
VITE_CURATED_LAYERS_ID=your_curated_layers_group_id
VITE_ARCGIS_LIVING_ATLAS_ID=47dd57c9a59d458c86d3d6b978560088

# ============================================
# REQUIRED - Widget Configuration
# ============================================
VITE_WIDGET_ID=your_widget_id

# ============================================
# OPTIONAL - Sentry Error Tracking
# ============================================
VITE_SENTRY_DSN=your_sentry_dsn
VITE_ENABLE_SENTRY=true
VITE_SENTRY_ENV=production

# ============================================
# APPLICATION SETTINGS
# ============================================
VITE_APP_ENV=production
```

### Step 3: Deploy

Vercel auto-deploys on push to connected branch.

### Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS as instructed

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SOCKET_BASE` | Yes | WebSocket URL for chat |
| `VITE_SOCKET_VOICE` | Yes | WebSocket URL for voice |
| `VITE_API_BASE_URL` | Yes | Backend API URL |
| `VITE_ARCGIS_API_KEY` | Yes | ArcGIS API key |
| `VITE_DEFAULT_WEBMAP_ID` | Yes | Default web map ID |
| `VITE_WIDGET_ID` | Yes | Widget identifier |
| `VITE_SENTRY_DSN` | No | Sentry error tracking |
| `VITE_ENABLE_SENTRY` | No | Enable/disable Sentry |

---

## Troubleshooting

### Build Fails
- Check Node.js version (requires 18+)
- Run `npm install` locally to verify dependencies
- Check for TypeScript errors: `npm run build`

### Blank Page After Deploy
- Verify `vercel.json` rewrites are correct
- Check browser console for errors
- Ensure environment variables are set

### WebSocket Connection Failed
- Verify backend is running on Railway
- Check VITE_SOCKET_BASE uses `wss://` for HTTPS
- Verify CORS is configured on backend

### Map Not Loading
- Verify VITE_ARCGIS_API_KEY is valid
- Check VITE_DEFAULT_WEBMAP_ID exists
- Verify ArcGIS API key has correct permissions

---

## Local Development

```bash
# Install dependencies
npm install

# Create .env from example
cp .env.example .env

# Edit .env with your values
# For local development, use:
# VITE_SOCKET_BASE=ws://localhost:8000/ws
# VITE_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
```
