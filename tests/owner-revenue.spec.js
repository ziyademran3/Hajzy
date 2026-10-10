import { test, expect } from '@playwright/test'
import {
  getOwnerPropertyPerformance,
  getOwnerRevenueMetrics,
} from '../src/lib/ownerRevenue.js'

test('owner revenue includes only paid confirmed bookings and supports database amount fields', () => {
  const metrics = getOwnerRevenueMetrics([
    { status: 'confirmed', paidAt: '2026-10-04T10:00:00', total: 0, total_price: 2500 },
    { status: 'paid', created_at: '2026-10-03T10:00:00', total: 1500 },
    { status: 'confirmed', total: 9000 },
    { status: 'pending', paidAt: '2026-10-04T10:00:00', total: 7000 },
  ], new Date(2026, 9, 4, 12))

  expect(metrics.totalRevenue).toBe(4000)
  expect(metrics.thisMonthRevenue).toBe(4000)
  expect(metrics.hasRevenue).toBe(true)
  expect(metrics.bars.reduce((sum, bar) => sum + bar.amount, 0)).toBe(4000)
})

test('selected-period growth and monthly revenue use the paid date', () => {
  const metrics = getOwnerRevenueMetrics([
    { status: 'confirmed', paidAt: '2026-10-03T12:00:00', total: 1000 },
    { status: 'confirmed', paidAt: '2026-10-05T12:00:00', total: 1500 },
  ], new Date(2026, 9, 6, 12), [], 'thisWeek')

  expect(metrics.totalRevenue).toBe(2500)
  expect(metrics.thisMonthRevenue).toBe(2500)
  expect(metrics.growthPercent).toBe(50)
})

test('no paid revenue produces zero totals, no growth, and empty chart values', () => {
  const metrics = getOwnerRevenueMetrics([
    { status: 'pending', paidAt: '2026-10-04T10:00:00', total: 5000 },
    { status: 'confirmed', total: 7000 },
  ], new Date(2026, 9, 4, 12))

  expect(metrics.totalRevenue).toBe(0)
  expect(metrics.thisMonthRevenue).toBe(0)
  expect(metrics.growthPercent).toBeNull()
  expect(metrics.hasRevenue).toBe(false)
  expect(metrics.bars.every((bar) => bar.amount === 0 && bar.height === 0)).toBe(true)
})

test('top revenue city uses eligible paid bookings linked to owner properties', () => {
  const metrics = getOwnerRevenueMetrics([
    { status: 'paid', paidAt: '2026-10-02T10:00:00', total: 2500, property_id: 1 },
    { status: 'confirmed', paidAt: '2026-10-03T10:00:00', paymentStatus: 'succeeded', totalPrice: 4000, propertyId: 2 },
    { status: 'pending', paidAt: '2026-10-04T10:00:00', total: 10000, propertyId: 2 },
    { status: 'paid', paidAt: '2026-10-02T10:00:00', total: 0, propertyId: 3 },
    { status: 'paid', paidAt: '2026-10-02T10:00:00', total: 9000, propertyId: 4 },
  ], new Date(2026, 9, 4, 12), [
    { id: 1, city: 'القاهرة' },
    { id: 2, city: 'الإسكندرية' },
    { id: 3, city: 'الجيزة' },
  ])

  expect(metrics.topRevenueCity).toEqual({ city: 'الإسكندرية', amount: 4000 })
})

test('top revenue city is empty when there is no eligible linked revenue', () => {
  const metrics = getOwnerRevenueMetrics([
    { status: 'pending', total: 2500, propertyId: 1 },
  ], new Date(2026, 9, 4, 12), [{ id: 1, city: 'القاهرة' }])

  expect(metrics.topRevenueCity).toBeNull()
})

