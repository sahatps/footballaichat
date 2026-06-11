This is a production-oriented [Next.js](https://nextjs.org) App Router project for a football dashboard, shared AI chat orchestration, and a LINE reply bot flow on Vercel.

## Features

- Public read-only football dashboard with live fixtures and standings
- Match detail page with timeline and key stats
- Web chat calling a shared orchestration layer
- LINE webhook endpoint for text replies
- API-Football proxy endpoints
- z.ai integration with fallback summaries when credentials are unavailable
- In-memory context plus optional Postgres persistence via `DATABASE_URL`
- Vitest coverage for prompting, language detection, web chat, and LINE webhook flows

## Getting Started

Copy `.env.example` to `.env.local` and fill in the providers you want to enable.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

```bash
API_FOOTBALL_KEY=
ZAI_API_KEY=
ZAI_MODEL=glm-4.7
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
DATABASE_URL=
```

If `API_FOOTBALL_KEY` or `ZAI_API_KEY` are omitted, the app still runs with mock football data and deterministic fallback answers so the UI and tests stay usable.

## API Routes

- `GET /api/football/live`
- `GET /api/football/match/:id`
- `GET /api/football/standings?league=39&season=2025`
- `POST /api/chat`
- `POST /api/line/webhook`
- `GET /api/health`

## Testing

```bash
npm run test
```
