import { test, expect, devices } from '@playwright/test';
import {
  parseISODate,
  formatDate,
  formatISODate,
  buildISODateString,
  nightsBetween,
} from '../src/lib/formatters.js';

test.describe('Date Helper Functions Unit Tests', () => {
  test('parseISODate handles valid and invalid inputs safely', () => {
    expect(parseISODate(null)).toBeNull();
    expect(parseISODate(undefined)).toBeNull();
    expect(parseISODate('')).toBeNull();
    expect(parseISODate('invalid-date')).toBeNull();
    expect(parseISODate('2026/09/22')).toBeNull();

    const d = parseISODate('2026-09-22');
    expect(d).toBeInstanceOf(Date);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // September is 8 (0-indexed)
    expect(d.getDate()).toBe(22);
  });

  test('formatISODate formats dates without UTC shifts', () => {
    expect(formatISODate(null)).toBe('');
    expect(formatISODate('')).toBe('');
    expect(formatISODate('invalid')).toBe('');

    const d = new Date(2026, 8, 23); // 23 Sep 2026 local
    expect(formatISODate(d)).toBe('2026-09-23');
    expect(formatISODate('2026-09-23')).toBe('2026-09-23');
    expect(buildISODateString(2026, 9, 23)).toBe('2026-09-23');
  });

  test('nightsBetween calculates accurately and never throws', () => {
    expect(nightsBetween(null, null)).toBe(0);
    expect(nightsBetween('2026-09-22', '')).toBe(0);
    expect(nightsBetween('', '2026-09-24')).toBe(0);
    expect(nightsBetween('2026-09-24', '2026-09-22')).toBe(0); // End before start
    expect(nightsBetween('2026-09-22', '2026-09-22')).toBe(0); // Same day (0 nights)

    expect(nightsBetween('2026-09-22', '2026-09-23')).toBe(1);
    expect(nightsBetween('2026-09-20', '2026-09-25')).toBe(5);
    expect(nightsBetween('2026-09-30', '2026-10-02')).toBe(2); // Cross-month
  });

  test('formatDate formats safely and NEVER throws RangeError on empty/invalid dates', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
    expect(formatDate('invalid')).toBe('—');

    const formattedAr = formatDate('2026-09-22', 'ar');
    expect(formattedAr).not.toBe('—');
    expect(formattedAr.length).toBeGreaterThan(0);

    const formattedEn = formatDate('2026-09-22', 'en');
    expect(formattedEn).toContain('2026');
    expect(formattedEn).toContain('Sep');
  });
});

test.use({
  ...devices['Pixel 5'],
});

