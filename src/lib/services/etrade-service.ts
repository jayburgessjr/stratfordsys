/**
 * E*TRADE API Service
 * Official E*TRADE API integration with OAuth 2.0 authentication
 * Supports account management, portfolio positions, real-time quotes, and trading
 */

import { ETrade } from 'etrade-ts';

export interface ETradeAccount {
  accountId: string;
  accountIdKey: string;
  accountMode: string;
  accountDesc: string;
  accountName: string;
  accountType: string;
  institutionType: string;
  accountStatus: string;
  closedDate?: number;
}

export interface ETradePosition {
  positionId: string;
  symbol: string;
  symbolDescription: string;
  dateAcquired: number;
  pricePaid: number;
  quantity: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPct: number;
  daysGain: number;
  daysGainPct: number;
}

export interface ETradeQuote {
  symbol: string;
  companyName: string;
  lastTrade: number;
  change: number;
  changePct: number;
  volume: number;
  bid: number;
  ask: number;
  high52: number;
  low52: number;
  peRatio: number;
  marketCap: number;
}

export interface ETradePortfolio {
  account: {
    accountId: string;
    portfolioValue: number;
    totalReturn: number;
    totalReturnPct: number;
    dayChange: number;
    dayChangePct: number;
    buyingPower: number;
    cashBalance: number;
  };
  positions: ETradePosition[];
}

class ETradeService {
  private client: ETrade | null = null;
  private isAuthenticated: boolean = false;
  private credentials: {
    key: string;
    secret: string;
  };
  private accessToken: {
    oauth_token: string;
    oauth_token_secret: string;
  } | null = null;

  constructor() {
    this.credentials = {
      key: process.env.ETRADE_CONSUMER_KEY || '',
      secret: process.env.ETRADE_CONSUMER_SECRET || '',
    };
  }

  /**
   * Check if E*TRADE credentials are configured
   */
  hasCredentials(): boolean {
    return !!(this.credentials.key && this.credentials.secret);
  }

  /**
   * Initialize OAuth flow and get authorization URL
   * Returns the URL the user needs to visit to authorize the app
   */
  async initiateOAuth(): Promise<string> {
    if (!this.hasCredentials()) {
      throw new Error('E*TRADE credentials not configured. Add ETRADE_CONSUMER_KEY and ETRADE_CONSUMER_SECRET to environment variables.');
    }

    // Use sandbox mode if not in production
    const mode = process.env.NODE_ENV === 'production' ? 'prod' : 'sandbox';

    this.client = new ETrade({
      consumerKey: this.credentials.key,
      consumerSecret: this.credentials.secret,
      mode,
    });

    // Get request token and authorization URL
    const requestToken = await this.client.getRequestToken();
    const authUrl = this.client.getAuthorizationUrl(requestToken);

    // Store request token for callback
    this.accessToken = requestToken;

    return authUrl;
  }

  /**
   * Complete OAuth flow with verification code
   * User provides the verification code from E*TRADE authorization page
   */
  async completeOAuth(verifierCode: string): Promise<boolean> {
    if (!this.client || !this.accessToken) {
      throw new Error('OAuth flow not initiated. Call initiateOAuth() first.');
    }

    try {
      // Exchange verifier for access token
      const accessToken = await this.client.getAccessToken(
        this.accessToken,
        verifierCode
      );

      this.accessToken = accessToken;
      this.isAuthenticated = true;

      console.log('✅ E*TRADE authentication successful');
      return true;
    } catch (error: any) {
      console.error('E*TRADE OAuth error:', error);
      this.isAuthenticated = false;
      throw new Error(`Failed to complete OAuth: ${error.message}`);
    }
  }

  /**
   * Get all E*TRADE accounts
   */
  async getAccounts(): Promise<ETradeAccount[]> {
    if (!this.isAuthenticated || !this.client) {
      throw new Error('Not authenticated. Complete OAuth flow first.');
    }

    try {
      const response = await this.client.listAccounts();

      return response.AccountListResponse.Accounts.Account.map((acc: any) => ({
        accountId: acc.accountId,
        accountIdKey: acc.accountIdKey,
        accountMode: acc.accountMode,
        accountDesc: acc.accountDesc,
        accountName: acc.accountName,
        accountType: acc.accountType,
        institutionType: acc.institutionType,
        accountStatus: acc.accountStatus,
        closedDate: acc.closedDate,
      }));
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }
  }

