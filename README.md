# qr-metadata-service

A tiny Next.js service that fetches the current [QR Daily Link](https://qrcoin.fun) winner and resolves its Open Graph metadata using a JS-executing strategy (Microlink API with a plain-fetch fallback). Results are cached via Next.js ISR for ~1 hour.

## Endpoint

```
GET /api/qr-winner
```

**Response schema:**

```ts
{
  winner: { id, token_id, winner_address, amount, url, display_name, ... } | null;
  og: { image: string | null; title: string | null; description: string | null };
  source: 'microlink' | 'direct' | 'none';
  fetchedAt: string; // ISO 8601
}
```

**HTTP contract:**

- `200` always; `winner: null` when upstream has no winner.
- `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`
- `Access-Control-Allow-Origin: *`

**Live endpoint:** `https://qr-metadata-service.vercel.app/api/qr-winner`

**Example:**

```bash
curl -s https://qr-metadata-service.vercel.app/api/qr-winner | jq .
```

## Caching

Next.js ISR revalidates once per hour. With one winner per day the entire user base is served from a single upstream fetch.

## Run locally

```bash
npm install
npm run dev
# Visit http://localhost:3000 for the debug UI
# curl http://localhost:3000/api/qr-winner
```
