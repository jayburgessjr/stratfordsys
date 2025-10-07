import { NextResponse } from 'next/server';
import { generateStrategy } from '@/lib/server/openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { goals, riskTolerance, capital, preferredAssets } = body ?? {};

    if (!goals || typeof goals !== 'string') {
      return NextResponse.json({ error: 'goals is required.' }, { status: 400 });
    }

    const capitalNumber = typeof capital === 'number' ? capital : Number(capital);
    if (Number.isNaN(capitalNumber)) {
      return NextResponse.json({ error: 'capital must be a number.' }, { status: 400 });
    }

    const assetsArray: string[] = Array.isArray(preferredAssets)
      ? preferredAssets.map((asset: unknown) => String(asset).toUpperCase())
      : typeof preferredAssets === 'string'
        ? preferredAssets
            .split(',')
            .map((asset) => asset.trim().toUpperCase())
            .filter(Boolean)
        : [];

    const result = await generateStrategy({
      goals: goals.trim(),
      riskTolerance: ['LOW', 'MEDIUM', 'HIGH'].includes(riskTolerance)
        ? riskTolerance
        : 'MEDIUM',
      capital: capitalNumber,
      preferredAssets: assetsArray,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI generateStrategy error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate AI strategy.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
