import { NextResponse } from 'next/server';

export const maxDuration = 30;

const CHROMIUM_BINARY_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.tar';

export async function GET() {
  const steps: string[] = [];
  try {
    steps.push('importing @sparticuz/chromium-min');
    const chromium = (await import('@sparticuz/chromium-min')).default;
    steps.push('imported chromium-min');

    steps.push('getting executablePath');
    const executablePath = await chromium.executablePath(CHROMIUM_BINARY_URL);
    steps.push(`executablePath: ${executablePath}`);

    steps.push('importing playwright-core');
    const { chromium: pw } = await import('playwright-core');
    steps.push('imported playwright-core');

    steps.push('launching browser');
    const browser = await pw.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });
    steps.push('browser launched');

    const page = await browser.newPage();
    steps.push('page created');

    await page.goto('https://example.com', { waitUntil: 'domcontentloaded', timeout: 10000 });
    const title = await page.title();
    steps.push(`page title: ${title}`);

    await browser.close();
    steps.push('browser closed');

    return NextResponse.json({ ok: true, steps });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      steps,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
