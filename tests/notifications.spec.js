import { test, expect } from '@playwright/test'

test.describe('Notifications System Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and initialize clean guest environment
    await page.goto('/')
    await page.evaluate(() => {
      window.localStorage.clear()
      window.localStorage.setItem('hajzy_guest_mode', 'true')
    })
    await page.goto('/')
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 })
  })

  test('New user sees empty state and bell badge is completely hidden', async ({ page }) => {
    // 1. Verify that the bell button does not show a red badge
    const bellButton = page.locator('.notification-button').first()
    await expect(bellButton).toBeVisible()
    const badge = bellButton.locator('.notification-badge')
    await expect(badge).toHaveCount(0)

    // 2. Click the bell button to navigate to the notifications page
    await bellButton.click()
    await page.waitForTimeout(500)

    // 3. Verify that the empty state is displayed
    const emptyState = page.locator('.empty-notifications-state').first()
    await expect(emptyState).toBeVisible()
    await expect(emptyState.locator('h3')).toHaveText(/لا توجد إشعارات حالياً|No notifications at the moment/)
    await expect(emptyState.locator('p')).toHaveText(/سنخبرك هنا بتأكيدات الحجز وتحديثات الأسعار|We will notify you here about booking confirmations and price updates/)

    // 4. Verify that the toolbar ("تحديد الكل كمقروء" and count tag) is hidden
    const toolbar = page.locator('.notification-toolbar')
    await expect(toolbar).toHaveCount(0)

    // 5. Ensure none of the old mock notifications exist
    const pageText = await page.locator('.notifications-shell').textContent()
    expect(pageText).not.toContain('إقامة فيستا الإسكندرية')
    expect(pageText).not.toContain('شاليه البحر الأحمر')
  })

  test('Booking confirmation generates real notification, shows badge, and supports read and delete', async ({ page }) => {
    // Simulate completing a booking via payment-result return
    await page.evaluate(() => {
      const user = { id: 'user_test_booking', name: 'أحمد محمود', email: 'ahmed@example.com' }
      localStorage.setItem('hajzy_user', JSON.stringify(user))
      // Add a test pending booking
      const newBooking = {
        id: 'booking-auto-101',
        title: 'شقة فاخرة على البحر بالإسكندرية',
        checkIn: '2026-10-01',
        checkOut: '2026-10-05',
        total: 8500,
        currency: 'EGP',
        status: 'pending_payment',
      }
      localStorage.setItem('hajzy_bookings', JSON.stringify([newBooking]))
      localStorage.setItem('hajzy_last_pending_booking_id', 'booking-auto-101')
    })

    // Navigate to payment-result return URL with success=true
    await page.goto('/?success=true')
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 })

    // Bell button should now show badge 1
    const bellButton = page.locator('.notification-button').first()
    await expect(bellButton).toBeVisible()
    const badge = bellButton.locator('.notification-badge')
    await expect(badge).toBeVisible({ timeout: 10000 })
    await expect(badge).toHaveText('1')

    // Click bell button to view notifications
    await bellButton.click()
    await page.waitForTimeout(500)

    // Notification item should be visible with unread dot
    const notifItem = page.locator('.notification-item-page').first()
    await expect(notifItem).toBeVisible()
    await expect(notifItem.locator('strong')).toHaveText(/تم تأكيد حجزك|Booking & Payment Confirmed|Booking Confirmed/)
    await expect(notifItem.locator('.notification-dot')).toBeVisible()

    // Toolbar should be visible with count and mark all as read button
    const markAllReadButton = page.locator('button:has-text("تحديد الكل كمقروء"), button:has-text("Mark all as read")').first()
    await expect(markAllReadButton).toBeVisible()

    // Click "تحديد الكل كمقروء"
    await markAllReadButton.click()
    await page.waitForTimeout(400)

    // Unread dot should be gone and bell badge should be hidden
    await expect(notifItem.locator('.notification-dot')).toHaveCount(0)
    await expect(bellButton.locator('.notification-badge')).toHaveCount(0)

    // Click delete (X) on notification
    const deleteButton = notifItem.locator('.notification-delete').first()
    await expect(deleteButton).toBeVisible()
    await deleteButton.click()
    await page.waitForTimeout(400)

    // Verify empty state is now displayed
    await expect(page.locator('.empty-notifications-state')).toBeVisible()

    // Refresh the page to verify persistent deletion
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    // Navigate to notifications again
    const bellButtonAfterReload = page.locator('.notification-button').first()
    await bellButtonAfterReload.click()
    await page.waitForTimeout(500)

    // Must still be empty
    await expect(page.locator('.empty-notifications-state')).toBeVisible()
    await expect(page.locator('.notification-item-page')).toHaveCount(0)
  })

  test('User logout/switch resets notifications without leakage', async ({ page }) => {
    // Seed a notification for user_1
    await page.evaluate(() => {
      localStorage.setItem('hajzy_user', JSON.stringify({ id: 'user_1', name: 'User One', email: 'user1@example.com' }))
      localStorage.setItem('hajzy_notifications_user_1', JSON.stringify([
        {
          id: 'u1_notif_1',
          userId: 'user_1',
          type: 'info',
          title: { ar: 'إشعار خاص بالمستخدم الأول', en: 'User One Private Notification' },
          body: { ar: 'بيانات خاصة', en: 'Private data' },
          createdAt: new Date().toISOString(),
          readAt: null,
          read: false,
        }
      ]))
    })

    await page.goto('/')
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 })

    // Bell badge should show 1 for user 1
    const bellButton = page.locator('.notification-button').first()
    await expect(bellButton.locator('.notification-badge')).toBeVisible({ timeout: 10000 })
    await expect(bellButton.locator('.notification-badge')).toHaveText('1')

    await bellButton.click()
    await page.waitForTimeout(400)
    await expect(page.locator('.notifications-shell')).toContainText('إشعار خاص بالمستخدم الأول')

    // Now switch to user_2 (simulating login with a different account)
    await page.evaluate(() => {
      localStorage.setItem('hajzy_user', JSON.stringify({ id: 'user_2', name: 'User Two', email: 'user2@example.com' }))
    })

    await page.goto('/')
    await expect(page.locator('.app-shell')).toBeVisible({ timeout: 15000 })

    // User 2 has no notifications, badge should be hidden
    const bellButtonUser2 = page.locator('.notification-button').first()
    await expect(bellButtonUser2.locator('.notification-badge')).toHaveCount(0)

    await bellButtonUser2.click()
    await page.waitForTimeout(400)

    // Empty state should be visible for user 2 and no text from user 1
    await expect(page.locator('.empty-notifications-state')).toBeVisible()
    await expect(page.locator('.notifications-shell')).not.toContainText('إشعار خاص بالمستخدم الأول')
  })
})
