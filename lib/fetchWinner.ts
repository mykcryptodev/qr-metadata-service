import type { QRDailyLinkResponse, QRDailyLinkWinner } from './types';

const WINNERS_ENDPOINT = 'https://qrcoin.fun/api/winners';

export async function fetchCurrentWinner(): Promise<QRDailyLinkWinner | null> {
  const res = await fetch(WINNERS_ENDPOINT, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as QRDailyLinkResponse;
  if (!body.success || body.data.length === 0) return null;
  return body.data[0];
}
