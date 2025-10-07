import { NextResponse } from 'next/server';
import { getTickerNews } from '@/lib/server/news';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tickers = Array.isArray(body?.tickers)
      ? body.tickers.map((ticker: any) => String(ticker).toUpperCase())
      : [];

    if (!tickers.length) {
      return NextResponse.json({ error: 'tickers array is required.' }, { status: 400 });
    }

    const limit =
      typeof body?.limit === 'number'
        ? body.limit
        : Math.max(1, Math.min(50, Number(body?.limit) || 5));

    const articles = await getTickerNews(tickers, limit);
    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Ticker news API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch ticker news';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
