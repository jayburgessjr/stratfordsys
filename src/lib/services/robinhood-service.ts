/**
 * Robinhood Integration Service
 * Syncs live trades, positions, and account data from your Robinhood account
 */

import Robinhood from 'robinhood';

export interface RobinhoodPosition {
  symbol: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  equity: number;
  equityPreviousClose: number;
  percentageChange: number;
  url: string;
  instrument: string;
}

export interface RobinhoodOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price: number;
  state: string;
  createdAt: Date;
  executedPrice?: number;
}

export interface RobinhoodAccount {
  accountNumber: string;
  buyingPower: number;
  cash: number;
  portfolioValue: number;
  totalEquity: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface RobinhoodPortfolio {
  account: RobinhoodAccount;
  positions: RobinhoodPosition[];
  recentOrders: RobinhoodOrder[];
}

class RobinhoodService {
  private client: any;
  private credentials: {
    username: string;
    password: string;
    mfaCode?: string;
  };
  private isAuthenticated = false;
  private authToken: string | null = null;

  constructor() {
    this.credentials = {
      username: process.env.NEXT_PUBLIC_ROBINHOOD_USERNAME || process.env.ROBINHOOD_USERNAME || '',
      password: process.env.NEXT_PUBLIC_ROBINHOOD_PASSWORD || process.env.ROBINHOOD_PASSWORD || '',
    };

    if (!this.credentials.username || !this.credentials.password) {
      console.warn('Robinhood credentials not found in environment variables');
    }

    this.client = Robinhood({
      username: this.credentials.username,
      password: this.credentials.password,
    }, () => { });
  }

