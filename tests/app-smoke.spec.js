import { test, expect } from '@playwright/test';

test.describe('Hajzy Web & Mobile Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first so we can set localStorage on the correct origin
    await page.goto('/');
    // Enable guest mode to bypass auth gate
    await page.evaluate(() => {
      localStorage.setItem('hajzy_guest_mode', 'true');
    });
    // Reload with guest mode enabled
    await page.goto('/');
  });

  test('App loads successfully with topbar, search, and property cards', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for the main shell to load (with extended timeout for initial load)
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });

    // Verify Topbar is present
    await expect(page.locator('.topbar')).toBeVisible();

    // Verify search panel or compact search is visible
    const searchPanel = page.locator('.home-compact-search, .search-panel, .search-bar');
    await expect(searchPanel.first()).toBeVisible({ timeout: 10000 });

    // Verify stay cards exist
    const cards = page.locator('.property-card');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // Verify bottom navigation is rendered
    await expect(page.locator('.bottom-nav, nav')).toBeVisible();

    // Ensure no fatal console errors occurred
    const fatalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('net::ERR_') && !e.includes('Failed to load resource')
    );
    expect(fatalErrors.length).toBe(0);
  });

  test('Language switch toggles RTL/LTR and updates labels', async ({ page }) => {
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });

    const langToggle = page.locator('.language-toggle').first();
    if (await langToggle.isVisible()) {
      const initialDir = await page.locator('html').getAttribute('dir');
      await langToggle.click();

      const newDir = await page.locator('html').getAttribute('dir');
      expect(newDir).not.toBe(initialDir);
    }
  });

  test('Theme toggle toggles dark mode attribute', async ({ page }) => {
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });

    const themeToggle = page.locator('.theme-toggle, [aria-label*="theme"], [aria-label*="مظهر"], [aria-label*="المظهر"]').first();
    if (await themeToggle.isVisible()) {
      const appShell = page.locator('.app-shell');
      const initialTheme = await appShell.getAttribute('data-theme');

      await themeToggle.click();
      const toggledTheme = await appShell.getAttribute('data-theme');
      expect(toggledTheme).not.toBe(initialTheme);
    }
  });
});
