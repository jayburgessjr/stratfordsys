import { NextResponse } from 'next/server';
import { chat } from '@/lib/server/openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, context } = body ?? {};

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required.' }, { status: 400 });
    }

    const result = await chat({ userMessage: message, context });
    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI chat error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process AI chat request.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