  /**
   * Get portfolio positions for a specific account
   */
  async getPositions(accountIdKey: string): Promise<ETradePosition[]> {
    if (!this.isAuthenticated || !this.client) {
      throw new Error('Not authenticated. Complete OAuth flow first.');
    }

    try {
      const response = await this.client.getPortfolio(accountIdKey);
      const positions = response.PortfolioResponse.AccountPortfolio[0].Position || [];

      return positions.map((pos: any) => {
        const product = pos.Product;
        const quick = pos.Quick;
        const complete = pos.Complete;

        return {
          positionId: pos.positionId,
          symbol: product.symbol,
          symbolDescription: product.securityType === 'EQ' ? product.companyName : product.symbol,
          dateAcquired: complete?.dateAcquired || 0,
          pricePaid: complete?.pricePaid || 0,
          quantity: pos.quantity,
          currentPrice: quick?.lastTrade || 0,
          marketValue: complete?.marketValue || 0,
          totalCost: complete?.totalCost || 0,
          totalGain: complete?.totalGain || 0,
          totalGainPct: complete?.totalGainPct || 0,
          daysGain: complete?.daysGain || 0,
          daysGainPct: complete?.daysGainPct || 0,
        };
      });
    } catch (error: any) {
      console.error('Error fetching positions:', error);
      throw new Error(`Failed to fetch positions: ${error.message}`);
    }
  }

  /**
   * Get real-time quotes for symbols
   */
  async getQuotes(symbols: string[]): Promise<ETradeQuote[]> {
    if (!this.isAuthenticated || !this.client) {
      throw new Error('Not authenticated. Complete OAuth flow first.');
    }

    try {
      const response = await this.client.getQuotes(symbols);
      const quotes = response.QuoteResponse.QuoteData || [];

      return quotes.map((quote: any) => {
        const all = quote.All;
        return {
          symbol: quote.Product.symbol,
          companyName: quote.Product.companyName || quote.Product.symbol,
          lastTrade: all.lastTrade,
          change: all.change,
          changePct: all.changePct,
          volume: all.volume,
          bid: all.bid,
          ask: all.ask,
          high52: all.high52,
          low52: all.low52,
          peRatio: all.peRatio || 0,
          marketCap: all.marketCap || 0,
        };
      });
    } catch (error: any) {
      console.error('Error fetching quotes:', error);
      throw new Error(`Failed to fetch quotes: ${error.message}`);
    }
  }

  /**
   * Get complete portfolio with account summary and positions
   */
  async getPortfolio(): Promise<ETradePortfolio> {
    if (!this.isAuthenticated || !this.client) {
      throw new Error('Not authenticated. Complete OAuth flow first.');
    }

    try {
      // Get first account (most users have one brokerage account)
      const accounts = await this.getAccounts();
      if (accounts.length === 0) {
        throw new Error('No E*TRADE accounts found');
      }

      const primaryAccount = accounts[0];
      const positions = await this.getPositions(primaryAccount.accountIdKey);

      // Get account balance
      const balanceResponse = await this.client.getBalances(primaryAccount.accountIdKey);
      const computed = balanceResponse.BalanceResponse.Computed;
      const realTimeValues = computed.RealTimeValues;

      // Calculate portfolio metrics
      const portfolioValue = realTimeValues.totalAccountValue || 0;
      const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0);
      const totalReturn = positions.reduce((sum, pos) => sum + pos.totalGain, 0);
      const totalReturnPct = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
      const dayChange = positions.reduce((sum, pos) => sum + pos.daysGain, 0);
      const dayChangePct = (portfolioValue - dayChange) > 0
        ? (dayChange / (portfolioValue - dayChange)) * 100
        : 0;

      return {
        account: {
          accountId: primaryAccount.accountId,
          portfolioValue,
          totalReturn,
          totalReturnPct,
          dayChange,
          dayChangePct,
          buyingPower: computed.cashAvailableForInvestment || 0,
          cashBalance: computed.cashBalance || 0,
        },
        positions,
      };
    } catch (error: any) {
      console.error('Error fetching portfolio:', error);
      throw new Error(`Failed to fetch portfolio: ${error.message}`);
    }
  }

  /**
   * Check if authenticated
   */
  isAuth(): boolean {
    return this.isAuthenticated;
  }

  /**
   * Get access token (for session persistence)
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Set access token (for session restoration)
   */
  setAccessToken(token: { oauth_token: string; oauth_token_secret: string }) {
    this.accessToken = token;

    if (this.hasCredentials() && token) {
      const mode = process.env.NODE_ENV === 'production' ? 'prod' : 'sandbox';
      this.client = new ETrade({
        consumerKey: this.credentials.key,
        consumerSecret: this.credentials.secret,
        mode,
      });
      this.isAuthenticated = true;
    }
  }
}

// Singleton instance
let etradeService: ETradeService | null = null;

export function getETradeService(): ETradeService {
  if (!etradeService) {
    etradeService = new ETradeService();
  }
  return etradeService;
}
