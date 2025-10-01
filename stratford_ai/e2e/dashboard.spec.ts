import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('should display the main dashboard', async ({ page }) => {
    await page.goto('/')

    // Check for main title
    await expect(page.getByText('Stratford AI - Multi-Domain Wealth Engine')).toBeVisible()

    // Check for subtitle
    await expect(page.getByText('Comprehensive wealth generation across stocks, crypto, lottery, gambling, and arbitrage opportunities')).toBeVisible()

    // Check for market overview section
    await expect(page.getByText('Real-Time Market Overview')).toBeVisible()
  })

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/')

    // Check for navigation items
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Stocks' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Crypto' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Lottery' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Gambling' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Portfolio' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Agents' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Security' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible()
  })

  test('should display market data cards', async ({ page }) => {
    await page.goto('/')

    // Wait for market data to load
    await page.waitForSelector('[data-testid="market-overview"]', { timeout: 10000 })

    // Check for major market indices
    await expect(page.getByText('S&P 500')).toBeVisible()
    await expect(page.getByText('NASDAQ')).toBeVisible()
    await expect(page.getByText('Bitcoin')).toBeVisible()
    await expect(page.getByText('Ethereum')).toBeVisible()
  })

  test('should show refresh button and handle refresh', async ({ page }) => {
    await page.goto('/')

    // Find and click refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i })
    await expect(refreshButton).toBeVisible()

    await refreshButton.click()

    // Button should be disabled temporarily during refresh
    await expect(refreshButton).toBeDisabled()

    // Wait for refresh to complete
    await expect(refreshButton).not.toBeDisabled({ timeout: 5000 })
  })

  test('should display AI trading signals', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('AI Trading Signals')).toBeVisible()

    // Check for signal types
    await expect(page.getByText('BUY')).toBeVisible()
    await expect(page.getByText('SELL')).toBeVisible()
    await expect(page.getByText('HOLD')).toBeVisible()
  })

  test('should show market news section', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Market News')).toBeVisible()

    // Check for news articles
    await expect(page.locator('text=/Federal Reserve announces|Bitcoin reaches new|Tech stocks surge/')).toBeVisible()
  })

  test('should display lottery predictions', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Lottery Predictions')).toBeVisible()
    await expect(page.getByText('Powerball Prediction')).toBeVisible()
    await expect(page.getByText('Mega Millions Prediction')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check that the main title is still visible on mobile
    await expect(page.getByText('Stratford AI - Multi-Domain Wealth Engine')).toBeVisible()

    // Navigation should be responsive
    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('should have accessible elements', async ({ page }) => {
    await page.goto('/')

    // Check for proper heading structure
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Check that buttons are keyboard accessible
    const refreshButton = page.getByRole('button', { name: /refresh/i })
    await refreshButton.focus()
    await expect(refreshButton).toBeFocused()
  })
})