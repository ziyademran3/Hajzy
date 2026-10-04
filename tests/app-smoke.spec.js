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
    await expect(page.locator('.topbar-actions > button')).toHaveCount(1);
    await expect(page.locator('.topbar-actions > button')).toHaveAttribute(
      'aria-label',
      /الإشعارات|Notifications/
    );

    // Verify search panel or compact search is visible
    const searchPanel = page.locator('.home-compact-search, .search-panel, .search-bar');
    await expect(searchPanel.first()).toBeVisible({ timeout: 10000 });

    // Verify stay cards exist
    const cards = page.locator('.property-card');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    await expect(cards.first().locator('button[data-testid="book-now-button"]'))
      .toHaveText(/^(احجز الآن|Book now)$/);
    await expect(cards.first().locator('.property-rating-badge .material-symbols-outlined'))
      .toHaveText('star');
    await expect(cards.first().locator('.property-rating-badge small'))
      .toHaveText(/\(\d+ تقييم\)|\(\d+ reviews\)/);
    await expect(cards.first().locator('.property-price-display'))
      .toContainText(/ج\.م\s*\/ ليلة|EGP \d[\d,]*\s*\/ night/);
    await expect(cards.first().locator('.title-block .property-location-display .material-symbols-outlined'))
      .toHaveText('location_on');
    await expect(cards.first().locator('.property-location-display')).not.toContainText('📍');

    const featureIcons = cards.first().locator('.property-meta-row .material-symbols-outlined');
    await expect(featureIcons).toHaveText(['people', 'wifi', 'local_parking']);
    const iconStyles = await featureIcons.evaluateAll((icons) => icons.map((icon) => {
      const style = getComputedStyle(icon);
      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontVariationSettings: style.fontVariationSettings,
      };
    }));
    expect(iconStyles.every((style) => style.fontFamily.includes('Material Symbols Outlined'))).toBe(true);
    expect(new Set(iconStyles.map((style) => style.fontSize)).size).toBe(1);
    expect(new Set(iconStyles.map((style) => style.fontVariationSettings)).size).toBe(1);

    // Verify bottom navigation is rendered
    await expect(page.locator('.bottom-nav, nav')).toBeVisible();

    // Ensure no fatal console errors occurred
    const fatalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('net::ERR_') && !e.includes('Failed to load resource')
    );
    expect(fatalErrors.length).toBe(0);
  });

  test('Homepage benefits appear once in a horizontally scrollable icon-and-title strip', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const benefits = page.getByTestId('home-benefits');
    const items = benefits.getByRole('listitem');

    await expect(items).toHaveCount(4);
    await expect(items).toContainText(['إقامة موثقة', 'دفع آمن', 'إلغاء مرن', 'كونسيرج 24/7']);
    await expect(benefits.locator('p, small')).toHaveCount(0);
    await expect(page.locator('.home-feature-grid, .feature-card')).toHaveCount(0);

    const { clientWidth, scrollWidth, overflowX } = await benefits.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      overflowX: getComputedStyle(element).overflowX,
    }));
    expect(overflowX).toBe('auto');
    expect(scrollWidth).toBeGreaterThan(clientWidth);
  });

  test('Total payments shows the date of the latest confirmed payment', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('hajzy_bookings', JSON.stringify([
        {
          id: 'payment-older',
          propertyId: 'alex-vista',
          reference: '#HZ-PAY-101',
          checkIn: '2026-11-10',
          checkOut: '2026-11-12',
          status: 'confirmed',
          total: 8400,
          paidAt: '2026-10-01T12:00:00.000Z',
        },
        {
          id: 'payment-latest',
          propertyId: 'cairo-nile-hotel',
          reference: '#HZ-PAY-102',
          checkIn: '2026-11-12',
          checkOut: '2026-11-14',
          status: 'confirmed',
          total: 9600,
          paidAt: '2026-10-02T12:00:00.000Z',
        },
        {
          id: 'pending-payment-later',
          propertyId: 'cairo-lounge',
          reference: '#HZ-PAY-103',
          checkIn: '2026-11-14',
          checkOut: '2026-11-16',
          status: 'pending_payment',
          total: 7200,
          paidAt: '2026-10-03T12:00:00.000Z',
        },
      ]));
    });
    await page.reload();
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: /رحلاتي|My Trips/i }).click();

    const paymentsCard = page.getByText('إجمالي المدفوعات', { exact: true }).locator('xpath=../..');
    await expect(paymentsCard.getByTestId('last-payment-date')).toHaveText('آخر دفعة: 2 أكتوبر');
    await expect(paymentsCard).not.toContainText('نشط');
  });

  test('Guest trips tab shows the trips title and luggage icon', async ({ page }) => {
    const tripsTab = page.locator('.bottom-nav .nav-item').filter({ hasText: 'رحلاتي' });
    await expect(tripsTab).toBeVisible();
    await expect(tripsTab.locator('.material-symbols-outlined')).toHaveText('luggage');
    await tripsTab.click();
    await expect(page.locator('.topbar h1')).toHaveText('رحلاتي');
  });

  test('Active bookings card shows a touch-sized tickets link with an RTL-aware arrow', async ({ page }) => {
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: /رحلاتي|My Trips/i }).click();

    const bookingsCard = page.getByText('الحجوزات النشطة', { exact: true }).locator('xpath=../..');
    const ticketsLink = bookingsCard.getByRole('button', { name: 'عرض تذاكر الحجز' });
    await expect(ticketsLink).toBeVisible();
    await expect(ticketsLink.locator('[aria-hidden="true"]')).toHaveText('‹');
    await expect.poll(() => ticketsLink.evaluate((element) => element.getBoundingClientRect().height))
      .toBeGreaterThanOrEqual(44);

    await ticketsLink.click();
    await expect(page.locator('.bottom-nav .nav-item').filter({ hasText: 'حجوزاتي' }))
      .toHaveClass(/active/);
  });

  test('Upcoming stay shows balanced date columns, separate years, guest count, and concise countdown', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-04T12:00:00') });
    const loadStay = async (checkIn, checkOut) => {
      await page.evaluate(({ checkIn: stayCheckIn, checkOut: stayCheckOut }) => {
        localStorage.setItem('hajzy_bookings', JSON.stringify([{
          id: 'upcoming-layout',
          propertyId: 'alex-vista',
          checkIn: stayCheckIn,
          checkOut: stayCheckOut,
          guests: 2,
          status: 'confirmed',
          total: 5000,
        }]));
      }, { checkIn, checkOut });
      await page.reload();
      await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
      await page.locator('.bottom-nav .nav-item').filter({ hasText: /رحلاتي|My Trips/i }).click();
    };

    await loadStay('2026-10-05', '2026-10-07');
    const staySection = page.locator('section').filter({
      has: page.getByRole('heading', { name: 'إقامتك القادمة المميزة' }),
    });
    const dateColumns = staySection.locator('.dashboard-stay-date');
    await expect(staySection).toContainText('بكرة');
    await expect(dateColumns.nth(0)).toContainText('5 أكتوبر');
    await expect(dateColumns.nth(0)).toContainText('2026');
    await expect(dateColumns.nth(1)).toContainText('7 أكتوبر');
    await expect(dateColumns.nth(1)).toContainText('2026');
    await expect(dateColumns.nth(2)).toHaveText('2 أشخاص');

    const columnWidths = await dateColumns.evaluateAll((dates) => dates.map((date) => (
      date.parentElement.getBoundingClientRect().width
    )));
    expect(Math.max(...columnWidths) - Math.min(...columnWidths)).toBeLessThanOrEqual(1);

    await loadStay('2026-10-04', '2026-10-06');
    await expect(page.locator('section').filter({
      has: page.getByRole('heading', { name: 'إقامتك القادمة المميزة' }),
    })).toContainText('اليوم');

    await loadStay('2026-10-11', '2026-10-13');
    await expect(page.locator('section').filter({
      has: page.getByRole('heading', { name: 'إقامتك القادمة المميزة' }),
    })).toContainText('بعد 7 أيام');
  });

  test('Hajzy Club shows current and next tier with gold loyalty progress', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('hajzy_bookings', JSON.stringify([{
        id: 'loyalty-progress',
        propertyId: 'alex-vista',
        checkIn: '2026-11-10',
        checkOut: '2026-11-12',
        status: 'confirmed',
        total: 6000,
      }]));
    });
    await page.reload();
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: /رحلاتي|My Trips/i }).click();

    const progress = page.getByRole('progressbar', { name: 'التقدم نحو المستوى التالي' });
    await expect(progress).toHaveAttribute('aria-valuenow', '6');
    await expect(progress).toHaveAttribute('aria-valuemax', '20');
    const progressRatio = await page.locator('.loyalty-progress-fill').evaluate((fill) => (
      fill.getBoundingClientRect().width / fill.parentElement.getBoundingClientRect().width
    ));
    expect(progressRatio).toBeCloseTo(0.3, 1);
    await expect(page.locator('.loyalty-tier-row')).toContainText('الحالي');
    await expect(page.locator('.loyalty-tier-row')).toContainText('عضو جديد');
    await expect(page.locator('.loyalty-tier-row')).toContainText('التالي');
    await expect(page.locator('.loyalty-tier-row')).toContainText('فضي');
    await expect(page.locator('main')).toContainText('6 من 20');

    const progressColors = await page.locator('.loyalty-progress-track, .loyalty-progress-fill')
      .evaluateAll((elements) => elements.map((element) => getComputedStyle(element).backgroundColor));
    expect(progressColors[0]).toBe('rgba(255, 255, 255, 0.16)');
    expect(progressColors[1]).toBe('rgb(212, 162, 76)');
  });

  test('Typography uses Cairo, the six-size scale, and only the three supported weights', async ({ page }) => {
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    const typography = await page.locator('#root').evaluate((root) => {
      const style = getComputedStyle(root);
      const probes = ['font-normal text-xs', 'font-semibold text-sm', 'font-bold text-3xl']
        .map((className) => {
          const probe = document.createElement('span');
          probe.className = className;
          root.appendChild(probe);
          const computed = getComputedStyle(probe);
          const result = { weight: computed.fontWeight, size: computed.fontSize };
          probe.remove();
          return result;
        });
      const heading = root.querySelector('h1, h2, h3, h4, h5, h6');
      return {
        family: style.fontFamily,
        sizes: ['12', '14', '16', '20', '24', '32'].map((size) => (
          style.getPropertyValue(`--type-${size}`).trim()
        )),
        weights: probes.map(({ weight }) => weight),
        utilitySizes: probes.map(({ size }) => size),
        headingWeight: heading ? getComputedStyle(heading).fontWeight : null,
      };
    });

    expect(typography.family).toContain('Cairo');
    expect(typography.sizes).toEqual(['12px', '14px', '16px', '20px', '24px', '32px']);
    expect(typography.utilitySizes).toEqual(['12px', '14px', '32px']);
    expect(typography.weights).toEqual(['400', '600', '700']);
    expect(typography.headingWeight).toBe('700');
  });

  test('Language switch toggles RTL/LTR and updates labels', async ({ page }) => {
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: /حسابي|Profile/i }).click();

    const langToggle = page.locator('#profile-settings .language-toggle');
    await expect(langToggle).toBeVisible();
    await expect(langToggle.locator('.language-toggle-text')).toHaveText('English');
    await expect(langToggle.locator('.material-symbols-outlined')).toHaveText('language');
    await expect(langToggle).not.toContainText(/[🇪🇬🇬🇧]/);
    const initialDir = await page.locator('html').getAttribute('dir');
    await langToggle.click();

    const newDir = await page.locator('html').getAttribute('dir');
    expect(newDir).not.toBe(initialDir);
    await expect(page.locator('#profile-settings .language-toggle-text')).toHaveText('العربية');
  });

  test('Theme toggle toggles dark mode attribute', async ({ page }) => {
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: /حسابي|Profile/i }).click();

    const themeToggle = page.locator('#profile-settings .theme-toggle');
    await expect(themeToggle).toBeVisible();
    const appShell = page.locator('.app-shell');
    const initialTheme = await appShell.getAttribute('data-theme');

    await themeToggle.click();
    const toggledTheme = await appShell.getAttribute('data-theme');
    expect(toggledTheme).not.toBe(initialTheme);

    const variantStyles = await page.locator('.app-shell').evaluate((shell) => {
      const buttons = ['primary-button', 'secondary-button', 'ghost-button'].map((variant) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = variant;
        shell.append(button);
        const style = getComputedStyle(button);
        const result = { height: style.height, radius: style.borderRadius };
        button.remove();
        return result;
      });
      return buttons;
    });
    expect(variantStyles).toEqual([
      { height: '48px', radius: '14px' },
      { height: '48px', radius: '14px' },
      { height: '48px', radius: '14px' },
    ]);
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
    expect(editButtonBounds.width).toBeGreaterThanOrEqual(44);
    expect(editButtonBounds.height).toBeGreaterThanOrEqual(44);
    const horizontalGap = Math.max(
      0,
      Math.max(nameBounds.x, editButtonBounds.x) - Math.min(nameBounds.x + nameBounds.width, editButtonBounds.x + editButtonBounds.width),
    );
    expect(horizontalGap).toBeLessThan(16);
    await expect(verificationBadge).toHaveCount(0);
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

  test('Profile shows only loyalty points, opens Hajzy Club, and verifies badges only for confirmed accounts', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('hajzy_user', JSON.stringify({
        id: 'profile-verification-test',
        name: 'عضو الاختبار',
        email: 'member@example.com',
        emailVerified: false,
        identityVerified: false,
      }));
    });
    await page.reload();
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: 'حسابي' }).click();

    const profile = page.locator('.profile-shell');
    await expect(profile.getByText('الحالة')).toHaveCount(0);
    await expect(profile.getByText('الأمان')).toHaveCount(0);
    await expect(profile.locator('.profile-verification-row')).toHaveCount(0);
    await expect(profile.getByRole('button', { name: 'فتح نادي Hajzy ونقاط الولاء' })).toBeVisible();
    await profile.getByRole('button', { name: 'فتح نادي Hajzy ونقاط الولاء' }).click();
    await expect(page.getByText('نادي Hajzy')).toBeVisible();

    await page.evaluate(() => {
      const user = JSON.parse(localStorage.getItem('hajzy_user'));
      user.emailVerified = true;
      localStorage.setItem('hajzy_user', JSON.stringify(user));
    });
    await page.reload();
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: 'حسابي' }).click();
    await expect(page.locator('.profile-verification-row')).toContainText('موثق');

    await page.evaluate(() => {
      const user = JSON.parse(localStorage.getItem('hajzy_user'));
      user.emailVerified = false;
      user.identityVerified = true;
      localStorage.setItem('hajzy_user', JSON.stringify(user));
    });
    await page.reload();
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: 'حسابي' }).click();
    await expect(page.locator('.profile-verification-row')).toContainText('موثق');
  });

  test('Profile invite action is a compact settings row that opens app sharing', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('hajzy_guest_mode', 'true');
    });
    await page.goto('/');
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 });
    await page.locator('.bottom-nav .nav-item').filter({ hasText: 'حسابي' }).click();

    const inviteButton = page.getByRole('button', { name: 'ادعُ صديقًا', exact: true });
    await expect(inviteButton).toBeVisible();
    await expect(inviteButton.locator('small')).toHaveText('شارك رابط التطبيق مع أصدقائك');
    await expect(inviteButton.locator('.settings-card-invite-arrow')).toHaveText('chevron_left');
    await expect(page.locator('.profile-shell > div:first-child').getByRole('button', {
      name: /مشاركة التطبيق|Share App/,
    })).toHaveCount(0);
    await page.evaluate(() => {
      window.__shareCalls = [];
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data) => window.__shareCalls.push(data),
      });
    });
    await inviteButton.click();
    await expect.poll(() => page.evaluate(() => window.__shareCalls.length)).toBe(1);
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
