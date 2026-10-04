import { test, expect } from '@playwright/test'
import { getOwnerRevenueMetrics } from '../src/lib/ownerRevenue.js'

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

test('monthly revenue and weekly growth use the paid date', () => {
  const metrics = getOwnerRevenueMetrics([
    { status: 'confirmed', paidAt: '2026-09-27T12:00:00', total: 1000 },
    { status: 'confirmed', paidAt: '2026-10-03T12:00:00', total: 1500 },
  ], new Date(2026, 9, 4, 12))

  expect(metrics.totalRevenue).toBe(2500)
  expect(metrics.thisMonthRevenue).toBe(1500)
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