  /**
   * Authenticate with Robinhood
   */
  async authenticate(mfaCode?: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const credentials = { ...this.credentials };
      if (mfaCode) {
        credentials.mfaCode = mfaCode;
      }

      this.client = Robinhood(credentials, (error: any, response: any, body: any) => {
        if (error) {
          console.error('Robinhood authentication error:', error);
          this.isAuthenticated = false;
          reject(error);
        } else {
          this.isAuthenticated = true;
          this.authToken = body?.access_token || null;
          console.log('Successfully authenticated with Robinhood');
          resolve(true);
        }
      });
    });
  }

  /**
   * Get account details
   */
  async getAccount(): Promise<RobinhoodAccount> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    return new Promise((resolve, reject) => {
      this.client.accounts((error: any, response: any, body: any) => {
        if (error) {
          console.error('Error fetching account:', error);
          reject(error);
          return;
        }

        const accountData = body.results?.[0];
        if (!accountData) {
          reject(new Error('No account data found'));
          return;
        }

        resolve({
          accountNumber: accountData.account_number,
          buyingPower: parseFloat(accountData.buying_power || '0'),
          cash: parseFloat(accountData.cash || '0'),
          portfolioValue: parseFloat(accountData.portfolio_cash || '0'),
          totalEquity: parseFloat(accountData.equity || '0'),
          totalReturn: 0, // Calculated from positions
          totalReturnPercent: 0,
          dayChange: 0,
          dayChangePercent: 0,
        });
      });
    });
  }

  /**
   * Get all positions
   */
  async getPositions(): Promise<RobinhoodPosition[]> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    return new Promise((resolve, reject) => {
      this.client.positions((error: any, response: any, body: any) => {
        if (error) {
          console.error('Error fetching positions:', error);
          reject(error);
          return;
        }

        const positions = body.results || [];
        const activePositions = positions.filter((p: any) => parseFloat(p.quantity) > 0);

        // Get instrument details for each position
        const positionPromises = activePositions.map((position: any) =>
          this.enrichPositionWithInstrument(position)
        );

        Promise.all(positionPromises)
          .then(enrichedPositions => resolve(enrichedPositions))
          .catch(reject);
      });
    });
  }

  /**
   * Enrich position with instrument details (symbol, name)
   */
  private async enrichPositionWithInstrument(position: any): Promise<RobinhoodPosition> {
    return new Promise((resolve) => {
      this.client.url(position.instrument, (error: any, response: any, instrument: any) => {
        const quantity = parseFloat(position.quantity || '0');
        const averageBuyPrice = parseFloat(position.average_buy_price || '0');
        const currentPrice = parseFloat(instrument?.quote?.last_trade_price || averageBuyPrice);
        const equity = quantity * currentPrice;
        const equityPreviousClose = quantity * parseFloat(instrument?.quote?.previous_close || currentPrice);
        const percentageChange = equityPreviousClose > 0
          ? ((equity - equityPreviousClose) / equityPreviousClose) * 100
          : 0;

        resolve({
          symbol: instrument?.symbol || 'UNKNOWN',
          quantity,
          averageBuyPrice,
          currentPrice,
          equity,
          equityPreviousClose,
          percentageChange,
          url: position.url,
          instrument: position.instrument,
        });
      });
    });
  }

  /**
   * Get recent orders
   */
  async getOrders(limit: number = 10): Promise<RobinhoodOrder[]> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    return new Promise((resolve, reject) => {
      this.client.orders((error: any, response: any, body: any) => {
        if (error) {
          console.error('Error fetching orders:', error);
          reject(error);
          return;
        }

        const orders = body.results || [];
        const recentOrders = orders.slice(0, limit);

        const orderPromises = recentOrders.map((order: any) =>
          this.enrichOrderWithInstrument(order)
        );

        Promise.all(orderPromises)
          .then(enrichedOrders => resolve(enrichedOrders))
          .catch(reject);
      });
    });
  }

  /**
   * Enrich order with instrument details
   */
  private async enrichOrderWithInstrument(order: any): Promise<RobinhoodOrder> {
    return new Promise((resolve) => {
      this.client.url(order.instrument, (error: any, response: any, instrument: any) => {
        resolve({
          id: order.id,
          symbol: instrument?.symbol || 'UNKNOWN',
          side: order.side,
          type: order.type,
          quantity: parseFloat(order.quantity || '0'),
          price: parseFloat(order.price || '0'),
          state: order.state,
          createdAt: new Date(order.created_at),
          executedPrice: order.average_price ? parseFloat(order.average_price) : undefined,
        });
      });
    });
  }

  /**
   * Get complete portfolio snapshot
   */
  async getPortfolio(): Promise<RobinhoodPortfolio> {
    try {
      const [account, positions, recentOrders] = await Promise.all([
        this.getAccount(),
        this.getPositions(),
        this.getOrders(20),
      ]);

      // Calculate total returns
      const totalCost = positions.reduce((sum, p) => sum + (p.quantity * p.averageBuyPrice), 0);
      const totalValue = positions.reduce((sum, p) => sum + p.equity, 0);
      const totalReturn = totalValue - totalCost;
      const totalReturnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;

      // Calculate day change
      const previousValue = positions.reduce((sum, p) => sum + p.equityPreviousClose, 0);
      const dayChange = totalValue - previousValue;
      const dayChangePercent = previousValue > 0 ? (dayChange / previousValue) * 100 : 0;

      account.totalReturn = totalReturn;
      account.totalReturnPercent = totalReturnPercent;
      account.dayChange = dayChange;
      account.dayChangePercent = dayChangePercent;
      account.portfolioValue = totalValue;

      return {
        account,
        positions,
        recentOrders,
      };
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  }

  /**
   * Get portfolio history (chart data)
   */
  async getPortfolioHistory(
    interval: '5minute' | 'day' | 'week' = 'day',
    span: 'day' | 'week' | 'month' | 'year' | 'all' = 'month'
  ): Promise<Array<{ timestamp: Date; equity: number }>> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    return new Promise((resolve, reject) => {
      this.client.portfolios((error: any, response: any, body: any) => {
        if (error) {
          reject(error);
          return;
        }

        const portfolioUrl = body.results?.[0]?.url;
        if (!portfolioUrl) {
          reject(new Error('Portfolio URL not found'));
          return;
        }

        const historyUrl = `${portfolioUrl}historicals/?interval=${interval}&span=${span}`;

        this.client.url(historyUrl, (err: any, resp: any, historyBody: any) => {
          if (err) {
            reject(err);
            return;
          }

          const dataPoints = historyBody.equity_historicals || [];
          const history = dataPoints.map((point: any) => ({
            timestamp: new Date(point.begins_at),
            equity: parseFloat(point.adjusted_close_equity || '0'),
          }));

          resolve(history);
        });
      });
    });
  }

  /**
   * Check if credentials are configured
   */
  hasCredentials(): boolean {
    return !!(this.credentials.username && this.credentials.password);
  }

  /**
   * Get authentication status
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }
}

// Singleton instance
let robinhoodService: RobinhoodService | null = null;

export function getRobinhoodService(): RobinhoodService {
  if (!robinhoodService) {
    robinhoodService = new RobinhoodService();
  }
  return robinhoodService;
}
