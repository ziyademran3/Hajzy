import { test, expect } from '@playwright/test';

test.describe('Guest Flow & Auth Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any leftover state before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('1) Cold start without auth: Destination, Check-in, Check-out, and Guests controls are present and interactive', async ({ page }) => {
    await page.goto('/');

    // Verify main app shell is loaded directly without login gate
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });

    // Verify search form and inputs exist
    const destinationSelect = page.locator('#destination, [data-testid="search-destination"]');
    await expect(destinationSelect).toBeVisible({ timeout: 10000 });

    const checkInInput = page.locator('#check-in, [data-testid="search-checkin"]');
    await expect(checkInInput).toBeVisible({ timeout: 10000 });

    const checkOutInput = page.locator('#check-out, [data-testid="search-checkout"]');
    await expect(checkOutInput).toBeVisible({ timeout: 10000 });

    const guestsSelect = page.locator('#guests, [data-testid="search-guests"]');
    await expect(guestsSelect).toBeVisible({ timeout: 10000 });

    // Check interaction with Destination, Dates, and Guests
    await destinationSelect.selectOption({ index: 1 });
    await checkInInput.fill('2026-10-01');
    await checkOutInput.fill('2026-10-05');
    await guestsSelect.selectOption('2');

    // Submit search
    const submitBtn = page.locator('[data-testid="search-submit"], .search-submit-button');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();
  });

  test('2) Cold start on /search: search panel is visible and interactive', async ({ page }) => {
    await page.goto('/search?city=cairo');

    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    const destinationSelect = page.locator('#destination, [data-testid="search-destination"]');
    await expect(destinationSelect).toBeVisible({ timeout: 10000 });
  });

  test('3) Open a property from listings via property link or card', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });

    // Property cards should be visible
    const propertyCards = page.locator('[data-testid="property-card"], .property-card');
    await expect(propertyCards.first()).toBeVisible({ timeout: 15000 });
    const count = await propertyCards.count();
    expect(count).toBeGreaterThan(0);

    // Click the first property link/title or card
    const firstPropertyLink = page.locator('[data-testid="property-link"]').first();
    if (await firstPropertyLink.isVisible()) {
      await firstPropertyLink.click();
    } else {
      await propertyCards.first().click();
    }

    // Should navigate to property details view
    await expect(
      page.locator('[data-testid="property-details-view"], .detail-shell, .gallery-hero, [data-testid="details-book-now"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('4) Guest checkout with InstaPay: Reserve property, complete guest form, and reach booking confirmation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });

    // Open first property
    const firstPropertyLink = page.locator('[data-testid="property-link"]').first();
    if (await firstPropertyLink.isVisible()) {
      await firstPropertyLink.click();
    } else {
      await page.locator('[data-testid="property-card"], .property-card').first().click();
    }

    // On details view, click "Book now" to navigate to checkout
    const detailsBookNow = page.locator('[data-testid="details-book-now"], .details-card .primary-button').first();
    await expect(detailsBookNow).toBeVisible({ timeout: 10000 });
    await detailsBookNow.click();

    // Now in checkout step 1 (Dates)
    const step1Continue = page.locator('[data-testid="checkout-step1-continue"]');
    await expect(step1Continue).toBeVisible({ timeout: 10000 });
    await step1Continue.click();

    // Now in checkout step 2 (Guest Details)
    const fullNameInput = page.locator('#guest-full-name, [data-testid="guest-fullname"]');
    await expect(fullNameInput).toBeVisible({ timeout: 10000 });
    await fullNameInput.fill('أحمد محمود');

    const phoneInput = page.locator('#guest-phone, [data-testid="guest-phone"]');
    await phoneInput.fill('01012345678');

    const emailInput = page.locator('#guest-email, [data-testid="guest-email"]');
    await emailInput.fill('ahmed.test@example.com');

    const step2Continue = page.locator('[data-testid="checkout-step2-continue"]');
    await expect(step2Continue).toBeVisible();
    await step2Continue.click();

    // Now in checkout step 3 (Payment Method)
    const instapayRadio = page.locator('[data-testid="payment-instapay"]');
    await expect(instapayRadio).toBeVisible({ timeout: 10000 });
    await instapayRadio.check();

    const instapayHandleInput = page.locator('[data-testid="instapay-handle"]');
    if (await instapayHandleInput.isVisible()) {
      await instapayHandleInput.fill('ahmed@instapay');
    }

    // Confirm booking
    const confirmBtn = page.locator('[data-testid="confirm-booking-button"]');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Verify confirmation / voucher screen
    const successView = page.locator('[data-testid="booking-success-view"], .success-shell, [data-testid="booking-confirmation-heading"]');
    await expect(successView.first()).toBeVisible({ timeout: 15000 });
  });

  test('5) Sign in with seeded user account redirects to user dashboard', async ({ page }) => {
    // Force login screen
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('user@hajzy.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('TestPass123!');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Verify redirected away from login form and signed-in state is active
    await expect(page.locator('.login-card, input[type="password"]')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('.app-shell')).toBeVisible();

    // User dashboard or user badge should be visible
    const userIndicator = page.locator('.user-avatar, .user-badge, .profile-chip, [data-testid="user-profile"], .topbar');
    await expect(userIndicator.first()).toBeVisible();
  });

  test('6) Sign in with seeded owner account redirects to owner portal', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('owner@hajzy.com');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('TestPass123!');

    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Verify login form is gone
    await expect(page.locator('.login-card, input[type="password"]')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('.app-shell')).toBeVisible();

    // Owner view or owner navigation should be present (such as the Add Property form)
    const ownerIndicator = page.locator('.owner-shell, .owner-badge, [data-role="owner"], .tab-btn.active:has-text("لوحة المالك"), .tab-btn.active:has-text("Owner"), button:has-text("إضافة الشقة")');
    await expect(ownerIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('7) Continue as guest button on login page redirects to public marketplace', async ({ page }) => {
    await page.goto('/login');

    const continueGuestBtn = page.locator('[data-testid="continue-as-guest"]');
    await expect(continueGuestBtn).toBeVisible({ timeout: 10000 });
    await continueGuestBtn.click();

    // Verify public marketplace is rendered
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#destination, [data-testid="search-destination"]')).toBeVisible();
    await expect(page.locator('[data-testid="property-card"], .property-card').first()).toBeVisible();
  });
});
