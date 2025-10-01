import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate to all main sections', async ({ page }) => {
    await page.goto('/')

    // Test navigation to Settings
    await page.click('text=Settings')
    await expect(page).toHaveURL('/settings')
    await expect(page.getByText('System Configuration')).toBeVisible()

    // Test navigation to Crypto
    await page.click('text=Crypto')
    await expect(page).toHaveURL('/crypto')
    await expect(page.getByText('Cryptocurrency Trading')).toBeVisible()

    // Test navigation to Lottery
    await page.click('text=Lottery')
    await expect(page).toHaveURL('/lottery')
    await expect(page.getByText('Lottery Number Generation')).toBeVisible()

    // Test navigation to Gambling
    await page.click('text=Gambling')
    await expect(page).toHaveURL('/gambling')
    await expect(page.getByText('Gambling & Sports Betting Analytics')).toBeVisible()

    // Test navigation back to Dashboard
    await page.click('text=Dashboard')
    await expect(page).toHaveURL('/')
    await expect(page.getByText('Stratford AI - Multi-Domain Wealth Engine')).toBeVisible()
  })

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto('/')

    // Dashboard should be active by default
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' })
    await expect(dashboardLink).toHaveClass(/default/)

    // Navigate to settings and check active state
    await page.click('text=Settings')
    const settingsLink = page.getByRole('link', { name: 'Settings' })
    await expect(settingsLink).toHaveClass(/default/)
  })

  test('should show correct page titles', async ({ page }) => {
    // Dashboard
    await page.goto('/')
    await expect(page).toHaveTitle(/Stratford AI/)

    // Settings
    await page.goto('/settings')
    await expect(page).toHaveTitle(/Settings/)

    // Crypto
    await page.goto('/crypto')
    await expect(page).toHaveTitle(/Crypto/)

    // Lottery
    await page.goto('/lottery')
    await expect(page).toHaveTitle(/Lottery/)
  })

  test('should maintain navigation state across page reloads', async ({ page }) => {
    await page.goto('/settings')

    // Reload the page
    await page.reload()

    // Should still be on settings page
    await expect(page).toHaveURL('/settings')
    await expect(page.getByText('System Configuration')).toBeVisible()

    // Settings nav item should still be active
    const settingsLink = page.getByRole('link', { name: 'Settings' })
    await expect(settingsLink).toHaveClass(/default/)
  })

  test('should handle navigation with keyboard', async ({ page }) => {
    await page.goto('/')

    // Tab to first navigation item and use Enter
    await page.keyboard.press('Tab')

    // Find the settings link and use keyboard navigation
    const settingsLink = page.getByRole('link', { name: 'Settings' })
    await settingsLink.focus()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL('/settings')
  })

  test('should display brand logo and text', async ({ page }) => {
    await page.goto('/')

    // Check for brand elements
    await expect(page.getByText('Stratford AI')).toBeVisible()
    await expect(page.getByText('Multi-Domain Wealth Engine')).toBeVisible()

    // Brand should link to homepage
    await page.click('text=Stratford AI')
    await expect(page).toHaveURL('/')
  })

  test('should show live status indicator', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('LIVE')).toBeVisible()
    await expect(page.getByText('v1.0.0')).toBeVisible()
  })

  test('should handle 404 pages gracefully', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/non-existent-page')

    // Should show 404 page or redirect
    const response = await page.waitForResponse(response =>
      response.url().includes('/non-existent-page')
    )

    expect(response.status()).toBe(404)
  })
})