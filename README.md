# Lak Travelers

Sri Lanka-focused marketplace for hotels, tours, transport, community reviews, and AI-assisted itinerary planning.

## Local development

Requirements: Node.js 22+ and MongoDB.

The application is split into two clear parts:

```text
lak-travelers/
├── backend/   # Express, MongoDB, authentication, bookings, uploads, AI
└── frontend/  # React, Vite, pages, components, and browser UI
```

1. Copy `lak-travelers/backend/.env.example` to `lak-travelers/backend/.env` when a local env file does not already exist.
2. Copy `lak-travelers/frontend/.env.example` to `lak-travelers/frontend/.env` when needed.
3. Run `npm run install:all` from `lak-travelers`.
4. Start the API in one terminal with `npm run dev:backend`.
5. Start the web app in a second terminal with `npm run dev:frontend`.

## Verification

Backend (run from `lak-travelers/backend`):

```bash
npm run check
npm test
npm audit --omit=dev
```

Frontend (run from `lak-travelers/frontend`):

```bash
npm run lint
npm run build
npm audit --omit=dev
```

## Production checklist

- Rotate all credentials that were previously stored in tracked `.env` files.
- Configure `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`, and `ALLOWED_ORIGINS` in the hosting platform.
- Configure email, Cloudinary, Google OAuth, and Gemini credentials only when those features are enabled.
- Keep online payments disabled until gateway secrets and verified webhooks are configured.
- Deploy the API and client from their respective lockfiles using `npm ci`.
- Run the CI workflow before every release.

Never commit `.env`, uploaded identity documents, build output, or `node_modules`.

## Recommended deployment

### Backend on Render

Use the repository-root `render.yaml` Blueprint. Add the secret values requested by Render. After deployment, verify:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

Set `FRONTEND_URL` and `ALLOWED_ORIGINS` to the final Vercel URL. Multiple allowed origins must be comma-separated.

### Frontend on Vercel

Import the repository and set **Root Directory** to `lak-travelers/frontend`. Add:

```text
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

Redeploy the frontend after changing any `VITE_` value because Vite embeds these values at build time.

### Gemini chatbot

Add these only to the backend host environment:

```text
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.6-flash
```

Without `GEMINI_API_KEY`, the rest of the site remains available and the chatbot returns a clear configuration error instead of crashing the API.
