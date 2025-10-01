/**
 * Dashboard End-to-End Tests
 *
 * Comprehensive E2E tests for the Stratford AI dashboard
 * testing user interactions, performance, and visual elements
 */

import { test, expect } from '@playwright/test';

test.describe('Stratford AI Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Page Load and Structure', () => {
    test('should load the dashboard successfully', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Stratford AI/);

      // Check main heading
      await expect(page.getByRole('heading', { name: 'Stratford AI Dashboard' })).toBeVisible();

      // Check subtitle
      await expect(page.getByText('Deterministic wealth engine with moving average crossover strategy')).toBeVisible();
    });

    test('should display header navigation', async ({ page }) => {
      // Check header is visible
      await expect(page.locator('header')).toBeVisible();

      // Check brand/logo
      await expect(page.getByText('Stratford AI')).toBeVisible();

      // Check version
      await expect(page.getByText('Version 1.0.0')).toBeVisible();
    });

    test('should display footer with technology credits', async ({ page }) => {
      // Check footer is visible
      await expect(page.locator('footer')).toBeVisible();

      // Check technology links
      await expect(page.getByRole('link', { name: 'Next.js' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Tailwind CSS' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Recharts' })).toBeVisible();
    });
  });

  test.describe('Performance Overview Cards', () => {
    test('should display all performance metric cards', async ({ page }) => {
      // Check all metric cards are visible
      await expect(page.getByText('Total Return')).toBeVisible();
      await expect(page.getByText('Annualized Return')).toBeVisible();
      await expect(page.getByText('Sharpe Ratio')).toBeVisible();
      await expect(page.getByText('Max Drawdown')).toBeVisible();
      await expect(page.getByText('Win Rate')).toBeVisible();
      await expect(page.getByText('Profit Factor')).toBeVisible();
    });

    test('should display metric values and descriptions', async ({ page }) => {
      // Check metric values
      await expect(page.getByText('12.45%')).toBeVisible();
      await expect(page.getByText('18.2%')).toBeVisible();
      await expect(page.getByText('1.42')).toBeVisible();
      await expect(page.getByText('8.7%')).toBeVisible();
      await expect(page.getByText('64.2%')).toBeVisible();
      await expect(page.getByText('2.15')).toBeVisible();

      // Check descriptions are present
      await expect(page.getByText('Overall portfolio performance')).toBeVisible();
      await expect(page.getByText('Risk-adjusted returns')).toBeVisible();
      await expect(page.getByText('Percentage of profitable trades')).toBeVisible();
    });

    test('should have responsive layout', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByText('Total Return')).toBeVisible();

      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.getByText('Total Return')).toBeVisible();

      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.getByText('Total Return')).toBeVisible();
    });
  });

  test.describe('Equity Curve Chart', () => {
    test('should display equity curve chart with controls', async ({ page }) => {
      // Check chart title
      await expect(page.getByText('Portfolio Equity Curve')).toBeVisible();

      // Check view toggle buttons
      await expect(page.getByRole('button', { name: /Equity/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Drawdown/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Returns/ })).toBeVisible();

      // Check summary statistics
      await expect(page.getByText('Start Value')).toBeVisible();
      await expect(page.getByText('End Value')).toBeVisible();
      await expect(page.getByText('Total Return')).toBeVisible();
      await expect(page.getByText('Duration')).toBeVisible();
    });

    test('should switch chart views correctly', async ({ page }) => {
      // Default should be equity view
      await expect(page.getByText('Portfolio Equity Curve')).toBeVisible();

      // Click drawdown button
      await page.getByRole('button', { name: /Drawdown/ }).click();
      await expect(page.getByText('Drawdown Analysis')).toBeVisible();

      // Click returns button
      await page.getByRole('button', { name: /Returns/ }).click();
      await expect(page.getByText('Daily Returns')).toBeVisible();

      // Click back to equity
      await page.getByRole('button', { name: /Equity/ }).click();
      await expect(page.getByText('Portfolio Equity Curve')).toBeVisible();
    });

    test('should have proper button states', async ({ page }) => {
      const equityButton = page.getByRole('button', { name: /Equity/ });
      const drawdownButton = page.getByRole('button', { name: /Drawdown/ });

      // Initially equity should be active
      await expect(equityButton).toHaveClass(/bg-primary/);

      // Click drawdown
      await drawdownButton.click();
      await expect(drawdownButton).toHaveClass(/bg-primary/);
      await expect(equityButton).not.toHaveClass(/bg-primary/);
    });
  });

  test.describe('Trading Activity Chart', () => {
    test('should display trading activity with view toggles', async ({ page }) => {
      // Check chart is visible
      await expect(page.getByText('Win/Loss Overview')).toBeVisible();

      // Check trading statistics
      await expect(page.getByText('Total Trades')).toBeVisible();
      await expect(page.getByText('Win Rate')).toBeVisible();
      await expect(page.getByText('Avg. Win')).toBeVisible();
      await expect(page.getByText('Avg. Loss')).toBeVisible();

      // Check statistics values
      await expect(page.getByText('53')).toBeVisible();  // Total trades
      await expect(page.getByText('64.2%')).toBeVisible(); // Win rate
      await expect(page.getByText('$1,245')).toBeVisible(); // Avg win
      await expect(page.getByText('$582')).toBeVisible();   // Avg loss
    });

    test('should switch between overview and performance views', async ({ page }) => {
      // Should start with overview
      await expect(page.getByText('Win/Loss Overview')).toBeVisible();

      // Find trading activity section and click performance button
      const tradingSection = page.locator('h3', { hasText: 'Win/Loss Overview' }).locator('..').locator('..');
      await tradingSection.getByRole('button').nth(1).click();

      // Should switch to performance view
      await expect(page.getByText('Monthly Performance')).toBeVisible();
    });
  });

  test.describe('Risk Analysis Chart', () => {
    test('should display risk analysis with multiple views', async ({ page }) => {
      // Check chart is visible
      await expect(page.getByText('Drawdown Analysis')).toBeVisible();

      // Check risk statistics
      await expect(page.getByText('Max Drawdown')).toBeVisible();
      await expect(page.getByText('VaR (95%)')).toBeVisible();
      await expect(page.getByText('Sortino Ratio')).toBeVisible();
      await expect(page.getByText('Volatility')).toBeVisible();

      // Check statistics values
      await expect(page.getByText('8.7%')).toBeVisible();  // Max Drawdown
      await expect(page.getByText('3.2%')).toBeVisible();  // VaR
      await expect(page.getByText('1.65')).toBeVisible();  // Sortino
      await expect(page.getByText('15.3%')).toBeVisible(); // Volatility
    });

    test('should switch between risk analysis views', async ({ page }) => {
      // Find risk analysis section
      const riskSection = page.locator('h3', { hasText: 'Drawdown Analysis' }).locator('..').locator('..');

      // Test view switching
      await riskSection.getByRole('button').nth(1).click();
      await expect(page.getByText('Volatility Tracking')).toBeVisible();

      await riskSection.getByRole('button').nth(2).click();
      await expect(page.getByText('Return Distribution')).toBeVisible();
    });
  });

  test.describe('Strategy Configuration Panel', () => {
    test('should display strategy configuration', async ({ page }) => {
      // Check strategy info
      await expect(page.getByText('Strategy Configuration')).toBeVisible();
      await expect(page.getByText('Moving Average Crossover')).toBeVisible();
      await expect(page.getByText('Trend Following')).toBeVisible();

      // Check parameter inputs
      await expect(page.getByText('Short Period')).toBeVisible();
      await expect(page.getByText('Long Period')).toBeVisible();
      await expect(page.getByText('MA Type')).toBeVisible();
      await expect(page.getByText('Signal Delay')).toBeVisible();

      // Check risk management
      await expect(page.getByText('Max Position Size')).toBeVisible();
      await expect(page.getByText('Commission')).toBeVisible();
      await expect(page.getByText('Slippage')).toBeVisible();
    });

    test('should allow parameter modifications', async ({ page }) => {
      // Find short period input
      const shortPeriodInput = page.locator('input[type="number"]').first();
      await expect(shortPeriodInput).toHaveValue('20');

      // Change value
      await shortPeriodInput.fill('25');
      await expect(shortPeriodInput).toHaveValue('25');

      // Test dropdown
      const maTypeSelect = page.locator('select').first();
      await expect(maTypeSelect).toHaveValue('SIMPLE');

      await maTypeSelect.selectOption('EXPONENTIAL');
      await expect(maTypeSelect).toHaveValue('EXPONENTIAL');
    });

    test('should have functional reset and run buttons', async ({ page }) => {
      // Check buttons exist
      await expect(page.getByRole('button', { name: /Reset/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /Run Backtest/ })).toBeVisible();

      // Test reset button
      const resetButton = page.getByRole('button', { name: /Reset/ });
      await resetButton.click();

      // Test run button
      const runButton = page.getByRole('button', { name: /Run Backtest/ });
      await runButton.click();

      // Should show running state
      await expect(page.getByText('Running...')).toBeVisible();
    });

    test('should display current results', async ({ page }) => {
      // Check results section
      await expect(page.getByText('Current Results')).toBeVisible();
      await expect(page.getByText('Total Return')).toBeVisible();
      await expect(page.getByText('Sharpe Ratio')).toBeVisible();
      await expect(page.getByText('Max Drawdown')).toBeVisible();
      await expect(page.getByText('Win Rate')).toBeVisible();
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');

      // Wait for main content to be visible
      await expect(page.getByText('Stratford AI Dashboard')).toBeVisible();

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to activate buttons with keyboard
      const equityButton = page.getByRole('button', { name: /Equity/ });
      await equityButton.focus();
      await page.keyboard.press('Enter');
    });

    test('should handle screen readers appropriately', async ({ page }) => {
      // Check for proper heading structure
      const h1 = page.getByRole('heading', { level: 1 });
      await expect(h1).toBeVisible();

      // Check for accessible button labels
      const buttons = page.getByRole('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);

      // Check for proper link attributes
      const externalLinks = page.getByRole('link', { name: /Next.js|Tailwind|Recharts/ });
      for (let i = 0; i < await externalLinks.count(); i++) {
        const link = externalLinks.nth(i);
        await expect(link).toHaveAttribute('target', '_blank');
      }
    });

    test('should display properly on different screen sizes', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1024, height: 768 },  // Laptop
        { width: 1920, height: 1080 }  // Desktop
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        // Check main elements are still visible
        await expect(page.getByText('Stratford AI Dashboard')).toBeVisible();
        await expect(page.getByText('Total Return')).toBeVisible();
        await expect(page.getByText('Portfolio Equity Curve')).toBeVisible();

        // Allow layout to settle
        await page.waitForTimeout(100);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle component failures gracefully', async ({ page }) => {
      // Intercept network requests that might fail
      await page.route('**/*', async route => {
        if (route.request().url().includes('api')) {
          await route.abort();
        } else {
          await route.continue();
        }
      });

      await page.goto('/');

      // Dashboard should still load even if some components fail
      await expect(page.getByText('Stratford AI Dashboard')).toBeVisible();
    });

    test('should maintain functionality with JavaScript disabled', async ({ browser }) => {
      const context = await browser.newContext({
        javaScriptEnabled: false
      });
      const page = await context.newPage();

      await page.goto('/');

      // Basic content should still be visible
      await expect(page.getByText('Stratford AI')).toBeVisible();

      await context.close();
    });
  });
});