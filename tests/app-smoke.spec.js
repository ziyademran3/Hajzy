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
      await expect(langToggle.locator('.language-toggle-text')).toHaveText('English');
      await expect(langToggle.locator('.material-symbols-outlined')).toHaveText('language');
      await expect(langToggle).not.toContainText(/[🇪🇬🇬🇧]/);
      const initialDir = await page.locator('html').getAttribute('dir');
      await langToggle.click();

      const newDir = await page.locator('html').getAttribute('dir');
      expect(newDir).not.toBe(initialDir);
      await expect(page.locator('.language-toggle').first().locator('.language-toggle-text')).toHaveText('العربية');
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

  test('Login page renders properly with form fields and submit button', async ({ page }) => {
    // Clear localStorage to test unauthenticated visitor experience
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('hajzy_force_login', 'true');
    });
    await page.goto('/');

    // Email input and submit button should be visible on login page
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Property details renders share button and bookings page displays offline booking card', async ({ page }) => {
    // Navigate with guest mode
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('hajzy_guest_mode', 'true');
      localStorage.setItem('hajzy_offline_booking', JSON.stringify({
        id: 'test-offline-1',
        reference: '#REF-TEST99',
        propertyTitle: 'فيلا الساحل الشمالي الفاخرة',
        propertyLocation: 'الساحل الشمالي',
        checkIn: '2026-09-20',
        checkOut: '2026-09-25',
        total: 15000,
        currency: 'EGP',
        selfCheckInInstructions: 'الكود السري لباب الفيلا: 4482',
      }));
    });
    await page.goto('/');

    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });

    // Open first property card
    const firstCard = page.locator('.property-card').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    // Verify share button is visible on property details gallery
    const shareBtn = page.locator('.gallery-share');
    await expect(shareBtn).toBeVisible({ timeout: 10000 });

    // Click on Bookings tab in bottom navigation
    const bookingsNav = page.locator('.bottom-nav .nav-item').filter({ hasText: /حجوزاتي|Bookings/i });
    if (await bookingsNav.isVisible()) {
      await bookingsNav.click();

      // Verify offline booking card is visible
      const offlineCard = page.locator('.offline-booking-card');
      await expect(offlineCard).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=#REF-TEST99')).toBeVisible();
      await expect(page.locator('text=الكود السري لباب الفيلا')).toBeVisible();
    }
  });

  test('Profile page renders successfully with cover, stats, and settings without white screen', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('hajzy_guest_mode', 'true');
    });
    await page.goto('/');

    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });

    const profileNav = page.locator('.bottom-nav .nav-item').filter({ hasText: /حسابي|الملف|Profile/i });
    await expect(profileNav).toBeVisible({ timeout: 10000 });
    await profileNav.click();

    // Verify profile shell and details load
    await expect(page.locator('.profile-shell')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#profile-settings')).toBeVisible({ timeout: 10000 });
  });

  test('Account name and phone can be edited while email remains locked', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('hajzy_user', JSON.stringify({
        id: 'profile-edit-test',
        name: 'الاسم القديم',
        email: 'locked@example.com',
        phone: '',
      }));
    });
    await page.reload();
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: 'حسابي' }).click();

    const accountDetails = page.locator('.profile-details').filter({ has: page.getByRole('heading', { name: 'تفاصيل الحساب' }) });
    const headerEditButton = page.locator('.profile-edit-button');
    const profileName = page.locator('.profile-identity-row h2');
    const verificationBadge = page.locator('.profile-verification-row');
    const editButtonBounds = await headerEditButton.boundingBox();
    const nameBounds = await profileName.boundingBox();
    const badgeBounds = await verificationBadge.boundingBox();
    expect(editButtonBounds.width).toBeGreaterThanOrEqual(44);
    expect(editButtonBounds.height).toBeGreaterThanOrEqual(44);
    const horizontalGap = Math.max(
      0,
      Math.max(nameBounds.x, editButtonBounds.x) - Math.min(nameBounds.x + nameBounds.width, editButtonBounds.x + editButtonBounds.width),
    );
    expect(horizontalGap).toBeLessThan(16);
    expect(badgeBounds.y).toBeGreaterThanOrEqual(nameBounds.y + nameBounds.height);
    await expect(accountDetails.getByText('لم يحدد')).toBeVisible();
    await expect(accountDetails.locator('input[name="email"]')).toHaveCount(0);
    await expect(accountDetails.getByLabel('البريد الإلكتروني غير قابل للتعديل')).toBeVisible();

    await headerEditButton.click();
    const nameInput = accountDetails.locator('#profile-name-input');
    const phoneInput = accountDetails.locator('#profile-phone-input');
    await expect(nameInput).toBeVisible();
    await expect(phoneInput).toHaveAttribute('placeholder', 'أدخل رقم الهاتف');
    await expect(accountDetails.locator('input[name="email"]')).toHaveCount(0);
    await nameInput.fill('الاسم الجديد');
    await phoneInput.fill('+201012345678');
    await accountDetails.getByRole('button', { name: 'حفظ' }).click();

    await expect(accountDetails.getByRole('status')).toHaveText('تم حفظ بيانات الحساب بنجاح.');
    await expect(accountDetails.getByText('الاسم الجديد')).toBeVisible();
    await expect(accountDetails.getByText('+201012345678')).toBeVisible();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('hajzy_user')).name)).toBe('الاسم الجديد');

    await page.locator('.profile-edit-button').click();
    await accountDetails.locator('#profile-name-input').fill('تغيير غير محفوظ');
    await accountDetails.getByRole('button', { name: 'إلغاء' }).click();
    await expect(accountDetails.getByText('الاسم الجديد')).toBeVisible();
  });

  test('Profile settings expose persistent notification and privacy switches with notification details', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('hajzy_guest_mode', 'true');
    });
    await page.goto('/');
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: 'حسابي' }).click();

    const languageToggle = page.locator('#profile-settings .language-toggle');
    await expect(languageToggle.locator('.language-toggle-text')).toHaveText('English');
    await expect(languageToggle.locator('.material-symbols-outlined')).toHaveText('language');
    await expect(languageToggle).not.toContainText(/[🇪🇬🇬🇧]/);
    await languageToggle.click();
    await expect(page.locator('#profile-settings .language-toggle-text')).toHaveText('العربية');
    await languageToggle.click();
    await expect(page.locator('#profile-settings .language-toggle-text')).toHaveText('English');

    const notificationsSwitch = page.getByRole('switch', { name: 'تشغيل أو إيقاف الإشعارات' });
    const privacySwitch = page.getByRole('switch', { name: 'تفعيل أو إيقاف خصوصية الحساب' });
    await expect(notificationsSwitch).toHaveAttribute('aria-checked', 'true');
    await expect(privacySwitch).toHaveAttribute('aria-checked', 'true');
    const switchBounds = await notificationsSwitch.boundingBox();
    expect(Math.abs(switchBounds.width - 46)).toBeLessThan(1);
    expect(Math.abs(switchBounds.height - 26)).toBeLessThan(1);

    await notificationsSwitch.click();
    await privacySwitch.click();
    await expect(notificationsSwitch).toHaveAttribute('aria-checked', 'false');
    await expect(privacySwitch).toHaveAttribute('aria-checked', 'false');
    await expect.poll(() => page.evaluate(async () => {
      const { createNotification, getUserNotifications } = await import('/src/lib/notificationService.js');
      createNotification('guest-demo', { title: { ar: 'اختبار', en: 'Test' } });
      return getUserNotifications('guest-demo').length;
    })).toBe(0);

    await page.reload();
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: 'حسابي' }).click();
    await expect(page.getByRole('switch', { name: 'تشغيل أو إيقاف الإشعارات' })).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByRole('switch', { name: 'تفعيل أو إيقاف خصوصية الحساب' })).toHaveAttribute('aria-checked', 'false');

    await page.getByRole('button', { name: 'تفاصيل الإشعارات' }).click();
    await expect(page.locator('.notifications-shell')).toBeVisible({ timeout: 10000 });
  });

  test('Security password fields use one border, strength feedback, confirmation, and a guarded save button', async ({ page }) => {
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: 'حسابي' }).click();

    const security = page.locator('.profile-security-section');
    const currentPassword = security.getByTestId('current-password-input');
    const newPassword = security.getByTestId('new-password-input');
    const confirmPassword = security.getByTestId('confirm-password-input');
    const saveButton = security.getByTestId('change-password-button');

    await expect(currentPassword).toBeVisible();
    await expect(newPassword).toBeVisible();
    await expect(confirmPassword).toBeVisible();
    await expect(saveButton).toBeDisabled();
    await expect(security.locator('.password-strength')).toContainText('أدخل كلمة مرور');

    const assertSingleFieldBorder = async () => {
      const fieldStyles = await security.locator('.password-field').evaluateAll((fields) => fields.map((field) => ({
        wrapperBorder: getComputedStyle(field).borderTopWidth,
        inputBorder: getComputedStyle(field.querySelector('input')).borderTopWidth,
      })));
      expect(fieldStyles).toHaveLength(3);
      for (const field of fieldStyles) {
        expect(field.wrapperBorder).toBe('0px');
        expect(field.inputBorder).toBe('1px');
      }
    };

    await assertSingleFieldBorder();
    await page.locator('.theme-toggle').click();
    await expect(page.locator('.app-shell')).toHaveAttribute('data-theme', 'dark');
    await assertSingleFieldBorder();
    await page.locator('.theme-toggle').click();

    await currentPassword.fill('CurrentPass1!');
    await expect(saveButton).toBeDisabled();
    await newPassword.fill('NewPassword9!');
    await expect(security.locator('.password-strength')).toContainText('قوية جداً');
    await expect(saveButton).toBeDisabled();
    await confirmPassword.fill('NewPassword9!');
    await expect(saveButton).toBeEnabled();
    await expect(confirmPassword).toHaveValue('NewPassword9!');
  });
});
