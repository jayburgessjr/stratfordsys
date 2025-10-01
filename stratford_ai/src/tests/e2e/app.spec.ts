import { test, expect } from '@playwright/test';

test.describe('Stratford AI Application', () => {
  test('has title and loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Stratford AI/);

    // Check main heading
    await expect(page.getByRole('heading', { name: 'Stratford AI Dashboard' })).toBeVisible();

    // Check subtitle
    await expect(page.getByText('Deterministic wealth engine with moving average crossover strategy')).toBeVisible();

    // Check that key dashboard elements are visible
    await expect(page.getByText('Total Return')).toBeVisible();
    await expect(page.getByText('Portfolio Equity Curve')).toBeVisible();
  });

  test('dashboard functionality', async ({ page }) => {
    await page.goto('/');

    // Test performance metric cards
    await expect(page.getByText('Total Return')).toBeVisible();
    await expect(page.getByText('Annualized Return')).toBeVisible();
    await expect(page.getByText('Sharpe Ratio')).toBeVisible();
    await expect(page.getByText('Max Drawdown')).toBeVisible();
    await expect(page.getByText('Win Rate')).toBeVisible();
    await expect(page.getByText('Profit Factor')).toBeVisible();

    // Test chart components
    await expect(page.getByText('Portfolio Equity Curve')).toBeVisible();
    await expect(page.getByText('Win/Loss Overview')).toBeVisible();
    await expect(page.getByText('Drawdown Analysis')).toBeVisible();
    await expect(page.getByText('Strategy Configuration')).toBeVisible();

    // Test interactive elements
    const equityButton = page.getByRole('button', { name: /Equity/ });
    const drawdownButton = page.getByRole('button', { name: /Drawdown/ });

    await expect(equityButton).toBeVisible();
    await expect(drawdownButton).toBeVisible();

    // Test button interaction
    await drawdownButton.click();
    await expect(page.getByText('Drawdown Analysis')).toBeVisible();
  });
});