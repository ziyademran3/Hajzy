import { test, expect } from '@playwright/test'
import {
  getBookedDaysForProperty,
  getOwnerBookingMetrics,
  getSmartLockCodeStatus,
} from '../src/lib/ownerBookingMetrics.js'
import { getOwnerMetricsPeriodRange } from '../src/lib/ownerMetricsPeriod.js'
import { getOwnerOperationalAlerts } from '../src/lib/ownerOperationalAlerts.js'
import { getOwnerReviewMetrics } from '../src/lib/ownerReviewMetrics.js'

test('shared reporting periods expose consistent current and comparison date ranges', () => {
  const now = new Date(2026, 9, 9, 12)

  expect(getOwnerMetricsPeriodRange('thisWeek', now)).toMatchObject({
    startDate: new Date(2026, 9, 5),
    endDate: new Date(2026, 9, 10),
    previousStartDate: new Date(2026, 8, 30),
    previousEndDate: new Date(2026, 9, 5),
    days: 5,
  })
  expect(getOwnerMetricsPeriodRange('lastSevenDays', now)).toMatchObject({
    startDate: new Date(2026, 9, 3),
    endDate: new Date(2026, 9, 10),
    days: 7,
  })
  expect(getOwnerMetricsPeriodRange('lastThirtyDays', now)).toMatchObject({
    startDate: new Date(2026, 8, 10),
    endDate: new Date(2026, 9, 10),
    days: 30,
  })
  expect(getOwnerMetricsPeriodRange('lastNinetyDays', now)).toMatchObject({
    startDate: new Date(2026, 6, 12),
    endDate: new Date(2026, 9, 10),
    previousStartDate: new Date(2026, 3, 13),
    previousEndDate: new Date(2026, 6, 12),
    days: 90,
  })
  expect(getOwnerMetricsPeriodRange('thisMonth', now)).toMatchObject({
    startDate: new Date(2026, 9, 1),
    endDate: new Date(2026, 9, 10),
    previousStartDate: new Date(2026, 8, 1),
    previousEndDate: new Date(2026, 8, 10),
    days: 9,
  })
})

test('owner occupancy and request metrics use active booking nights and request statuses', () => {
  const properties = [{ id: 'property-1' }, { id: 'property-2' }]
  const bookings = [
    { property_id: 'property-1', start_date: '2026-10-01', end_date: '2026-10-04', status: 'confirmed' },
    { propertyId: 'property-2', checkIn: '2026-10-14', checkOut: '2026-10-16', status: 'confirmed' },
    { propertyId: 'property-2', checkIn: '2026-10-15', checkOut: '2026-10-17', status: 'pending' },
    { propertyId: 'property-1', checkIn: '2026-10-02', checkOut: '2026-10-05', status: 'cancelled' },
  ]
  const metrics = getOwnerBookingMetrics(bookings, properties, new Date(2026, 9, 15, 12))

  expect(metrics.totalRequests).toBe(4)
  expect(metrics.activeBookingsCount).toBe(3)
  expect(metrics.confirmedBookingsCount).toBe(2)
  expect(metrics.pendingRequestsCount).toBe(1)
  expect(metrics.bookingConversionPercent).toBe(75)
  expect(metrics.confirmedRequestPercent).toBe(50)
  expect(metrics.monthlyOccupancyPercent).toBeCloseTo((6 / 62) * 100)
  expect(metrics.previousMonthOccupancyPercent).toBe(0)
  expect(metrics.monthlyOccupancyChangePoints).toBeCloseTo((6 / 62) * 100)
  expect(metrics.lastSevenDays.find(({ date }) => date.getDate() === 15).occupancyPercent).toBe(50)
})

test('occupancy comparison uses the same booking-night formula for this month and last month', () => {
  const bookings = [
    { propertyId: 'property-1', checkIn: '2026-09-01', checkOut: '2026-09-02', status: 'confirmed' },
    { propertyId: 'property-1', checkIn: '2026-10-01', checkOut: '2026-10-03', status: 'confirmed' },
  ]
  const metrics = getOwnerBookingMetrics(bookings, [{ id: 'property-1' }], new Date(2026, 9, 15))

  expect(metrics.previousMonthOccupancyPercent).toBeCloseTo((1 / 30) * 100)
  expect(metrics.monthlyOccupancyPercent).toBeCloseTo((2 / 31) * 100)
  expect(metrics.monthlyOccupancyChangePoints).toBeCloseTo(((2 / 31) - (1 / 30)) * 100)
})

test('owner rating comparison uses reviews dated in the selected and previous periods', () => {
  const metrics = getOwnerReviewMetrics([
    { rating: 4, date: '2026-10-04' },
    { rating: 5, date: '2026-10-08' },
    { rating: 3, date: '2026-09-27' },
    { rating: 1, date: '2026-09-20' },
  ], new Date(2026, 9, 10, 12), 'lastSevenDays')

  expect(metrics.averageRating).toBe(4.5)
  expect(metrics.previousAverageRating).toBe(3)
  expect(getOwnerReviewMetrics([], new Date(2026, 9, 10), 'lastSevenDays')).toEqual({
    averageRating: null,
    previousAverageRating: null,
  })
})

