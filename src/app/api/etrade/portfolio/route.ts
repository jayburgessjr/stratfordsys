/**
 * API Route: Get E*TRADE Portfolio
 * GET /api/etrade/portfolio
 *
 * Fetches complete portfolio data from E*TRADE
 */

import { NextResponse } from 'next/server';
import { getETradeService } from '@/lib/services/etrade-service';

export async function GET(request: Request) {
  try {
    const etrade = getETradeService();

    // Check if authenticated
    if (!etrade.isAuth()) {
      return NextResponse.json({
        error: 'Not authenticated',
        message: 'Please complete OAuth authentication first',
      }, { status: 401 });
    }

    // Fetch portfolio from E*TRADE
    const portfolio = await etrade.getPortfolio();

    // Transform to our Position format
    const positions = portfolio.positions.map(pos => ({
      symbol: pos.symbol,
      name: pos.symbolDescription,
      shares: pos.quantity,
      costBasis: pos.pricePaid,
      currentPrice: pos.currentPrice,
      currentValue: pos.marketValue,
      gainLoss: pos.totalGain,
      gainLossPercent: pos.totalGainPct,
      dayChange: pos.daysGain,
      dayChangePercent: pos.daysGainPct,
    }));

    return NextResponse.json({
      success: true,
      account: {
        accountId: portfolio.account.accountId,
        totalValue: portfolio.account.portfolioValue,
        totalGainLoss: portfolio.account.totalReturn,
        totalGainLossPercent: portfolio.account.totalReturnPct,
        dayChange: portfolio.account.dayChange,
        dayChangePercent: portfolio.account.dayChangePct,
        buyingPower: portfolio.account.buyingPower,
        cashBalance: portfolio.account.cashBalance,
      },
      positions,
      lastSync: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('E*TRADE portfolio error:', error);

    return NextResponse.json({
      error: 'Failed to fetch portfolio',
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
