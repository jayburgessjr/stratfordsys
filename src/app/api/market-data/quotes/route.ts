import { NextResponse } from 'next/server';
import { getQuotes } from '@/lib/server/market-data';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbols } = body ?? {};

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({ error: 'symbols array is required.' }, { status: 400 });
    }

    const uniqueSymbols = Array.from(
      new Set(
        symbols
          .map((symbol: unknown) => (typeof symbol === 'string' ? symbol.toUpperCase().trim() : null))
          .filter((symbol): symbol is string => !!symbol)
      )
    );

    const quotes = await getQuotes(uniqueSymbols);
    return NextResponse.json({ quotes });
  } catch (error) {
    console.error('Market data API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch market data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
