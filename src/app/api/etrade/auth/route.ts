/**
 * API Route: Initiate E*TRADE OAuth Flow
 * GET /api/etrade/auth
 *
 * Starts the OAuth 2.0 authentication flow with E*TRADE
 * Returns authorization URL for user to visit
 */

import { NextResponse } from 'next/server';
import { getETradeService } from '@/lib/services/etrade-service';

export async function GET(request: Request) {
  try {
    const etrade = getETradeService();

    // Check if credentials are configured
    if (!etrade.hasCredentials()) {
      return NextResponse.json({
        error: 'E*TRADE credentials not configured',
        message: 'Please add ETRADE_CONSUMER_KEY and ETRADE_CONSUMER_SECRET to environment variables',
      }, { status: 400 });
    }

    // Initiate OAuth flow and get authorization URL
    const authUrl = await etrade.initiateOAuth();

    return NextResponse.json({
      success: true,
      authUrl,
      message: 'Visit the authorization URL to complete authentication',
      instructions: [
        '1. Visit the authorization URL',
        '2. Log in to your E*TRADE account',
        '3. Approve the application',
        '4. Copy the verification code',
        '5. Return to the app and enter the code',
      ],
    });

  } catch (error: any) {
    console.error('E*TRADE OAuth initiation error:', error);

    return NextResponse.json({
      error: 'Failed to initiate OAuth',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
