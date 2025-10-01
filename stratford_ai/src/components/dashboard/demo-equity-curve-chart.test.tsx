/**
 * Demo Equity Curve Chart Component Tests
 *
 * Comprehensive test suite for the equity curve chart dashboard component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DemoEquityCurveChart } from './demo-equity-curve-chart';

// Mock Recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) => (
    <div data-testid={`line-${dataKey}`} data-stroke={stroke} />
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => (
    <div data-testid="x-axis" data-key={dataKey} />
  ),
  YAxis: ({ tickFormatter }: { tickFormatter?: Function }) => (
    <div data-testid="y-axis" data-formatter={tickFormatter?.name || 'default'} />
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ReferenceLine: ({ y, stroke }: { y: number; stroke: string }) => (
    <div data-testid="reference-line" data-y={y} data-stroke={stroke} />
  ),
}));

describe('DemoEquityCurveChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the chart component', () => {
    render(<DemoEquityCurveChart />);

    expect(screen.getByText('Portfolio Equity Curve')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('displays view toggle buttons', () => {
    render(<DemoEquityCurveChart />);

    expect(screen.getByText('Equity')).toBeInTheDocument();
    expect(screen.getByText('Drawdown')).toBeInTheDocument();
    expect(screen.getByText('Returns')).toBeInTheDocument();
  });

  it('switches to drawdown view when button is clicked', () => {
    render(<DemoEquityCurveChart />);

    const drawdownButton = screen.getByText('Drawdown');
    fireEvent.click(drawdownButton);

    expect(screen.getByText('Drawdown Analysis')).toBeInTheDocument();
  });

  it('switches to returns view when button is clicked', () => {
    render(<DemoEquityCurveChart />);

    const returnsButton = screen.getByText('Returns');
    fireEvent.click(returnsButton);

    expect(screen.getByText('Daily Returns')).toBeInTheDocument();
  });

  it('displays summary statistics', () => {
    render(<DemoEquityCurveChart />);

    expect(screen.getByText('Start Value')).toBeInTheDocument();
    expect(screen.getByText('End Value')).toBeInTheDocument();
    expect(screen.getByText('Total Return')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();

    expect(screen.getByText('$100,000')).toBeInTheDocument();
    expect(screen.getByText('365 days')).toBeInTheDocument();
  });

  it('shows equity view by default', () => {
    render(<DemoEquityCurveChart />);

    const equityButton = screen.getByText('Equity');
    expect(equityButton).toHaveClass('bg-primary'); // Default button styling
    expect(screen.getByText('Portfolio Equity Curve')).toBeInTheDocument();
  });

  it('renders chart components for equity view', () => {
    render(<DemoEquityCurveChart />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });

  it('shows reference line for drawdown view', () => {
    render(<DemoEquityCurveChart />);

    const drawdownButton = screen.getByText('Drawdown');
    fireEvent.click(drawdownButton);

    expect(screen.getByTestId('reference-line')).toBeInTheDocument();
  });

  it('shows reference line for returns view', () => {
    render(<DemoEquityCurveChart />);

    const returnsButton = screen.getByText('Returns');
    fireEvent.click(returnsButton);

    expect(screen.getByTestId('reference-line')).toBeInTheDocument();
  });

  it('displays correct chart title for each view', () => {
    render(<DemoEquityCurveChart />);

    // Default equity view
    expect(screen.getByText('Portfolio Equity Curve')).toBeInTheDocument();

    // Switch to drawdown
    fireEvent.click(screen.getByText('Drawdown'));
    expect(screen.getByText('Drawdown Analysis')).toBeInTheDocument();

    // Switch to returns
    fireEvent.click(screen.getByText('Returns'));
    expect(screen.getByText('Daily Returns')).toBeInTheDocument();
  });

  it('has proper button states for active view', () => {
    render(<DemoEquityCurveChart />);

    const equityButton = screen.getByText('Equity');
    const drawdownButton = screen.getByText('Drawdown');
    const returnsButton = screen.getByText('Returns');

    // Initially equity should be active
    expect(equityButton.closest('button')).toHaveClass('bg-primary');
    expect(drawdownButton.closest('button')).not.toHaveClass('bg-primary');
    expect(returnsButton.closest('button')).not.toHaveClass('bg-primary');

    // Click drawdown
    fireEvent.click(drawdownButton);
    expect(drawdownButton.closest('button')).toHaveClass('bg-primary');
    expect(equityButton.closest('button')).not.toHaveClass('bg-primary');
  });

  it('renders summary stats with proper formatting', () => {
    render(<DemoEquityCurveChart />);

    // Check for currency formatting
    expect(screen.getByText('$100,000')).toBeInTheDocument();

    // Check for percentage formatting in total return
    const totalReturnElements = screen.getAllByText(/%$/);
    expect(totalReturnElements.length).toBeGreaterThan(0);

    // Check for duration
    expect(screen.getByText('365 days')).toBeInTheDocument();
  });

  it('displays icons in buttons', () => {
    render(<DemoEquityCurveChart />);

    // Check that buttons contain SVG icons
    const buttons = screen.getAllByRole('button');
    const buttonsWithIcons = buttons.filter(button =>
      button.querySelector('svg')
    );

    expect(buttonsWithIcons.length).toBe(3); // Three view buttons with icons
  });

  it('has responsive container for chart', () => {
    render(<DemoEquityCurveChart />);

    const container = screen.getByTestId('responsive-container');
    expect(container).toBeInTheDocument();

    // Container should wrap the chart
    expect(container.querySelector('[data-testid="line-chart"]')).toBeInTheDocument();
  });

  it('maintains chart height', () => {
    const { container } = render(<DemoEquityCurveChart />);

    const chartContainer = container.querySelector('.h-80');
    expect(chartContainer).toBeInTheDocument();
  });

  it('displays proper grid layout for summary stats', () => {
    const { container } = render(<DemoEquityCurveChart />);

    const statsGrid = container.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
    expect(statsGrid).toBeInTheDocument();
  });

  it('handles view switching correctly', () => {
    render(<DemoEquityCurveChart />);

    // Test multiple view switches
    const drawdownButton = screen.getByText('Drawdown');
    const returnsButton = screen.getByText('Returns');
    const equityButton = screen.getByText('Equity');

    // Switch to drawdown
    fireEvent.click(drawdownButton);
    expect(screen.getByText('Drawdown Analysis')).toBeInTheDocument();

    // Switch to returns
    fireEvent.click(returnsButton);
    expect(screen.getByText('Daily Returns')).toBeInTheDocument();

    // Switch back to equity
    fireEvent.click(equityButton);
    expect(screen.getByText('Portfolio Equity Curve')).toBeInTheDocument();
  });

  it('renders all required chart elements', () => {
    render(<DemoEquityCurveChart />);

    // Check for all chart components
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
  });
});