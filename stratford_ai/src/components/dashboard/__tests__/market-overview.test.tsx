import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MarketOverview } from '../market-overview'

// Mock the recharts library
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}))

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Bitcoin: () => <div data-testid="bitcoin-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
}))

describe('MarketOverview Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  test('renders market overview sections', () => {
    render(<MarketOverview />)

    expect(screen.getByText('Real-Time Market Overview')).toBeInTheDocument()
    expect(screen.getByText('Live Market Data')).toBeInTheDocument()
    expect(screen.getByText('AI Trading Signals')).toBeInTheDocument()
    expect(screen.getByText('Market News')).toBeInTheDocument()
    expect(screen.getByText('Lottery Predictions')).toBeInTheDocument()
  })

  test('displays market data cards', () => {
    render(<MarketOverview />)

    expect(screen.getByText('S&P 500')).toBeInTheDocument()
    expect(screen.getByText('NASDAQ')).toBeInTheDocument()
    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
    expect(screen.getByText('Ethereum')).toBeInTheDocument()
  })

  test('shows last update time', () => {
    render(<MarketOverview />)

    expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
  })

  test('displays refresh button', () => {
    render(<MarketOverview />)

    const refreshButton = screen.getByRole('button', { name: /refresh data/i })
    expect(refreshButton).toBeInTheDocument()
  })

  test('handles refresh button click', async () => {
    render(<MarketOverview />)

    const refreshButton = screen.getByRole('button', { name: /refresh data/i })
    fireEvent.click(refreshButton)

    // Check that the button shows refreshing state
    expect(refreshButton).toBeDisabled()

    // Wait for refresh to complete
    await waitFor(() => {
      expect(refreshButton).not.toBeDisabled()
    }, { timeout: 3000 })
  })

  test('displays trading signals', () => {
    render(<MarketOverview />)

    expect(screen.getByText('BUY')).toBeInTheDocument()
    expect(screen.getByText('SELL')).toBeInTheDocument()
    expect(screen.getByText('HOLD')).toBeInTheDocument()
  })

  test('shows news articles', () => {
    render(<MarketOverview />)

    expect(screen.getByText(/Federal Reserve announces/)).toBeInTheDocument()
    expect(screen.getByText(/Bitcoin reaches new/)).toBeInTheDocument()
    expect(screen.getByText(/Tech stocks surge/)).toBeInTheDocument()
  })

  test('displays lottery predictions', () => {
    render(<MarketOverview />)

    expect(screen.getByText('Powerball Prediction')).toBeInTheDocument()
    expect(screen.getByText('Mega Millions Prediction')).toBeInTheDocument()
    expect(screen.getByText(/Next Drawing:/)).toBeInTheDocument()
  })

  test('renders charts', () => {
    render(<MarketOverview />)

    expect(screen.getAllByTestId('line-chart')).toHaveLength(4) // One for each market data card
  })

  test('auto-refreshes data every 30 seconds', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    render(<MarketOverview />)

    // Fast-forward 30 seconds
    jest.advanceTimersByTime(30000)

    // Should trigger auto-refresh (we can't easily test the actual refresh logic without mocking more)
    expect(consoleSpy).toHaveBeenCalledWith('Auto-refreshing market data...')

    consoleSpy.mockRestore()
  })

  test('displays correct signal colors', () => {
    render(<MarketOverview />)

    const buySignal = screen.getByText('BUY')
    const sellSignal = screen.getByText('SELL')
    const holdSignal = screen.getByText('HOLD')

    expect(buySignal).toHaveClass('text-green-600')
    expect(sellSignal).toHaveClass('text-red-600')
    expect(holdSignal).toHaveClass('text-yellow-600')
  })

  test('handles component unmount cleanup', () => {
    const { unmount } = render(<MarketOverview />)

    // Should not throw error when unmounting
    expect(() => unmount()).not.toThrow()
  })
})