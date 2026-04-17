import { fetchOg } from '@/lib/fetchOg';
import { fetchCurrentWinner } from '@/lib/fetchWinner';

export const revalidate = 3600;

export default async function Home() {
  const winner = await fetchCurrentWinner();
  const og = winner
    ? await fetchOg(winner.url)
    : { og: { image: null, title: null, description: null }, source: 'none' as const };

  return (
    <main className="mx-auto max-w-2xl p-8 font-mono text-sm">
      <h1 className="mb-4 text-xl font-bold">QR Daily Link — current winner</h1>
      {winner ? (
        <>
          <p>
            <strong>URL:</strong>{' '}
            <a className="text-blue-600 underline" href={winner.url}>
              {winner.url}
            </a>
          </p>
          <p>
            <strong>Winner:</strong>{' '}
            {winner.basename ??
              winner.display_name ??
              winner.ens_name ??
              winner.farcaster_username ??
              winner.twitter_username ??
              winner.winner_address}
          </p>
          <p>
            <strong>OG source:</strong> {og.source}
          </p>
          <p>
            <strong>OG title:</strong> {og.og.title ?? '—'}
          </p>
          {og.og.image ? (
            <img
              alt="og:image"
              className="mt-4 w-full rounded-lg"
              src={og.og.image}
            />
          ) : (
            <p className="mt-4 italic">no og:image resolved</p>
          )}
        </>
      ) : (
        <p>No winner available right now.</p>
      )}
      <p className="mt-8 text-xs text-gray-500">
        Machine-readable endpoint:{' '}
        <a className="underline" href="/api/qr-winner">
          /api/qr-winner
        </a>
      </p>
    </main>
  );
}
