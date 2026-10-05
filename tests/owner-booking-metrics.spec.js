import { test, expect } from '@playwright/test'
import {
  getBookedDaysForProperty,
  getOwnerBookingMetrics,
  getSmartLockCodeStatus,
} from '../src/lib/ownerBookingMetrics.js'

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

test('owner dashboard shows empty booking metrics while the bell counts unread notifications', async ({ page }) => {
  await page.addInitScript(() => {
    const ownerId = 'owner-metrics-test'
    localStorage.clear()
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
  await expect(ownerDashboard.locator('.owner-feature-pills')).toContainText('الإشغال هذا الشهر')
  await expect(ownerDashboard.locator('.owner-summary-grid .owner-summary-card').first()).toContainText('نقطة مئوية عن الشهر الماضي')
  await expect(ownerDashboard.locator('.owner-dashboard-header')).not.toContainText('Owner Portal')
  await expect(ownerDashboard.locator('.owner-dashboard-header')).toContainText('إضافة عقار جديد')
  await expect(ownerDashboard.locator('.owner-summary-grid .owner-summary-card').nth(2).locator('strong')).toContainText('ساعة')
  await expect(ownerDashboard.locator('.owner-action-rail')).toContainText('كل 0 حجوزات')
  const propertySection = ownerDashboard.locator('.owner-listings').first()
  await expect(propertySection).toContainText('15 عقارًا')
  await expect(propertySection.locator('.owner-form-head h3')).toHaveText('العقارات المضافة')
  const firstPropertyTitle = (await propertySection.locator('.owner-card h4').first().textContent())?.trim()
  await expect(ownerDashboard.locator('.owner-form')).toContainText('عنوان العقار')
  await expect(ownerDashboard.locator('.owner-form').getByRole('button', { name: 'إضافة عقار' })).toBeVisible()
  await expect(ownerDashboard.locator('.host-calendar-manager-card')).toContainText(
    `إدارة مواعيد الحجز وأسعار العقار: ${firstPropertyTitle}`,
  )
  await ownerDashboard.locator('.owner-form').getByRole('button', { name: 'إضافة عقار' }).click()
  await expect(ownerDashboard.locator('.owner-form')).toContainText(
    'يرجى تعبئة عنوان العقار والموقع والسعر قبل الحفظ',
  )
  await expect(ownerDashboard.locator('.owner-summary-grid .owner-summary-card').nth(1).locator('strong')).toHaveText('—')
  await expect(ownerDashboard.locator('.owner-progress-list .label-row').first().locator('strong')).toHaveText('—')
  await expect(ownerDashboard.locator('.owner-feature-pills')).toContainText('0%')
  await expect(ownerDashboard.locator('.host-calendar-manager-card')).toContainText('غير مرتبط بحجز')
  await expect(ownerDashboard.locator('.host-calendar-manager-card')).toContainText('لا يوجد كود نشط')
  await expect(ownerDashboard.locator('.host-calendar-manager-card')).not.toContainText('8492')
  await expect(ownerDashboard.locator('.host-calendar-manager-card').getByRole('button', { name: 'توليد جديد' })).toHaveCount(0)
  await expect(ownerDashboard.locator('.calendar-day-cell.booked')).toHaveCount(0)
  await expect(page.locator('.notification-button .notification-badge')).toHaveText('2')
})