test('owner operational alerts only include time-sensitive or actionable items', () => {
  const now = new Date(2026, 9, 10, 10)
  const properties = [{ id: 'lock-property' }, { id: 'gap-property' }]
  const alerts = getOwnerOperationalAlerts([
    {
      id: 'reply-soon',
      propertyId: 'lock-property',
      status: 'pending',
      createdAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'reply-later',
      propertyId: 'lock-property',
      status: 'pending',
      createdAt: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'lock-expiring',
      propertyId: 'lock-property',
      status: 'confirmed',
      checkIn: '2026-10-08',
      checkOut: '2026-10-10',
    },
    {
      id: 'gap-before',
      propertyId: 'gap-property',
      status: 'confirmed',
      checkIn: '2026-10-15',
      checkOut: '2026-10-16',
    },
    {
      id: 'gap-after',
      propertyId: 'gap-property',
      status: 'confirmed',
      checkIn: '2026-10-17',
      checkOut: '2026-10-18',
    },
  ], properties, [
    { id: 'low-review', propertyId: 'gap-property', rating: 2, date: '2026-10-08' },
    { id: 'good-review', propertyId: 'gap-property', rating: 4, date: '2026-10-08' },
    { id: 'old-review', propertyId: 'gap-property', rating: 1, date: '2026-09-30' },
  ], now)

  expect(alerts.map(({ type }) => type)).toEqual([
    'pendingRequest',
    'smartLockExpiry',
    'calendarGap',
    'lowReview',
  ])
  expect(alerts[0].bookingId).toBe('reply-soon')
  expect(alerts[0].dueAt).toEqual(new Date(now.getTime() + 60 * 60 * 1000))
  expect(alerts[2].date).toEqual(new Date(2026, 9, 16))
  expect(alerts[3].rating).toBe(2)
})

test('owner operational alerts return no routine items when there is nothing actionable', () => {
  const alerts = getOwnerOperationalAlerts([
    {
      id: 'future-booking',
      propertyId: 'property-1',
      status: 'confirmed',
      checkIn: '2026-10-12',
      checkOut: '2026-10-14',
    },
  ], [{ id: 'property-1' }], [
    { propertyId: 'property-1', rating: 4, date: '2026-10-08' },
  ], new Date(2026, 9, 10, 10))

  expect(alerts).toEqual([])
})

test('owner pending requests without a request timestamp remain actionable without an invented deadline', () => {
  const alerts = getOwnerOperationalAlerts([{
    id: 'request-without-time',
    propertyId: 'property-1',
    status: 'pending',
    createdAt: '2026-10-10',
  }], [{ id: 'property-1' }], [], new Date(2026, 9, 10, 10))

  expect(alerts).toMatchObject([{
    type: 'pendingRequest',
    dueAt: null,
    overdue: false,
  }])
})

