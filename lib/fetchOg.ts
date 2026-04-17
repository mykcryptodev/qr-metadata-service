import mql from '@microlink/mql';

import type { OgMetadata } from './types';

const BOT_PROTECTION_TITLES = [
  'vercel security checkpoint',
  'just a moment',
  'attention required',
  'access denied',
  'security check',
  'please wait',
  'checking your browser',
  'ddos protection',
];

const OG_IMAGE = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i;
const OG_IMAGE_ALT =
  /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i;
const OG_TITLE = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i;
const OG_TITLE_ALT =
  /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i;
const OG_DESC =
  /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i;
const HTML_TITLE = /<title[^>]*>([^<]+)<\/title>/i;

function isChallenge(title: string | null): boolean {
  if (!title) return false;
  const lower = title.trim().toLowerCase();
  return BOT_PROTECTION_TITLES.some((p) => lower.includes(p));
}

async function fetchDirect(url: string): Promise<OgMetadata | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const image = html.match(OG_IMAGE)?.[1] ?? html.match(OG_IMAGE_ALT)?.[1] ?? null;
    const title =
      html.match(OG_TITLE)?.[1] ??
      html.match(OG_TITLE_ALT)?.[1] ??
      html.match(HTML_TITLE)?.[1] ??
      null;
    const description = html.match(OG_DESC)?.[1] ?? null;

    if (isChallenge(title)) return null;
    if (!image && !title) return null;

    return {
      image,
      title: title?.trim() ?? null,
      description: description?.trim() ?? null,
    };
  } catch {
    return null;
  }
}

async function fetchMicrolink(url: string): Promise<OgMetadata | null> {
  try {
    const { data } = await mql(url, { meta: true });
    const image = typeof data.image === 'object' && data.image ? data.image.url : null;
    return {
      image: image ?? null,
      title: data.title ?? null,
      description: data.description ?? null,
    };
  } catch {
    return null;
  }
}

export async function fetchOg(
  url: string,
): Promise<{ og: OgMetadata; source: 'microlink' | 'direct' | 'none' }> {
  const direct = await fetchDirect(url);
  if (direct && (direct.image || direct.title)) {
    return { og: direct, source: 'direct' };
  }

  const micro = await fetchMicrolink(url);
  if (micro && (micro.image || micro.title)) {
    return { og: micro, source: 'microlink' };
  }

  return {
    og: { image: null, title: null, description: null },
    source: 'none',
  };
}
