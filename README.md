# CEO Test App

A small React app for executive testing of the AI leasing agent. Pairs with the
Go `ceo-test-server` binary (deployed separately on Render).

## What it does

- Lets you pick a team + lead (by ID or phone) and chat as that lead
- Saves messages to the real `sms.messages` collection (so chat history persists)
- Calls the Go AI generator to produce replies
- Optional "verbose" mode reveals the full system prompt being sent
- Optional "send as human" toggle for HITL testing

## Local development

```bash
cd ceo-test-app
npm install
cp .env.example .env
# Edit .env with your local Go server URL and secret
npm run dev
```

The dev server runs on http://localhost:5173 and proxies `/v1/*` to your local
Go server at http://localhost:8080.

## Building

```bash
npm run build
```

Outputs to `dist/`.

## Deploying to Vercel

1. Connect this repo to Vercel
2. Set the root directory to `ceo-test-app`
3. Framework: Vite (auto-detected)
4. Set the env vars in the Vercel dashboard:
   - `VITE_GO_BACKEND_URL` — the URL of your Render-deployed Go server
   - `VITE_INTERNAL_SECRET` — the shared secret matching the Go server's `INTERNAL_SECRET`
5. Deploy

## Deploying the Go server to Render

See the parent `rentbamboo-com-charles-api` repo. The Go binary is at
`cmd/ceo-test-server`. Build with:

```bash
go build -o ceo-test-server ./cmd/ceo-test-server
```

Render env vars needed:
- `MONGODB_URI` — MongoDB connection string
- `DEEPSEEK_API_KEY` — DeepSeek API key
- `MONGODB_DATABASE` — `sms` (or wherever the messages collection lives)
- `INTERNAL_SECRET` — must match the Vercel `VITE_INTERNAL_SECRET`
- `PORT` — Render sets this automatically

## Notes

- **No auth** — anyone with the URL can chat as any lead. The user explicitly
  requested this for executive testing.
- **Writes to real `sms.messages` collection** — by the user's explicit request.
  The CEO's test messages will appear in the production chat history.
- **Render free tier cold starts** — first request after idle may take 30+ seconds.
  This is normal for free Render.
