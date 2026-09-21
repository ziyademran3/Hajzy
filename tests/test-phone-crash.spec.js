import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['Pixel 5'],
});

test.describe('Guest Phone Input Mobile Tests (Android/Chrome emulation)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('hajzy_guest_mode', 'true');
      localStorage.setItem('hajzy_booking_dates', JSON.stringify({
        checkIn: '2026-10-01',
        checkOut: '2026-10-05',
        guests: 2
      }));
    });
    await page.goto('/');
  });

  test('Focusing and typing/autofilling on mobile does not crash into white screen', async ({ page }) => {
    const pageErrors = [];
    const consoleErrors = [];

    page.on('pageerror', (err) => {
      console.log('[PAGE ERROR]:', err.message);
      pageErrors.push(err.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to property details
    const firstCard = page.locator('.property-card').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();

    // Click Book
    const bookBtn = page.locator('button:has-text("احجز"), button:has-text("حجز"), button:has-text("Book")').first();
    await expect(bookBtn).toBeVisible({ timeout: 10000 });
    await bookBtn.click();

    // Step 1 should be visible
    await expect(page.locator('.checkout-shell')).toBeVisible({ timeout: 10000 });

    // Move to Step 2
    const step2Btn = page.locator('.booking-progress-steps button').nth(1);
    await step2Btn.click();

    const phoneInput = page.locator('#guest-phone');
    const nameInput = page.locator('#guest-full-name');
    const emailInput = page.locator('#guest-email');

    await expect(phoneInput).toBeVisible({ timeout: 10000 });

    // Fill name and email first
    await nameInput.fill('Ziad Emran');
    await emailInput.fill('ziad@example.com');

    // 1. Focus on phone input (virtual keyboard opening simulation)
    await phoneInput.focus();
    await page.setViewportSize({ width: 393, height: 430 });
    await page.waitForTimeout(300);

    // Ensure the checkout page is still completely intact (no white screen)
    await expect(page.locator('.checkout-shell')).toBeVisible();

    // 2. Test manual typing
    await phoneInput.fill('01024688333');
    await page.waitForTimeout(300);
    await expect(page.locator('.checkout-shell')).toBeVisible();

    // 3. Test Autofill suggestion with spaces and country code: "+20 102 468 8333"
    await phoneInput.fill('+20 102 468 8333');
    await page.waitForTimeout(300);
    await expect(page.locator('.checkout-shell')).toBeVisible();

    // 4. Test Autofill suggestion local: "01022777320"
    await phoneInput.fill('01022777320');
    await page.waitForTimeout(300);
    await expect(page.locator('.checkout-shell')).toBeVisible();

    // 5. Test Arabic numerals: "٠١٠٢٢٧٧٧٣٢٠"
    await phoneInput.fill('٠١٠٢٢٧٧٧٣٢٠');
    await page.waitForTimeout(300);
    await expect(page.locator('.checkout-shell')).toBeVisible();

    // 6. Blur field
    await phoneInput.blur();
    await page.waitForTimeout(300);
    await expect(page.locator('.checkout-shell')).toBeVisible();

    // 7. Proceed to Payment (Step 3)
    const continueBtn = page.locator('button:has-text("متابعة للدفع"), button:has-text("Continue to payment")');
    await continueBtn.click();

    // Should transition to Step 3 smoothly
    await expect(page.locator('.booking-trust-panel, .payment-card').first()).toBeVisible({ timeout: 10000 });

    // Check errors
    const fatalErrors = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('status of 400'));
    expect(pageErrors.length).toBe(0);
    expect(fatalErrors.length).toBe(0);
  });

  test('Dark mode and Language switch in checkout work without white screen', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // Open first property
    await page.locator('.property-card').first().click();
    const bookBtn = page.locator('button:has-text("احجز"), button:has-text("حجز"), button:has-text("Book")').first();
    await bookBtn.click();

    // Toggle theme
    const themeToggle = page.locator('.theme-toggle, [aria-label*="theme"], [aria-label*="مظهر"]').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(200);
    }

    // Toggle language
    const langToggle = page.locator('.language-toggle').first();
    if (await langToggle.isVisible()) {
      await langToggle.click();
      await page.waitForTimeout(300);
    }

    // Go to step 2
    const step2Btn = page.locator('.booking-progress-steps button').nth(1);
    await step2Btn.click();

    const phoneInput = page.locator('#guest-phone');
    await expect(phoneInput).toBeVisible();
    await phoneInput.fill('+20 102 468 8333');
    await phoneInput.blur();

    expect(pageErrors.length).toBe(0);
  });
});
