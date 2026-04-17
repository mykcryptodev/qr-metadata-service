import { NextResponse } from 'next/server';

import { fetchOg } from '@/lib/fetchOg';
import { fetchCurrentWinner } from '@/lib/fetchWinner';
import type { QRWinnerApiResponse } from '@/lib/types';

export const revalidate = 3600;

const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Cache-Control': CACHE_CONTROL,
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const winner = await fetchCurrentWinner();

  if (!winner) {
    const body: QRWinnerApiResponse = {
      winner: null,
      og: { image: null, title: null, description: null },
      source: 'none',
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(body, { headers: CORS_HEADERS });
  }

  const { og, source } = await fetchOg(winner.url);

  const body: QRWinnerApiResponse = {
    winner,
    og,
    source,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(body, { headers: CORS_HEADERS });
}