test('revenue totals, growth, city and chart use the shared selected period', () => {
  const bookings = [
    { status: 'paid', paidAt: '2026-09-05T12:00:00', total: 500, propertyId: 1 },
    { status: 'paid', paidAt: '2026-10-01T12:00:00', total: 300, propertyId: 1 },
    { status: 'paid', paidAt: '2026-10-03T12:00:00', total: 1200, propertyId: 1 },
    { status: 'paid', paidAt: '2026-10-08T12:00:00', total: 1600, propertyId: 2 },
  ]
  const now = new Date(2026, 9, 8, 12)
  const lastSevenDays = getOwnerRevenueMetrics(bookings, now, [], 'lastSevenDays')
  const thisMonth = getOwnerRevenueMetrics(bookings, now, [
    { id: 1, city: 'القاهرة' },
    { id: 2, city: 'الإسكندرية' },
  ], 'thisMonth')

  expect(lastSevenDays.periodRevenue).toBe(2800)
  expect(lastSevenDays.bars.reduce((sum, bar) => sum + bar.amount, 0)).toBe(2800)
  expect(thisMonth.periodRevenue).toBe(3100)
  expect(thisMonth.previousPeriodRevenue).toBe(500)
  expect(thisMonth.growthPercent).toBe(520)
  expect(thisMonth.topRevenueCity).toEqual({ city: 'الإسكندرية', amount: 1600 })
  expect(thisMonth.bars.reduce((sum, bar) => sum + bar.amount, 0)).toBe(3100)
  expect(thisMonth.bars).toHaveLength(8)
  expect(thisMonth.hasChartRevenue).toBe(true)
})

test('owner property performance is period-filtered and ranked by paid revenue', () => {
  const properties = [
    { id: 'first', rating: 4.5 },
    { id: 'second', rating: 4.8 },
  ]
  const bookings = [
    {
      propertyId: 'first',
      status: 'paid',
      paidAt: '2026-10-06T12:00:00',
      total: 4200,
      checkIn: '2026-10-06',
      checkOut: '2026-10-08',
    },
    {
      propertyId: 'second',
      status: 'confirmed',
      paidAt: '2026-10-07T12:00:00',
      total: 9600,
      checkIn: '2026-10-07',
      checkOut: '2026-10-08',
    },
    {
      propertyId: 'first',
      status: 'paid',
      paidAt: '2026-09-10T12:00:00',
      total: 50000,
      checkIn: '2026-09-10',
      checkOut: '2026-09-11',
    },
    {
      propertyId: 'second',
      status: 'pending',
      paidAt: '2026-10-07T12:00:00',
      total: 90000,
      checkIn: '2026-10-07',
      checkOut: '2026-10-08',
    },
  ]
  const now = new Date(2026, 9, 8, 12)

  expect(getOwnerPropertyPerformance(bookings, properties, now, 'thisWeek')).toMatchObject([
    { property: properties[1], revenue: 9600, bookingCount: 1, occupancyPercent: 25 },
    { property: properties[0], revenue: 4200, bookingCount: 1, occupancyPercent: 50 },
  ])
  expect(getOwnerPropertyPerformance(bookings, properties, now, 'lastSevenDays'))
    .toMatchObject([
      { property: properties[1], revenue: 9600, bookingCount: 1 },
      { property: properties[0], revenue: 4200, bookingCount: 1 },
    ])
})

