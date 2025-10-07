import { NextResponse } from 'next/server';
import { analyzeStock } from '@/lib/server/openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol, currentPrice, change, volume, additionalData } = body ?? {};

    if (!symbol || typeof currentPrice !== 'number' || typeof change !== 'number' || typeof volume !== 'number') {
      return NextResponse.json(
        { error: 'symbol, currentPrice, change, and volume are required.' },
        { status: 400 }
      );
    }

    const result = await analyzeStock({
      symbol: String(symbol).toUpperCase(),
      currentPrice,
      change,
      volume,
      additionalData,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI analyzeStock error:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze stock.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
