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

async function fetchPlaywright(url: string): Promise<OgMetadata | null> {
  try {
    const chromium = (await import('@sparticuz/chromium')).default;
    const { chromium: pw } = await import('playwright-core');

    const executablePath = await chromium.executablePath();
    console.log('[playwright] executablePath:', executablePath);

    const browser = await pw.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

      const og = await page.evaluate(() => {
        const getMeta = (prop: string) =>
          document.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ??
          document.querySelector(`meta[name="${prop}"]`)?.getAttribute('content') ??
          null;
        return {
          image: getMeta('og:image'),
          title: getMeta('og:title') ?? document.title ?? null,
          description: getMeta('og:description'),
        };
      });

      if (!og.image && !og.title) return null;
      return {
        image: og.image,
        title: og.title?.trim() ?? null,
        description: og.description?.trim() ?? null,
      };
    } finally {
      await browser.close();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[playwright] error:', msg);
    return null;
  }
}

export async function fetchOg(
  url: string,
): Promise<{ og: OgMetadata; source: 'microlink' | 'direct' | 'playwright' | 'none' }> {
  const direct = await fetchDirect(url);
  if (direct && (direct.image || direct.title)) {
    return { og: direct, source: 'direct' };
  }

  const micro = await fetchMicrolink(url);
  if (micro && (micro.image || micro.title)) {
    return { og: micro, source: 'microlink' };
  }

  const playwright = await fetchPlaywright(url);
  if (playwright && (playwright.image || playwright.title)) {
    return { og: playwright, source: 'playwright' };
  }

  return {
    og: { image: null, title: null, description: null },
    source: 'none',
  };
}