test('owner revenue chart starts at zero, scales bars to the largest amount, and reveals details on click', async ({ page }) => {
  const now = new Date()
  const paymentDate = (daysAgo) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 12)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T12:00:00`
  }
  await page.addInitScript((bookings) => {
    localStorage.setItem('hajzy_user', JSON.stringify({
      id: 'owner-revenue-chart-test',
      role: 'owner',
      name: 'Test Owner',
    }))
    localStorage.setItem('hajzy_bookings', JSON.stringify(bookings))
  }, [
    { status: 'paid', propertyId: 'alex-vista', paidAt: paymentDate(5), total: 42000 },
    { status: 'paid', propertyId: 'alex-vista', paidAt: paymentDate(0), total: 96000 },
  ])
  await page.route('**/rest/v1/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }))
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')

  const dashboard = page.locator('.owner-shell')
  await expect(dashboard).toBeVisible()
  await page.getByRole('tablist', { name: 'التنقل في لوحة المالك' })
    .getByRole('tab', { name: 'الأرباح' }).click()
  const revenueChart = dashboard.locator('.owner-revenue-chart')
  await expect(revenueChart).toBeVisible()
  await expect(revenueChart.getByTestId('revenue-axis-maximum')).toContainText('96')
  await expect(revenueChart.getByTestId('revenue-axis-zero')).toHaveText('0')

  const fullHeightBar = revenueChart.locator('.owner-analytics-bar[style*="height: 100%"]')
  await expect(fullHeightBar).toHaveCount(1)
  await expect(revenueChart.locator('.owner-analytics-bar[style*="height: 43.75%"]')).toHaveCount(1)
  const visiblePeriodLabels = await revenueChart.locator('.owner-analytics-x-label')
    .evaluateAll((labels) => labels
      .filter((label) => label.textContent.trim())
      .map((label) => {
        const { left, right } = label.getBoundingClientRect()
        return { left, right }
      }))
  visiblePeriodLabels.sort((first, second) => first.left - second.left)
  expect(visiblePeriodLabels.every((label, index) => (
    index === 0 || visiblePeriodLabels[index - 1].right <= label.left
  ))).toBe(true)

  const lowerRevenueButton = revenueChart.getByRole('button', { name: /42,000/ })
  await lowerRevenueButton.click()
  await expect(dashboard.locator('#owner-revenue-tooltip')).toContainText('42,000')
  await expect(lowerRevenueButton).toHaveAttribute('aria-pressed', 'true')
  await dashboard.getByRole('button', { name: 'إغلاق التفاصيل' }).click()
  await expect(dashboard.locator('#owner-revenue-tooltip')).toHaveCount(0)

  await page.getByRole('tablist', { name: 'التنقل في لوحة المالك' })
    .getByRole('tab', { name: 'الحجوزات' }).click()
  const occupancyChart = dashboard.locator('.owner-chart')
  await expect(occupancyChart.locator('.owner-chart-day-label').first()).toBeVisible()
  await expect(occupancyChart.locator('.owner-chart-day-label')).toHaveCount(30)
  await expect(occupancyChart.locator('.owner-chart-bar-track').first()).toBeVisible()
})

test('top owner properties show period performance sorted by revenue', async ({ page }) => {
  const now = new Date()
  const dateOffset = (daysAgo) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 12)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  const bookings = [
    {
      id: 'property-performance-old',
      propertyId: 'alex-vista',
      status: 'paid',
      paidAt: `${dateOffset(10)}T12:00:00`,
      checkIn: dateOffset(10),
      checkOut: dateOffset(8),
      total: 96000,
    },
    {
      id: 'property-performance-current',
      propertyId: 'alex-corniche-hotel',
      status: 'paid',
      paidAt: `${dateOffset(2)}T12:00:00`,
      checkIn: dateOffset(2),
      checkOut: dateOffset(1),
      total: 42000,
    },
  ]
  await page.addInitScript((initialBookings) => {
    localStorage.setItem('hajzy_user', JSON.stringify({
      id: 'owner-property-performance-test',
      role: 'owner',
      name: 'Test Owner',
    }))
    localStorage.setItem('hajzy_bookings', JSON.stringify(initialBookings))
  }, bookings)
  await page.route('**/rest/v1/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: '[]',
  }))
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')

  const navigation = page.getByRole('tablist', { name: 'التنقل في لوحة المالك' })
  await navigation.getByRole('tab', { name: 'العقارات' }).click()
  const performance = page.locator('#owner-leading-properties-panel')
  await expect(performance).toBeVisible()
  await expect(performance.getByRole('heading', { name: 'أفضل العقارات أداءً' })).toBeVisible()
  const cards = performance.locator('.owner-listing-card')
  await expect(cards.first()).toContainText('شقة فيستا الإسكندرية')
  await expect(cards.first()).toContainText('96,000')
  await expect(cards.first()).toContainText('1')
  await expect(cards.first()).toContainText('التقييم: 4.9')
  await expect(cards.nth(1)).toContainText('فندق كورنيش الإسكندرية')
  await expect(cards.nth(1)).toContainText('42,000')
  await expect(cards.first().locator('.owner-listing-performance > div')).toHaveCount(3)

  await performance.getByRole('button', { name: 'آخر 7 أيام' }).click()
  await expect(cards.first()).toContainText('فندق كورنيش الإسكندرية')
  const olderProperty = cards.filter({ hasText: 'شقة فيستا الإسكندرية' })
  await expect(olderProperty).toContainText('0 ج.م')
  await expect(olderProperty.locator('.owner-listing-performance')).toContainText('0')
})
