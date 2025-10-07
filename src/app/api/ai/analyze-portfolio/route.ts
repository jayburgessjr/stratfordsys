import { NextResponse } from 'next/server';
import { analyzePortfolio } from '@/lib/server/openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { positions, totalValue } = body ?? {};

    if (!Array.isArray(positions) || typeof totalValue !== 'number') {
      return NextResponse.json(
        { error: 'positions (array) and totalValue (number) are required.' },
        { status: 400 }
      );
    }

    const sanitizedPositions = positions
      .map((position: any) => ({
        symbol: String(position.symbol || '').toUpperCase(),
        shares: Number(position.shares) || 0,
        avgCost: Number(position.avgCost) || 0,
        currentPrice: Number(position.currentPrice) || 0,
      }))
      .filter((position) => position.symbol && position.shares > 0);

    if (sanitizedPositions.length === 0) {
      return NextResponse.json({ error: 'At least one valid position is required.' }, { status: 400 });
    }

    const result = await analyzePortfolio({
      positions: sanitizedPositions,
      totalValue,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI analyzePortfolio error:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze portfolio.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
