/**
 * API Route: Sync Portfolio from Robinhood
 * GET /api/portfolio/sync
 *
 * This serverless function connects to Robinhood and returns your live portfolio
 */

import { NextResponse } from 'next/server';
import { getRobinhoodService } from '@/lib/services/robinhood-service';

export async function GET(request: Request) {
  try {
    const robinhood = getRobinhoodService();

    // Check if credentials are configured
    if (!robinhood.hasCredentials()) {
      return NextResponse.json({
        error: 'Robinhood credentials not configured',
        message: 'Please add ROBINHOOD_USERNAME and ROBINHOOD_PASSWORD to environment variables',
      }, { status: 400 });
    }

    // Fetch portfolio from Robinhood
    console.log('Fetching portfolio from Robinhood...');
    const portfolio = await robinhood.getPortfolio();

    // Transform to our Position format
    const positions = portfolio.positions.map(pos => ({
      symbol: pos.symbol,
      shares: pos.quantity,
      costBasis: pos.averageBuyPrice,
      currentPrice: pos.currentPrice,
      currentValue: pos.equity,
      gainLoss: pos.equity - (pos.quantity * pos.averageBuyPrice),
      dayChange: pos.equity - pos.equityPreviousClose,
    }));

    return NextResponse.json({
      success: true,
      account: {
        totalValue: portfolio.account.portfolioValue,
        totalGainLoss: portfolio.account.totalReturn,
        totalGainLossPercent: portfolio.account.totalReturnPercent,
        dayChange: portfolio.account.dayChange,
        dayChangePercent: portfolio.account.dayChangePercent,
        buyingPower: portfolio.account.buyingPower,
      },
      positions,
      recentOrders: portfolio.recentOrders,
      lastSync: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Robinhood sync error:', error);

    // Check for 2FA requirement
    if (error.message?.includes('mfa') || error.message?.includes('2FA')) {
      return NextResponse.json({
        error: 'Two-factor authentication required',
        message: 'Please disable 2FA on Robinhood or contact support for alternative integration',
      }, { status: 401 });
    }

    return NextResponse.json({
      error: 'Failed to sync with Robinhood',
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
