import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function GET() {
  const steps: string[] = [];
  try {
    steps.push('importing @sparticuz/chromium');
    const chromium = (await import('@sparticuz/chromium')).default;
    steps.push('imported chromium');

    steps.push('getting executablePath');
    const executablePath = await chromium.executablePath();
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
