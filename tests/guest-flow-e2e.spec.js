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

  test('Booking overflow action is a labeled 40px circle beside invoice and details', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('hajzy_bookings', JSON.stringify([{
        id: 'booking-actions-layout',
        propertyId: 'alex-vista',
        checkIn: '2026-11-10',
        checkOut: '2026-11-12',
        guests: 2,
        status: 'confirmed',
        total: 8400,
        currency: 'EGP',
      }]));
    });
    await page.reload();
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });

    await page.locator('.bottom-nav .nav-item').filter({ hasText: 'حجوزاتي' }).click();
    const bookingCard = page.locator('.booking-card').first();
    await expect(bookingCard).toBeVisible();

    const actions = bookingCard.locator('.booking-actions');
    const details = actions.locator('.booking-cta');
    const invoice = actions.locator('.booking-receipt');
    const more = actions.locator('.booking-actions-more');
    const [detailsBox, invoiceBox, moreBox] = await Promise.all([
      details.boundingBox(),
      invoice.boundingBox(),
      more.boundingBox(),
    ]);

    expect(Math.abs(detailsBox.y + detailsBox.height / 2 - invoiceBox.y - invoiceBox.height / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(invoiceBox.y + invoiceBox.height / 2 - moreBox.y - moreBox.height / 2)).toBeLessThanOrEqual(1);
    expect(moreBox.width).toBe(40);
    expect(moreBox.height).toBe(40);
    await expect(more).toHaveAttribute('aria-label', 'خيارات الحجز الإضافية');
    await more.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('Booking progress is readable, localized, and tracks the active step in both themes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('hajzy_bookings', JSON.stringify([{
        id: 'booking-progress-contrast',
        propertyId: 'alex-vista',
        checkIn: '2099-11-10',
        checkOut: '2099-11-12',
        guests: 2,
        status: 'confirmed',
        total: 8400,
        currency: 'EGP',
      }]));
    });
    await page.reload();
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: 'حجوزاتي' }).click();

    const card = page.locator('.booking-card').first();
    const progress = card.locator('.booking-progress-track');
    await expect(progress).toHaveAttribute('aria-label', 'مراحل الحجز');
    await expect(progress.locator('.booking-progress-label')).toHaveCount(4);
    await expect(progress.locator('.booking-progress-dot')).toHaveCount(4);
    await expect(progress.locator('[aria-current="step"]')).toHaveText('مؤكد');

    const contrastMetrics = async () => progress.evaluate((element) => {
      const parseColor = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
      const luminance = ([r, g, b]) => {
        const channels = [r, g, b].map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const contrast = (foreground, background) => {
        const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
        return (values[0] + 0.05) / (values[1] + 0.05);
      };
      const dark = element.closest('.app-shell').dataset.theme === 'dark';
      const backgrounds = dark ? [[18, 22, 28], [24, 30, 38]] : [[255, 255, 255], [246, 250, 248]];
      return ['current', 'upcoming']
        .map((state) => element.querySelector(`.booking-progress-label[data-state="${state}"]`))
        .filter(Boolean)
        .map((label) => {
          const foreground = parseColor(getComputedStyle(label).color);
          const style = getComputedStyle(label);
          return {
            color: style.color,
            fontSize: Number.parseFloat(style.fontSize),
            fontWeight: Number.parseInt(style.fontWeight, 10),
            contrast: Math.min(...backgrounds.map((background) => contrast(foreground, background))),
          };
        });
    });

    const assertReadable = async () => {
      const metrics = await contrastMetrics();
      expect(metrics).toHaveLength(2);
      for (const metric of metrics) {
        expect(metric.fontSize).toBeGreaterThanOrEqual(12);
        expect(metric.fontSize).toBeLessThanOrEqual(13);
        expect(metric.contrast).toBeGreaterThanOrEqual(4.5);
      }
      expect(metrics[0].color).not.toBe(metrics[1].color);
      expect(metrics[0].fontWeight).toBeGreaterThan(metrics[1].fontWeight);
    };

    await assertReadable();
    await page.locator('.theme-toggle').click();
    await expect(page.locator('.app-shell')).toHaveAttribute('data-theme', 'dark');
    await assertReadable();
  });

  test('Search card orders fields and keeps the search action full-width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const form = page.locator('#home-search-form');
    const destination = page.locator('#destination');
    const filterButton = page.locator('[data-testid="filter-toggle-button"]');
    const checkIn = page.locator('#check-in');
    const checkOut = page.locator('#check-out');
    const guests = page.locator('#guests');
    const submitButton = page.locator('[data-testid="search-submit"]');

    await expect(form).toBeVisible();
    const [formBox, destinationBox, filterBox, checkInBox, checkOutBox, guestsBox, submitBox] = await Promise.all([
      form.boundingBox(),
      destination.boundingBox(),
      filterButton.boundingBox(),
      checkIn.boundingBox(),
      checkOut.boundingBox(),
      guests.boundingBox(),
      submitButton.boundingBox(),
    ]);

    expect(destinationBox.y).toBeLessThan(checkInBox.y);
    expect(checkInBox.y).toBe(checkOutBox.y);
    expect(Math.abs(checkInBox.width - checkOutBox.width)).toBeLessThanOrEqual(1);
    expect(checkInBox.y).toBeLessThan(guestsBox.y);
    expect(guestsBox.y).toBeLessThan(submitBox.y);
    expect(submitBox.width).toBeCloseTo(formBox.width, 0);
    expect(filterBox.x + filterBox.width).toBeLessThanOrEqual(destinationBox.x);

    await filterButton.click();
    await expect(filterButton).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#home-filter-drawer')).toBeVisible();
  });

  test('2) Cold start on /search: search panel is visible and interactive', async ({ page }) => {
    await page.goto('/search?city=cairo');

    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    const destinationSelect = page.locator('#destination, [data-testid="search-destination"]');
    await expect(destinationSelect).toBeVisible({ timeout: 10000 });
  });

  test('Cairo uses a Nile photo and Giza hotel galleries lead with the property photo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });

    const cairoPhoto = page.locator('.mini-city-card').filter({ hasText: 'القاهرة' }).locator('img');
    const gizaPhoto = page.locator('.mini-city-card').filter({ hasText: 'الجيزة' }).locator('img');
    await expect(cairoPhoto).toHaveAttribute('src', /photo-1719659018185-8a239c35fb4a/);
    await expect(gizaPhoto).not.toHaveAttribute('src', /photo-1719659018185-8a239c35fb4a/);

    await page.getByRole('tab', { name: 'الجيزة' }).click();

    const pyramidHotel = page.locator('[data-property-id="giza-pyramid-hotel"]');
    const sphinxHotel = page.locator('[data-property-id="giza-sphinx-hotel"]');
    await expect(pyramidHotel.locator('.image-wrap img')).toHaveAttribute('src', /photo-1582719478250-c89cae4dc85b/);
    await expect(sphinxHotel.locator('.image-wrap img')).toHaveAttribute('src', /photo-1611892440504-42a792e24d32/);

    await pyramidHotel.click();
    await expect(page.locator('.gallery-strip .gallery-thumb img').nth(1))
      .toHaveAttribute('src', /photo-1503177119275-0aa32b3a9368/);
  });

  test('Featured stay card photos use loaded 4:3 cover images without inline gaps', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });

    const featuredImages = page.locator('.collection-item-image');
    await expect(featuredImages).toHaveCount(3);

    for (let index = 0; index < await featuredImages.count(); index += 1) {
      const frame = featuredImages.nth(index);
      await frame.scrollIntoViewIfNeeded();
      const image = frame.locator('img');
      await expect.poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);

      const measurements = await frame.evaluate((element) => {
        const frameBox = element.getBoundingClientRect()
        const image = element.querySelector('img')
        const imageBox = image.getBoundingClientRect()
        return {
          frameRatio: frameBox.width / frameBox.height,
          imageRatio: imageBox.width / imageBox.height,
          imageDisplay: getComputedStyle(image).display,
          imageFit: getComputedStyle(image).objectFit,
        }
      })

      expect(measurements.frameRatio).toBeCloseTo(4 / 3, 2)
      expect(measurements.imageRatio).toBeCloseTo(4 / 3, 2)
      expect(measurements.imageDisplay).toBe('block')
      expect(measurements.imageFit).toBe('cover')
    }
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

  test('7) Continue as guest button and demo accounts are not present on login page', async ({ page }) => {
    await page.goto('/login');

    const continueGuestBtn = page.locator('[data-testid="continue-as-guest"]');
    await expect(continueGuestBtn).not.toBeVisible();
    await expect(page.locator('text=user@hajzy.com')).not.toBeVisible();
  });
});