test.describe('Mobile Calendar Booking Interaction (Android/Pixel 5)', () => {

  test('Calendar works smoothly on mobile without white screen, with correct RTL order and range selection', async ({ page }) => {
    test.setTimeout(60000);
    const pageErrors = [];
    const consoleErrors = [];

    page.on('pageerror', (err) => {
      console.log('Page error:', err.message);
      pageErrors.push(err.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('hajzy_guest_mode', 'true');
      localStorage.setItem('hajzy_booking_dates', JSON.stringify({
        checkIn: '2026-09-22',
        checkOut: '2026-09-25',
        guests: 2,
      }));
    });
    await page.goto('/');

    // Navigate to property details
    const firstCard = page.locator('.property-card').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();

    // Click Book
    const bookBtn = page.locator('button:has-text("احجز"), button:has-text("حجز"), button:has-text("Book")').first();
    await expect(bookBtn).toBeVisible({ timeout: 10000 });
    await bookBtn.click();

    // Step 1 should be visible
    const checkoutShell = page.locator('.checkout-shell');
    await expect(checkoutShell).toBeVisible({ timeout: 10000 });

    // 1. Verify calendar weekday headers in Arabic
    const weekdays = page.locator('.calendar-weekdays span');
    await expect(weekdays).toHaveCount(7);
    const firstWeekdayText = await weekdays.first().textContent();
    expect(firstWeekdayText.trim()).toBe('سبت');

    // 2. Verify days from other months or past are disabled
    const mutedDays = page.locator('.calendar-day.muted');
    const mutedCount = await mutedDays.count();
    if (mutedCount > 0) {
      await expect(mutedDays.first()).toBeDisabled();
    }

    // 3. Test first click on an active day: sets check-in and clears check-out without crashing
    const activeDays = page.locator('.calendar-day:not([disabled])');
    const activeCount = await activeDays.count();
    expect(activeCount).toBeGreaterThanOrEqual(5);

    // Click on active day (e.g. index 3 = 24th)
    const dayToClick = activeDays.nth(3);
    const dayNumberClicked = (await dayToClick.textContent()).trim();
    await dayToClick.click();
    await page.waitForTimeout(300);

    // Checkout shell must remain visible (NO white screen)
    await expect(checkoutShell).toBeVisible();

    // Check-in input should now match the day clicked
    const checkInInput = page.locator('.date-picker-native-input').first();
    const checkInVal = await checkInInput.inputValue();
    expect(parseInt(checkInVal.split('-')[2], 10)).toBe(parseInt(dayNumberClicked, 10));

    // Check-out input should be empty
    const checkOutInput = page.locator('.date-picker-native-input').nth(1);
    const checkOutVal = await checkOutInput.inputValue();
    expect(checkOutVal).toBe('');

    // 4. Test clicking "متابعة" when check-out is empty -> should block and not navigate to Step 2
    const continueBtn = page.locator('.checkout-actions .primary-button');
    await continueBtn.click();
    await page.waitForTimeout(300);
    // Should still be on Step 1
    await expect(page.locator('.calendar-picker')).toBeVisible();

    // 5. Test second click on a later active day (e.g. index 5 = 26th): sets check-out
    const laterDay = activeDays.nth(5);
    const laterDayNumber = (await laterDay.textContent()).trim();
    await laterDay.click();
    await page.waitForTimeout(300);

    // Checkout shell still intact
    await expect(checkoutShell).toBeVisible();

    // Check-out input updated
    const checkOutValUpdated = await checkOutInput.inputValue();
    expect(parseInt(checkOutValUpdated.split('-')[2], 10)).toBe(parseInt(laterDayNumber, 10));

    // Check nights display is greater than 0
    const nightsText = await page.locator('.info-box:has-text("الليالي"), .info-box:has-text("Nights")').textContent();
    expect(nightsText).not.toContain('NaN');
    expect(nightsText).toMatch(/\d+\s*(ليلة|ليلتان|ليالٍ|nights|night)/);

    // 6. Test calendar navigation arrows
    const nextMonthBtn = page.locator('.calendar-arrow').last();
    await nextMonthBtn.click();
    await page.waitForTimeout(300);
    await expect(checkoutShell).toBeVisible();

    const prevMonthBtn = page.locator('.calendar-arrow').first();
    await prevMonthBtn.click();
    await page.waitForTimeout(300);
    await expect(checkoutShell).toBeVisible();

    // 7. Verify bottom action buttons are accessible
    await expect(continueBtn).toBeVisible();
    const backBtn = page.locator('.checkout-actions .secondary-button');
    await expect(backBtn).toBeVisible();

    // 8. Test language toggle inside checkout
    const langToggle = page.locator('.language-toggle').first();
    if (await langToggle.isVisible()) {
      await langToggle.click();
      await page.waitForTimeout(300);
      await expect(checkoutShell).toBeVisible();
      // In English, first weekday should be Sat
      const enFirstWeekday = await page.locator('.calendar-weekdays span').first().textContent();
      expect(enFirstWeekday.trim()).toBe('Sat');
    }

    // 9. Check for fatal errors
    const fatalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('status of 400') && !e.includes('Download the React DevTools')
    );
    expect(pageErrors.length).toBe(0);
    expect(fatalErrors.length).toBe(0);
  });
});
