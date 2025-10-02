/**
 * API Route: Complete E*TRADE OAuth Flow
 * POST /api/etrade/callback
 *
 * Completes OAuth authentication with verification code
 */

import { NextResponse } from 'next/server';
import { getETradeService } from '@/lib/services/etrade-service';

export async function POST(request: Request) {
  try {
    const { verifierCode } = await request.json();

    if (!verifierCode) {
      return NextResponse.json({
        error: 'Verification code required',
        message: 'Please provide the verification code from E*TRADE',
      }, { status: 400 });
    }

    const etrade = getETradeService();

    // Complete OAuth with verification code
    await etrade.completeOAuth(verifierCode);

    // Get access token for session storage
    const accessToken = etrade.getAccessToken();

    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      accessToken,
    });

  } catch (error: any) {
    console.error('E*TRADE OAuth callback error:', error);

    return NextResponse.json({
      error: 'Failed to complete authentication',
      message: error.message || 'Unknown error occurred',
    }, { status: 500 });
  }
}

// Support OPTIONS for CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
