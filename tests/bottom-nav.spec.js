import { test, expect } from '@playwright/test';

test.describe('Bottom Navigation & Content Spacing Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('hajzy_guest_mode', 'true');
    });
    await page.goto('/');
  });

  test('Bottom navigation height is approximately 64px on standard viewport', async ({ page }) => {
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    const bottomNav = page.locator('.bottom-nav');
    await expect(bottomNav).toBeVisible();

    const box = await bottomNav.boundingBox();
    expect(box).not.toBeNull();
    // Height should be approximately 64px (within 60px to 68px range)
    expect(box.height).toBeGreaterThanOrEqual(60);
    expect(box.height).toBeLessThanOrEqual(68);
  });

  test('Tabs order has Home / الرئيسية first (far right in RTL)', async ({ page }) => {
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    const navItems = page.locator('.bottom-nav .nav-item');
    await expect(navItems.first()).toBeVisible();

    // Verify first tab in DOM is Home
    const firstTabLabel = await navItems.first().locator('.nav-label').innerText();
    expect(firstTabLabel.trim()).toMatch(/الرئيسية|Home/);

    // In RTL, the first tab is visually on the right
    const htmlDir = await page.locator('html').getAttribute('dir');
    if (htmlDir === 'rtl') {
      const firstBox = await navItems.first().boundingBox();
      const lastBox = await navItems.last().boundingBox();
      // First item's X coordinate should be greater than last item's X in RTL
      expect(firstBox.x).toBeGreaterThan(lastBox.x);
    }
  });

  test('Content wrap has padding-bottom preventing overlap with bottom-nav', async ({ page }) => {
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    const contentWrap = page.locator('.content-wrap');
    await expect(contentWrap).toBeVisible();

    const paddingBottom = await contentWrap.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).paddingBottom);
    });

    // Content padding-bottom should be at least 64px (around 88px)
    expect(paddingBottom).toBeGreaterThanOrEqual(64);
  });
});