test('owner dashboard compares bookings, occupancy, revenue and ratings against the previous period', async ({ page }) => {
  await page.addInitScript(() => {
    const ownerId = 'owner-period-comparison-test'
    const propertyId = 'period-comparison-property'
    const dateAtOffset = (days) => {
      const date = new Date()
      date.setDate(date.getDate() + days)
      date.setHours(12, 0, 0, 0)
      return date
    }
    const isoDate = (date) => (
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    )
    const isoDateTime = (days) => dateAtOffset(days).toISOString()

    localStorage.clear()
    localStorage.setItem('hajzy_user', JSON.stringify({ id: ownerId, role: 'owner', name: 'Test Owner' }))
    localStorage.setItem('hajzy_properties', JSON.stringify([{
      id: propertyId,
      ownerId,
      title: 'Period comparison property',
      city: 'القاهرة',
      location: 'Test location',
      priceValue: 1000,
      rating: 4,
      reviews: 2,
      images: [],
    }]))
    localStorage.setItem('hajzy_bookings', JSON.stringify([
      {
        id: 'current-booking-1',
        propertyId,
        status: 'confirmed',
        createdAt: isoDateTime(-2),
        paidAt: isoDateTime(-2),
        checkIn: isoDate(dateAtOffset(-4)),
        checkOut: isoDate(dateAtOffset(-3)),
        total: 1200,
      },
      {
        id: 'current-booking-2',
        propertyId,
        status: 'confirmed',
        createdAt: isoDateTime(-3),
        paidAt: isoDateTime(-3),
        checkIn: isoDate(dateAtOffset(-8)),
        checkOut: isoDate(dateAtOffset(-7)),
        total: 800,
      },
      {
        id: 'previous-booking',
        propertyId,
        status: 'confirmed',
        createdAt: isoDateTime(-35),
        paidAt: isoDateTime(-35),
        checkIn: isoDate(dateAtOffset(-36)),
        checkOut: isoDate(dateAtOffset(-35)),
        total: 1000,
      },
    ]))
    localStorage.setItem('hajzy_reviews', JSON.stringify({
      [propertyId]: [
        { id: 'current-review-1', rating: 4, date: isoDate(dateAtOffset(-2)) },
        { id: 'current-review-2', rating: 5, date: isoDate(dateAtOffset(-3)) },
        { id: 'previous-review', rating: 3, date: isoDate(dateAtOffset(-35)) },
      ],
    }))
  })
  await page.route('**/rest/v1/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }))
  await page.goto('/')

  const ownerDashboard = page.locator('.owner-shell')
  await expect(ownerDashboard).toBeVisible()
  const metrics = ownerDashboard.locator('#owner-overview-panel .owner-summary-card')
  await expect(metrics).toHaveCount(4)
  await expect(metrics.nth(0).locator('small')).toContainText('▲ 100%')
  await expect(metrics.nth(0).locator('small')).toHaveClass(/positive/)
  await expect(metrics.nth(1).locator('small')).toContainText('▲ 100%')
  await expect(metrics.nth(1).locator('small')).toHaveClass(/positive/)
  await expect(metrics.nth(2).locator('small')).toContainText('▲ 100%')
  await expect(metrics.nth(2).locator('small')).toHaveClass(/positive/)
  await expect(metrics.nth(3).locator('small')).toContainText('مقارنة بالفترة السابقة (آخر 30 يومًا)')
  await expect(metrics.nth(3).locator('small')).toContainText(/[▲▼→]/)
  await expect(metrics.nth(3)).not.toContainText('info')
})

test('calendar booked days match active bookings and exclude checkout dates and cancellations', () => {
  const bookings = [
    { propertyId: 'property-1', checkIn: '2026-10-01', checkOut: '2026-10-04', status: 'confirmed' },
    { propertyId: 'property-1', checkIn: '2026-10-02', checkOut: '2026-10-08', status: 'cancelled' },
    { propertyId: 'property-2', checkIn: '2026-10-14', checkOut: '2026-10-16', status: 'pending' },
  ]

  expect(getBookedDaysForProperty(bookings, 'property-1', 2026, 9)).toEqual([1, 2, 3])
  expect(getBookedDaysForProperty(bookings, 'property-2', 2026, 9)).toEqual([14, 15])
  expect(getBookedDaysForProperty(bookings, null, 2026, 9)).toEqual([])
})

test('smart lock code status follows the linked confirmed booking expiry', () => {
  const now = new Date(2026, 9, 5, 13)
  const bookings = [
    { propertyId: 'property-1', checkIn: '2026-10-06', checkOut: '2026-10-08', status: 'confirmed' },
    { propertyId: 'property-1', checkIn: '2026-10-07', checkOut: '2026-10-09', status: 'pending' },
  ]

  expect(getSmartLockCodeStatus(bookings, 'property-1', now)).toEqual({
    status: 'active',
    expiresAt: new Date(2026, 9, 8, 12),
  })
  expect(getSmartLockCodeStatus([
    { propertyId: 'property-1', checkIn: '2026-09-28', checkOut: '2026-09-30', status: 'completed' },
  ], 'property-1', now)).toEqual({
    status: 'expired',
    expiresAt: new Date(2026, 8, 30, 12),
  })
  expect(getSmartLockCodeStatus([
    { propertyId: 'property-1', checkIn: '2026-10-06', checkOut: '2026-10-08', status: 'pending' },
  ], 'property-1', now)).toEqual({ status: 'unlinked', expiresAt: null })
  expect(getSmartLockCodeStatus([], 'property-1', now)).toEqual({ status: 'unlinked', expiresAt: null })
})

test('empty requests show no conversion rates while occupancy uses available inventory', () => {
  const metrics = getOwnerBookingMetrics([], [{ id: 'property-1' }], new Date(2026, 9, 15))
  const noInventory = getOwnerBookingMetrics([], [], new Date(2026, 9, 15))

  expect(metrics.bookingConversionPercent).toBeNull()
  expect(metrics.confirmedRequestPercent).toBeNull()
  expect(metrics.monthlyOccupancyPercent).toBe(0)
  expect(metrics.monthlyOccupancyChangePoints).toBe(0)
  expect(noInventory.monthlyOccupancyPercent).toBeNull()
  expect(noInventory.monthlyOccupancyChangePoints).toBeNull()
})

test('owner booking tab shows the confirmed-request acceptance rate for the selected period', async ({ page }) => {
  await page.addInitScript(() => {
    const ownerId = 'owner-acceptance-rate-test'
    const createdAt = new Date().toISOString()
    localStorage.setItem('hajzy_user', JSON.stringify({ id: ownerId, role: 'owner', name: 'Test Owner' }))
    localStorage.setItem('hajzy_bookings', JSON.stringify([
      { id: 'confirmed-request', propertyId: 'alex-vista', status: 'confirmed', createdAt },
      { id: 'pending-request', propertyId: 'alex-vista', status: 'pending', createdAt },
    ]))
  })
  await page.route('**/rest/v1/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }))
  await page.goto('/')

  const ownerDashboard = page.locator('.owner-shell')
  await expect(ownerDashboard).toBeVisible()
  await page.getByRole('tab', { name: 'الحجوزات' }).click()

  const acceptanceMetric = ownerDashboard.locator('#owner-booking-metrics-panel .owner-summary-card').nth(1)
  await expect(acceptanceMetric.locator('span')).toHaveText('نسبة قبول الطلبات')
  await expect(acceptanceMetric.locator('strong')).toHaveText('50%')
  await expect(acceptanceMetric.locator('small')).toHaveText('الطلبات المؤكدة ÷ إجمالي الطلبات خلال الفترة')
})

test('owner occupancy metrics expose selectable seven-day and current-month daily series', () => {
  const metrics = getOwnerBookingMetrics([], [{ id: 'property-1' }], new Date(2026, 9, 8, 12))

  expect(metrics.lastSevenDays).toHaveLength(7)
  expect(metrics.currentMonthDays).toHaveLength(31)
  expect(metrics.currentMonthDays[0].date).toEqual(new Date(2026, 9, 1))
  expect(metrics.currentMonthDays[30].date).toEqual(new Date(2026, 9, 31))
})

test('booking ratios and pending counts use the selected reporting period', () => {
  const bookings = [
    { status: 'pending', createdAt: '2026-10-02T12:00:00', checkIn: '2026-10-10', checkOut: '2026-10-12' },
    { status: 'confirmed', createdAt: '2026-10-03T12:00:00', checkIn: '2026-10-08', checkOut: '2026-10-10' },
    { status: 'cancelled', createdAt: '2026-10-06T12:00:00', checkIn: '2026-10-15', checkOut: '2026-10-17' },
    { status: 'pending', createdAt: '2026-10-09T12:00:00', checkIn: '2026-10-20', checkOut: '2026-10-22' },
    { status: 'confirmed', createdAt: '2026-09-29T12:00:00', checkIn: '2026-10-03', checkOut: '2026-10-04' },
  ]
  const metrics = getOwnerBookingMetrics(
    bookings,
    [{ id: 'property-1' }],
    new Date(2026, 9, 9, 12),
    'lastSevenDays',
  )

  expect(metrics.totalRequests).toBe(3)
  expect(metrics.activeBookingsCount).toBe(2)
  expect(metrics.confirmedBookingsCount).toBe(1)
  expect(metrics.pendingRequestsCount).toBe(2)
  expect(metrics.periodPendingRequestsCount).toBe(1)
  expect(metrics.bookingConversionPercent).toBeCloseTo((2 / 3) * 100)
  expect(metrics.confirmedRequestPercent).toBeCloseTo((1 / 3) * 100)
  expect(metrics.dailyOccupancy).toHaveLength(7)
})

test('owner dashboard shows empty booking metrics while the bell counts unread notifications', async ({ page }) => {
  test.setTimeout(45000)
  await page.addInitScript(() => {
    const ownerId = 'owner-metrics-test'
    localStorage.setItem('hajzy_user', JSON.stringify({ id: ownerId, role: 'owner', name: 'Test Owner' }))
    localStorage.setItem('hajzy_bookings', JSON.stringify([]))
    localStorage.setItem(`hajzy_notifications_${ownerId}`, JSON.stringify([
      { id: 'unread-1', read: false, readAt: null },
      { id: 'unread-2', read: false, readAt: null },
    ]))
  })
  await page.route('**/rest/v1/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }))
  await page.goto('/')

  const ownerDashboard = page.locator('.owner-shell')
  await expect(ownerDashboard).toBeVisible()
  await expect(ownerDashboard.locator('.owner-summary-grid .owner-summary-card').first()).toContainText('نقطة مئوية مقارنة بالفترة السابقة')
  await expect(ownerDashboard.locator('.owner-dashboard-header')).not.toContainText('Owner Portal')
  await expect(ownerDashboard.locator('.owner-dashboard-header')).not.toContainText('إضافة عقار')
  await expect(ownerDashboard.locator('.owner-summary-grid .owner-summary-card').nth(2).locator('strong')).toContainText('ساعة')
  await expect(ownerDashboard.locator('.owner-action-rail')).not.toContainText('مراجعة الطلبات')
  await expect(ownerDashboard.locator('.owner-feature-banner')).toHaveCount(0)
  await expect(ownerDashboard.locator('.owner-action-rail .secondary-button')).toHaveCount(2)
  await expect(ownerDashboard.locator('.owner-summary-grid .owner-summary-card').nth(1).locator('strong')).toHaveText('—')
  await expect(page.locator('.notification-button .notification-badge')).toHaveText('2')

  const ownerNavigation = page.getByRole('tablist', { name: 'التنقل في لوحة المالك' })
  await expect(ownerNavigation.getByRole('tab').locator('.nav-label')).toHaveText([
    'نظرة عامة',
    'العقارات',
    'الحجوزات',
    'الأرباح',
  ])
  await expect(ownerNavigation.locator('#owner-tab-bookings .owner-nav-pending-badge')).toHaveCount(0)
  await expect(ownerDashboard.locator('#owner-overview-panel')).toBeVisible()
  await expect(ownerDashboard.locator('#owner-overview-panel')).not.toContainText('نظرة سريعة')
  await expect(ownerDashboard.locator('#owner-overview-panel .owner-overview-card')).toHaveCount(0)
  await expect(ownerDashboard.locator('#owner-overview-panel .owner-progress-list')).toHaveCount(0)
  await expect(ownerDashboard.locator('#owner-alerts-panel .status-pill.neutral')).toHaveCount(0)
  await expect(ownerDashboard.locator('#owner-alerts-panel .status-pill.success')).toHaveCount(0)
  const ownerAlerts = ownerDashboard.locator('#owner-alerts-panel')
  await expect(ownerAlerts.locator('.owner-alert-empty span').last()).toHaveText('كل شيء على ما يرام')
  await expect(ownerAlerts.locator('.owner-alert-row')).toHaveCount(0)
  await expect(ownerAlerts).not.toContainText('لا توجد طلبات معلقة')
  const ownerPeriodFilter = ownerDashboard.locator('.owner-period-toolbar')
  await expect(ownerDashboard.locator('.owner-period-toolbar')).toHaveCount(1)
  await expect(ownerPeriodFilter.getByRole('button')).toHaveCount(3)
  await expect(ownerPeriodFilter.getByRole('button')).toHaveText([
    'آخر 7 أيام',
    'آخر 30 يومًا',
    'آخر 90 يومًا',
  ])
  await ownerPeriodFilter.getByRole('button', { name: 'آخر 7 أيام' }).click()
  expect(await page.evaluate(() => localStorage.getItem('hajzy_owner_metrics_period_owner-metrics-test'))).toBe('lastSevenDays')
  await page.reload()
  await expect(ownerDashboard.locator('.owner-period-toolbar').getByRole('button', { name: 'آخر 7 أيام' })).toHaveAttribute('aria-pressed', 'true')
  const quickActions = ownerDashboard.locator('.owner-quick-actions')
  await expect(quickActions.getByRole('button')).toHaveCount(4)
  await expect(quickActions).toHaveCSS('grid-template-columns', /.+/)
  await expect(quickActions.locator('.owner-quick-action-icon').first()).toHaveCSS('width', '48px')
  await expect(quickActions.locator('.owner-quick-action-label').first()).toHaveCSS('white-space', 'nowrap')

  await quickActions.getByRole('button', { name: 'تصدير تقرير' }).click()
  await expect(ownerDashboard.locator('#owner-revenue-panel')).toBeVisible()
  const sharedPeriodFilter = ownerDashboard.locator('.owner-period-toolbar')
  await expect(sharedPeriodFilter.getByRole('button', { name: 'آخر 7 أيام' })).toHaveAttribute('aria-pressed', 'true')
  await sharedPeriodFilter.getByRole('button', { name: 'آخر 30 يومًا' }).click()
  await expect(ownerDashboard.locator('#owner-revenue-panel')).toContainText('لا توجد إيرادات مدفوعة ومؤكدة خلال آخر 30 يومًا.')
  expect(await page.evaluate(() => localStorage.getItem('hajzy_owner_metrics_period_owner-metrics-test'))).toBe('lastThirtyDays')
  const reportDownload = page.waitForEvent('download')
  await ownerDashboard.locator('#owner-revenue-panel').getByRole('button', { name: 'تصدير التقرير' }).click()
  expect((await reportDownload).suggestedFilename()).toBe('owner-report.csv')
  await ownerNavigation.getByRole('tab', { name: 'نظرة عامة' }).click()
  await expect(ownerDashboard.locator('.owner-period-toolbar').getByRole('button', { name: 'آخر 30 يومًا' })).toHaveAttribute('aria-pressed', 'true')
  await ownerNavigation.getByRole('tab', { name: 'الحجوزات' }).click()
  await expect(ownerDashboard.locator('#owner-booking-metrics-panel .owner-summary-card').first()).toContainText('مقارنة بالفترة السابقة')
  await ownerNavigation.getByRole('tab', { name: 'نظرة عامة' }).click()

  await quickActions.getByRole('button', { name: 'إرسال رسالة' }).click()
  await expect(page.locator('.chat-shell')).toBeVisible()
  await expect(page.locator('.chat-shell .chat-title strong')).toHaveText(/\S+/)
  await page.locator('.chat-shell button[aria-label="رجوع"]').click()
  await expect(ownerDashboard.locator('#owner-overview-panel')).toBeVisible()

  await quickActions.getByRole('button', { name: 'تحديث الأسعار' }).click()
  await expect(ownerDashboard.locator('.owner-property-detail')).toBeVisible()
  await expect(ownerDashboard.locator('.host-calendar-manager-card')).toBeVisible()
  await ownerDashboard.getByRole('button', { name: 'العودة إلى العقارات' }).click()
  await ownerNavigation.getByRole('tab', { name: 'نظرة عامة' }).click()

  await quickActions.getByRole('button', { name: 'إدارة العقارات' }).click()
  await expect(ownerDashboard.locator('#owner-properties-panel')).toBeVisible()
  await ownerNavigation.getByRole('tab', { name: 'نظرة عامة' }).click()

  await ownerNavigation.getByRole('tab', { name: 'العقارات' }).click()
  await expect(ownerDashboard.locator('#owner-overview-panel')).toBeHidden()
  await expect(ownerDashboard.locator('#owner-properties-panel')).toBeVisible()
  const propertySection = ownerDashboard.locator('.owner-listings').first()
  await expect(propertySection).toContainText('15 عقارًا')
  await expect(propertySection.locator('.owner-form-head h3')).toHaveText('العقارات المضافة')
  const firstPropertyTitle = (await propertySection.locator('.owner-card h4').first().textContent())?.trim()
  await expect(ownerDashboard.locator('.owner-form')).toHaveCount(0)
  const addPropertyFab = ownerDashboard.getByRole('button', { name: 'إضافة عقار جديد' })
  await expect(addPropertyFab).toBeVisible()
  await expect(ownerDashboard.locator('.owner-action-rail')).not.toContainText('إضافة عقار')
  await expect(ownerDashboard.locator('.host-calendar-manager-card')).toHaveCount(0)
  await addPropertyFab.click()
  await expect(ownerDashboard.locator('.owner-form')).toContainText('عنوان العقار')
  await expect(addPropertyFab).toHaveCount(0)
  const propertyCity = ownerDashboard.locator('.owner-form select')
  const propertyLocation = ownerDashboard.locator('.owner-form input').nth(1)
  await expect(propertyCity).toHaveValue('')
  await expect(propertyCity.locator('option').first()).toHaveText('اختر المدينة')
  await expect(propertyCity).toHaveAttribute('required', '')
  await expect(propertyLocation).toHaveAttribute('placeholder', 'اختر المدينة أولًا لعرض مثال للموقع')
  await propertyCity.selectOption('القاهرة')
  await expect(propertyLocation).toHaveAttribute('placeholder', 'مثال: شارع النيل، القاهرة')
  await propertyCity.selectOption('الإسكندرية')
  await expect(propertyLocation).toHaveAttribute('placeholder', 'مثال: شارع الكورنيش، الإسكندرية')
  await propertyCity.selectOption('شرم الشيخ')
  await expect(propertyLocation).toHaveAttribute('placeholder', 'مثال: خليج نعمة، شرم الشيخ')
  await propertyCity.selectOption('القاهرة')
  const propertyDescription = ownerDashboard.locator('.owner-form textarea').nth(0)
  const bookingInfo = ownerDashboard.locator('.owner-form textarea').nth(1)
  await expect(propertyDescription).toHaveAttribute('maxlength', '500')
  await expect(bookingInfo).toHaveAttribute('maxlength', '500')
  await expect(propertyDescription).toHaveCSS('resize', 'none')
  await expect(bookingInfo).toHaveCSS('resize', 'none')
  await expect(ownerDashboard.locator('#owner-description-count')).toHaveText('0/500 حرفًا')
  await expect(ownerDashboard.locator('#owner-booking-info-count')).toHaveText('0/500 حرفًا')
  const initialDescriptionHeight = await propertyDescription.evaluate((element) => element.getBoundingClientRect().height)
  await propertyDescription.fill('وصف إقامة مميز. '.repeat(20))
  await expect(ownerDashboard.locator('#owner-description-count')).toHaveText(
    `${('وصف إقامة مميز. '.repeat(20)).length}/500 حرفًا`,
  )
  await expect.poll(() => propertyDescription.evaluate((element) => element.getBoundingClientRect().height))
    .toBeGreaterThan(initialDescriptionHeight)
  await bookingInfo.fill('معلومات الحجز '.repeat(12))
  await expect(ownerDashboard.locator('#owner-booking-info-count')).toHaveText(
    `${('معلومات الحجز '.repeat(12)).length}/500 حرفًا`,
  )
  await ownerDashboard.locator('.owner-form').getByRole('button', { name: 'إضافة عقار' }).click()
  await expect(ownerDashboard.locator('.owner-form')).toContainText(
    'يرجى تعبئة عنوان العقار والمدينة والموقع والسعر قبل الحفظ',
  )

  await propertySection.locator('.owner-card').first().getByRole('button', { name: 'تفاصيل العقار' }).click()
  await expect(ownerDashboard.locator('.owner-property-detail-heading h3')).toHaveText(firstPropertyTitle)
  await expect(ownerDashboard.locator('.owner-dashboard-header')).toHaveCount(0)
  await expect(ownerDashboard.locator('#owner-leading-properties-panel')).toBeHidden()
  const propertyTabs = ownerDashboard.getByRole('tablist', { name: 'أقسام تفاصيل العقار' })
  await expect(propertyTabs.getByRole('tab')).toHaveCount(4)
  await expect(ownerDashboard.locator('.owner-property-overview')).toBeVisible()
  await expect(ownerDashboard.locator('.owner-property-overview .property-rating-badge')).toHaveCount(0)

  await propertyTabs.getByRole('tab', { name: 'التقويم والأسعار' }).click()
  await expect(ownerDashboard.locator('.host-calendar-manager-card')).toContainText(
    `إدارة مواعيد الحجز وأسعار العقار: ${firstPropertyTitle}`,
  )
  await expect(ownerDashboard.locator('.calendar-day-cell.booked')).toHaveCount(0)
  await expect(ownerDashboard.locator('.passcode-display')).toHaveCount(0)

  await propertyTabs.getByRole('tab', { name: 'القفل الذكي' }).click()
  await expect(ownerDashboard.locator('.host-calendar-manager-card')).toContainText('غير مرتبط بحجز')
  await expect(ownerDashboard.locator('.host-calendar-manager-card')).toContainText('لا يوجد كود نشط')
  await expect(ownerDashboard.locator('.host-calendar-manager-card')).not.toContainText('8492')
  await expect(ownerDashboard.locator('.host-calendar-manager-card').getByRole('button', { name: 'توليد جديد' })).toHaveCount(0)
  await expect(ownerDashboard.locator('.calendar-day-cell')).toHaveCount(0)

  await propertyTabs.getByRole('tab', { name: 'التقييمات' }).click()
  await expect(ownerDashboard.locator('.owner-property-reviews-summary')).toContainText(firstPropertyTitle)
  await expect(ownerDashboard.locator('.owner-property-reviews')).toBeVisible()
  const reviewsFilter = ownerDashboard.locator('.owner-reviews-filter select')
  await expect(reviewsFilter.locator('option:checked')).toHaveText(firstPropertyTitle)
  await reviewsFilter.selectOption('all')
  await expect(ownerDashboard.locator('.owner-review-item').first()).toBeVisible()
  await reviewsFilter.selectOption({ label: firstPropertyTitle })
  const firstReview = ownerDashboard.locator('.owner-review-item').first()
  await firstReview.getByRole('button', { name: 'رد' }).click()
  await firstReview.locator('textarea').fill('شكرًا لمشاركتك تجربتك، سعداء باستضافتك.')
  await firstReview.getByRole('button', { name: 'حفظ الرد' }).click()
  await expect(firstReview.locator('.owner-review-reply')).toContainText(
    'شكرًا لمشاركتك تجربتك، سعداء باستضافتك.',
  )
  await ownerDashboard.getByRole('button', { name: 'العودة إلى العقارات' }).click()
  await expect(propertySection).toBeVisible()
  await expect(ownerDashboard.locator('.owner-dashboard-header')).toBeVisible()
  await expect(ownerDashboard.locator('#owner-leading-properties-panel')).toBeVisible()

  const secondPropertyCard = propertySection.locator('.owner-card').nth(1)
  const secondPropertyTitle = (await secondPropertyCard.locator('h4').textContent())?.trim()
  await secondPropertyCard.getByRole('button', { name: 'تفاصيل العقار' }).click()
  await expect(ownerDashboard.locator('.owner-property-detail-heading h3')).toHaveText(secondPropertyTitle)
  await propertyTabs.getByRole('tab', { name: 'التقويم والأسعار' }).click()
  await expect(ownerDashboard.locator('.host-calendar-manager-card')).toContainText(
    `إدارة مواعيد الحجز وأسعار العقار: ${secondPropertyTitle}`,
  )
  await ownerDashboard.getByRole('button', { name: 'العودة إلى العقارات' }).click()

  await ownerNavigation.getByRole('tab', { name: 'الحجوزات' }).click()
  await expect(ownerDashboard.locator('#owner-bookings-panel')).toBeVisible()
  await expect(ownerDashboard.locator('#owner-booking-overview-panel')).toHaveCount(0)
  await expect(ownerDashboard.locator('.owner-table-card')).toHaveCount(0)
  await expect(ownerDashboard.locator('.owner-booking-card')).toHaveCount(0)
  await expect(ownerDashboard.locator('#owner-properties-panel')).toBeHidden()

  await ownerNavigation.getByRole('tab', { name: 'الأرباح' }).click()
  await expect(ownerDashboard.locator('#owner-revenue-panel')).toBeVisible()
  await expect(ownerDashboard.locator('#owner-revenue-panel').getByRole('button', { name: 'تصدير التقرير' })).toBeVisible()
  await expect(ownerDashboard.locator('#owner-bookings-panel')).toBeHidden()

  await ownerNavigation.getByRole('tab', { name: 'العقارات' }).click()
  await propertySection.locator('.owner-card').first().getByRole('button', { name: 'تعديل' }).click()
  await expect(ownerDashboard.locator('.owner-form')).toBeVisible()
  await expect(ownerDashboard.locator('.owner-form .owner-form-head h3')).toHaveText('تعديل العقار')
  await ownerDashboard.locator('.owner-form').getByRole('button', { name: 'إلغاء' }).click()
  await expect(ownerDashboard.locator('.owner-form')).toHaveCount(0)
  await expect(ownerDashboard.getByRole('button', { name: 'إضافة عقار جديد' })).toBeVisible()
})

test('owner dashboard text wraps without horizontal overflow at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.addInitScript(() => {
    const ownerId = 'owner-mobile-copy-test'
    localStorage.setItem('hajzy_user', JSON.stringify({ id: ownerId, role: 'owner', name: 'Test Owner' }))
    localStorage.setItem('hajzy_bookings', JSON.stringify([{
      id: 'mobile-booking-1',
      propertyId: 'sharm-naama-hotel',
      title: 'فندق نعمة باي',
      location: 'نعمة باي، شرم الشيخ',
      image: '',
      status: 'confirmed',
      checkIn: '2030-06-15',
      checkOut: '2030-06-17',
      total: 4200,
      currency: 'EGP',
    }]))
  })
  await page.route('**/rest/v1/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }))
  await page.goto('/')

  const ownerDashboard = page.locator('.owner-shell')
  await expect(ownerDashboard).toBeVisible()
  const location = ownerDashboard.locator('.mini-booking-item span').first()
  await expect(location).toHaveText('نعمة باي، شرم الشيخ')
  await expect(location).toHaveCSS('-webkit-line-clamp', '2')

  const overviewOverflow = await ownerDashboard.evaluate((element) => (
    element.scrollWidth - element.clientWidth
  ))
  expect(overviewOverflow).toBeLessThanOrEqual(1)

  const ownerNavigation = page.getByRole('tablist', { name: 'التنقل في لوحة المالك' })
  await ownerNavigation.getByRole('tab', { name: 'الحجوزات' }).click()
  const bookingCard = ownerDashboard.locator('#owner-bookings-panel .owner-booking-card')
  await expect(bookingCard).toBeVisible()
  const bookingDates = bookingCard.locator('.booking-footer small')
  await expect(bookingDates).toHaveCSS('-webkit-line-clamp', '2')

  const bookingsOverflow = await ownerDashboard.evaluate((element) => (
    element.scrollWidth - element.clientWidth
  ))
  expect(bookingsOverflow).toBeLessThanOrEqual(1)
})

test('owner overview shows three latest bookings and the bookings tab is the only full list', async ({ page }) => {
  await page.addInitScript(() => {
    const ownerId = 'owner-recent-bookings-test'
    const createdAtDates = [
      '2026-10-01T10:00:00.000Z',
      '2026-10-04T10:00:00.000Z',
      '2026-10-07T10:00:00.000Z',
      '2026-10-08T10:00:00.000Z',
    ]
    localStorage.clear()
    localStorage.setItem('hajzy_user', JSON.stringify({ id: ownerId, role: 'owner', name: 'Test Owner' }))
    localStorage.setItem('hajzy_bookings', JSON.stringify(createdAtDates.map((createdAt, index) => ({
      id: `recent-booking-${index + 1}`,
      propertyId: 'alex-vista',
      title: `Recent test booking ${index + 1}`,
      location: 'Test location',
      status: index % 2 ? 'pending' : 'confirmed',
      createdAt,
      checkIn: '2026-10-20',
      checkOut: '2026-10-22',
      total: 1000 + index,
    }))))
  })
  await page.route('**/rest/v1/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }))
  await page.goto('/')

  const ownerDashboard = page.locator('.owner-shell')
  const ownerNavigation = page.getByRole('tablist', { name: 'التنقل في لوحة المالك' })
  const recentBookingItems = ownerDashboard.locator('.owner-recent-bookings-panel .mini-booking-item')
  await expect(recentBookingItems).toHaveCount(3)
  await expect(recentBookingItems.locator('strong').nth(0)).toHaveText('Recent test booking 4')
  await expect(recentBookingItems.locator('strong').nth(2)).toHaveText('Recent test booking 3')
  await expect(recentBookingItems.locator('strong').nth(4)).toHaveText('Recent test booking 2')

  const quickTasks = ownerDashboard.locator('.owner-task-list')
  await expect(quickTasks).toContainText('مراجعة الطلبات المعلقة')
  await expect(quickTasks).toContainText('2')
  await expect(quickTasks).toContainText('بانتظار المراجعة')
  await expect(quickTasks).not.toContainText('تحديث وصف العقار الرئيسي')
  await expect(quickTasks).not.toContainText('إرسال رسالة ترحيب')
  await quickTasks.getByRole('button', { name: /مراجعة الطلبات المعلقة/ }).click()
  await expect(ownerDashboard.locator('#owner-bookings-panel')).toBeVisible()
  await ownerNavigation.getByRole('tab', { name: 'نظرة عامة' }).click()

  await ownerDashboard.locator('.owner-recent-bookings-panel').getByRole('button', { name: 'عرض الكل' }).click()
  await expect(ownerDashboard.locator('#owner-bookings-panel')).toBeVisible()
  await expect(ownerDashboard.locator('.owner-booking-card')).toHaveCount(4)
  await expect(ownerDashboard.locator('#owner-bookings-panel')).not.toContainText('أحدث الحجوزات')
  await expect(ownerDashboard.locator('#owner-bookings-panel')).not.toContainText('قائمة الحجوزات')
  await expect(ownerDashboard.locator('#owner-bookings-panel').getByRole('button', { name: 'مراجعة الطلبات المعلقة' })).toBeVisible()
  await ownerDashboard.locator('#owner-bookings-panel').getByRole('button', { name: 'مراجعة الطلبات المعلقة' }).click()
  await expect(ownerDashboard.locator('#owner-bookings-panel').getByRole('tab', { name: /قيد المراجعة/ })).toHaveAttribute('aria-selected', 'true')
  await expect(ownerNavigation.getByRole('tab', { name: /الحجوزات.*عدد الطلبات المعلقة/ })).toBeVisible()
  await expect(ownerNavigation.locator('#owner-tab-bookings .owner-nav-pending-badge')).toHaveText('2')
  await ownerNavigation.getByRole('tab', { name: 'نظرة عامة' }).click()
  const occupancyPeriodFilter = ownerDashboard.locator('.owner-period-toolbar')
  await occupancyPeriodFilter.getByRole('button', { name: 'آخر 7 أيام' }).click()
  await ownerNavigation.getByRole('tab', { name: 'الحجوزات' }).click()
  await expect(ownerDashboard.locator('#owner-booking-metrics-panel .owner-chart-bar-wrap')).toHaveCount(7)
  await occupancyPeriodFilter.getByRole('button', { name: 'آخر 90 يومًا' }).click()
  await expect(ownerDashboard.locator('.owner-period-toolbar').getByRole('button', { name: 'آخر 90 يومًا' })).toHaveAttribute('aria-pressed', 'true')
  await ownerNavigation.getByRole('tab', { name: 'الحجوزات' }).click()
  await expect(ownerDashboard.locator('#owner-booking-metrics-panel .owner-chart-bar-wrap')).toHaveCount(90)
})

test('owner quick task opens editing for a property with fewer than three photos', async ({ page }) => {
  await page.addInitScript(() => {
    const ownerId = 'owner-property-photo-task-test'
    localStorage.clear()
    localStorage.setItem('hajzy_user', JSON.stringify({ id: ownerId, role: 'owner', name: 'Test Owner' }))
    localStorage.setItem('hajzy_properties', JSON.stringify([{
      id: 'photo-task-property',
      ownerId,
      title: 'Photo task property',
      city: 'القاهرة',
      location: 'Test location',
      priceValue: 1200,
      image: 'https://example.com/property.jpg',
      images: ['https://example.com/property.jpg'],
    }]))
  })
  await page.route('**/rest/v1/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }))
  await page.goto('/')

  const ownerDashboard = page.locator('.owner-shell')
  const photoTask = ownerDashboard.locator('.owner-task-list').getByRole('button', {
    name: /أكمل صور العقار.*Photo task property.*1 من 3 صور/,
  })
  await expect(photoTask).toBeVisible()
  await photoTask.click()
  await expect(ownerDashboard.locator('#owner-properties-panel .owner-form')).toBeVisible()
  await expect(ownerDashboard.locator('#owner-properties-panel .owner-form .owner-form-head h3')).toHaveText('تعديل العقار')
})
