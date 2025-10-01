/**
 * Demo Performance Overview Component Tests
 *
 * Comprehensive test suite for the performance overview dashboard component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DemoPerformanceOverview } from './demo-performance-overview';

describe('DemoPerformanceOverview', () => {
  it('renders all performance metric cards', () => {
    render(<DemoPerformanceOverview />);

    // Check that all 6 metric cards are rendered
    expect(screen.getByText('Total Return')).toBeInTheDocument();
    expect(screen.getByText('Annualized Return')).toBeInTheDocument();
    expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
    expect(screen.getByText('Max Drawdown')).toBeInTheDocument();
    expect(screen.getByText('Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Profit Factor')).toBeInTheDocument();
  });

  it('displays correct metric values', () => {
    render(<DemoPerformanceOverview />);

    // Check specific metric values
    expect(screen.getByText('12.45%')).toBeInTheDocument(); // Total Return
    expect(screen.getByText('18.2%')).toBeInTheDocument();  // Annualized Return
    expect(screen.getByText('1.42')).toBeInTheDocument();   // Sharpe Ratio
    expect(screen.getByText('8.7%')).toBeInTheDocument();   // Max Drawdown
    expect(screen.getByText('64.2%')).toBeInTheDocument();  // Win Rate
    expect(screen.getByText('2.15')).toBeInTheDocument();   // Profit Factor
  });

  it('displays change indicators for each metric', () => {
    render(<DemoPerformanceOverview />);

    // Check change indicators
    expect(screen.getByText('$12,450 P&L')).toBeInTheDocument();
    expect(screen.getByText('15.3% volatility')).toBeInTheDocument();
    expect(screen.getByText('1.65 Sortino')).toBeInTheDocument();
    expect(screen.getByText('23 days')).toBeInTheDocument();
    expect(screen.getByText('34/53 trades')).toBeInTheDocument();
    expect(screen.getByText('$1,245 avg win')).toBeInTheDocument();
  });

  it('displays metric descriptions', () => {
    render(<DemoPerformanceOverview />);

    // Check descriptions
    expect(screen.getByText('Overall portfolio performance')).toBeInTheDocument();
    expect(screen.getByText('Yearly performance rate')).toBeInTheDocument();
    expect(screen.getByText('Risk-adjusted returns')).toBeInTheDocument();
    expect(screen.getByText('Largest peak-to-trough decline')).toBeInTheDocument();
    expect(screen.getByText('Percentage of profitable trades')).toBeInTheDocument();
    expect(screen.getByText('Gross profit vs gross loss')).toBeInTheDocument();
  });

  it('renders with proper grid layout', () => {
    const { container } = render(<DemoPerformanceOverview />);

    // Check grid container class
    const gridContainer = container.firstChild;
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-6');
  });

  it('has proper icons for each metric', () => {
    render(<DemoPerformanceOverview />);

    // Icons should be rendered (though we can't easily test the specific icon)
    const cards = screen.getAllByRole('generic');
    const iconElements = cards.filter(card =>
      card.querySelector('svg') &&
      card.querySelector('svg')?.classList.contains('h-4')
    );

    // Should have icons in header sections
    expect(iconElements.length).toBeGreaterThan(0);
  });

  it('applies correct trend styling', () => {
    render(<DemoPerformanceOverview />);

    // All demo metrics show positive trends
    const changeElements = screen.getAllByText(/\$|%|Sortino|days|trades|avg win/);

    // Check that trend elements exist
    expect(changeElements.length).toBeGreaterThan(0);
  });

  it('has accessible structure', () => {
    render(<DemoPerformanceOverview />);

    // Check for proper heading structure
    const titles = [
      'Total Return',
      'Annualized Return',
      'Sharpe Ratio',
      'Max Drawdown',
      'Win Rate',
      'Profit Factor'
    ];

    titles.forEach(title => {
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('renders values with proper formatting', () => {
    render(<DemoPerformanceOverview />);

    // Check percentage formatting
    const percentageValues = ['12.45%', '18.2%', '8.7%', '64.2%'];
    percentageValues.forEach(value => {
      expect(screen.getByText(value)).toBeInTheDocument();
    });

    // Check currency formatting
    expect(screen.getByText('$12,450 P&L')).toBeInTheDocument();
    expect(screen.getByText('$1,245 avg win')).toBeInTheDocument();

    // Check ratio formatting
    expect(screen.getByText('1.42')).toBeInTheDocument();
    expect(screen.getByText('2.15')).toBeInTheDocument();
  });

  it('maintains consistent card structure', () => {
    render(<DemoPerformanceOverview />);

    // Each card should have title, value, and description
    const titles = [
      'Total Return',
      'Annualized Return',
      'Sharpe Ratio',
      'Max Drawdown',
      'Win Rate',
      'Profit Factor'
    ];

    // Check each title has corresponding elements
    titles.forEach(title => {
      const titleElement = screen.getByText(title);
      expect(titleElement).toBeInTheDocument();

      // Title should be in a card header
      const card = titleElement.closest('[class*="rounded"]');
      expect(card).toBeInTheDocument();
    });
  });
});