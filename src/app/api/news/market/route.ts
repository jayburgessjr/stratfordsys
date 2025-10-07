import { NextResponse } from 'next/server';
import { getMarketNews } from '@/lib/server/news';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topics = Array.isArray(body?.topics) ? body.topics.map((topic: any) => String(topic)) : [];
    const limit =
      typeof body?.limit === 'number'
        ? body.limit
        : Math.max(1, Math.min(50, Number(body?.limit) || 10));

    const articles = await getMarketNews(topics, limit);
    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Market news API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch market news';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
