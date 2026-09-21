import { test, expect } from '@playwright/test';

test.describe('City Cards and City Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('hajzy_guest_mode', 'true');
    });
    await page.goto('/');
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
  });

  test('Clicking Alexandria city card opens city page with Alexandria stays', async ({ page }) => {
    // Locate the Alexandria city card
    const alexCard = page.locator('.mini-city-card[href*="city=alexandria"]').first();
    await expect(alexCard).toBeVisible({ timeout: 10000 });

    // Click on Alexandria city card
    await alexCard.click();

    // Verify city page shell is rendered
    await expect(page.locator('.city-shell')).toBeVisible({ timeout: 10000 });

    // Verify city title displays Alexandria
    await expect(page.locator('.city-shell h1, .city-shell h2').filter({ hasText: /الإسكندرية|Alexandria/ }).first()).toBeVisible();

    // Verify URL updated to include city=alexandria
    expect(page.url()).toContain('city=alexandria');

    // Verify property cards for Alexandria are displayed
    const propertyCards = page.locator('.city-shell .property-card');
    await expect(propertyCards.first()).toBeVisible({ timeout: 10000 });
    const count = await propertyCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify card contains price, title, and book button
    await expect(propertyCards.first().locator('.price-box')).toBeVisible();
    await expect(propertyCards.first().locator('button', { hasText: /احجز الآن|Book now/ })).toBeVisible();
  });

  test('Clicking Cairo, Giza, Hurghada, and Sharm city cards open their respective city pages', async ({ page }) => {
    const cities = [
      { slug: 'cairo', nameMatch: /القاهرة|Cairo/ },
      { slug: 'giza', nameMatch: /الجيزة|Giza/ },
      { slug: 'hurghada', nameMatch: /الغردقة|Hurghada/ },
      { slug: 'sharm-el-sheikh', nameMatch: /شرم الشيخ|Sharm/ },
    ];

    for (const city of cities) {
      // Go to home first
      await page.goto('/');
      await expect(page.locator('.mini-city-grid')).toBeVisible({ timeout: 10000 });

      const cityCard = page.locator(`.mini-city-card[href*="city=${city.slug}"]`).first();
      await expect(cityCard).toBeVisible();
      await cityCard.click();

      // Verify city page
      await expect(page.locator('.city-shell')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('.city-shell h1, .city-shell h2').filter({ hasText: city.nameMatch }).first()).toBeVisible();
      expect(page.url()).toContain(`city=${city.slug}`);

      // Verify stays are shown
      const cards = page.locator('.city-shell .property-card');
      await expect(cards.first()).toBeVisible();
      expect(await cards.count()).toBeGreaterThanOrEqual(1);
    }
  });

  test('Direct URL navigation and page refresh work on city page', async ({ page }) => {
    // Navigate directly to Alexandria with URL param
    await page.goto('/?city=alexandria');
    await expect(page.locator('.city-shell')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.city-shell h1, .city-shell h2').filter({ hasText: /الإسكندرية|Alexandria/ }).first()).toBeVisible();

    // Refresh page and ensure city page persists
    await page.reload();
    await expect(page.locator('.city-shell')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.city-shell h1, .city-shell h2').filter({ hasText: /الإسكندرية|Alexandria/ }).first()).toBeVisible();
  });

  test('Empty city state displays friendly message and Back to Home button', async ({ page }) => {
    // Navigate to a non-existent city
    await page.goto('/?city=non-existent-city');
    await expect(page.locator('.city-shell')).toBeVisible({ timeout: 15000 });

    // Empty state should be visible
    const emptyState = page.locator('.city-shell .empty-state');
    await expect(emptyState).toBeVisible({ timeout: 10000 });
    await expect(emptyState).toContainText(/لا توجد إقامات|No stays/);

    // Clicking "العودة للرئيسية" / "Back to Home" should return to home page
    const backHomeBtn = emptyState.locator('button', { hasText: /العودة للرئيسية|Back to Home/ });
    await expect(backHomeBtn).toBeVisible();
    await backHomeBtn.click();

    // Verify back on home page
    await expect(page.locator('.mini-city-grid').first()).toBeVisible({ timeout: 10000 });
  });

  test('Back button in City Page header returns to Home page', async ({ page }) => {
    await page.goto('/?city=alexandria');
    await expect(page.locator('.city-shell')).toBeVisible({ timeout: 15000 });

    // Find back button in top nav
    const backBtn = page.locator('.city-top-nav button', { hasText: /الرئيسية|Home/ });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Verify returned to home
    await expect(page.locator('.mini-city-grid').first()).toBeVisible({ timeout: 10000 });
  });

  test('Clicking property details button in city card opens details view', async ({ page }) => {
    await page.goto('/?city=alexandria');
    await expect(page.locator('.city-shell')).toBeVisible({ timeout: 15000 });

    const firstCard = page.locator('.city-shell .property-card').first();
    await expect(firstCard).toBeVisible();

    const detailsBtn = firstCard.locator('button', { hasText: /تفاصيل الحجز|Details/ });
    await expect(detailsBtn).toBeVisible();
    await detailsBtn.click();

    // Verify details page is opened
    await expect(page.locator('.detail-shell').first()).toBeVisible({ timeout: 10000 });
  });

  test('Clicking Book now button on city card opens checkout confirmation', async ({ page }) => {
    await page.goto('/?city=alexandria');
    await expect(page.locator('.city-shell')).toBeVisible({ timeout: 15000 });

    const firstCard = page.locator('.city-shell .property-card').first();
    await expect(firstCard).toBeVisible();

    const bookBtn = firstCard.locator('button', { hasText: /احجز الآن|Book now/ });
    await expect(bookBtn).toBeVisible();
    await bookBtn.click();

    // Verify checkout page is opened
    await expect(page.locator('.checkout-shell').first()).toBeVisible({ timeout: 10000 });
  });
});
