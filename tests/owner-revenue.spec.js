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

test('top revenue city uses eligible paid bookings linked to owner properties', () => {
  const metrics = getOwnerRevenueMetrics([
    { status: 'paid', total: 2500, property_id: 1 },
    { status: 'confirmed', paymentStatus: 'succeeded', totalPrice: 4000, propertyId: 2 },
    { status: 'pending', paidAt: '2026-10-04T10:00:00', total: 10000, propertyId: 2 },
    { status: 'paid', total: 0, propertyId: 3 },
    { status: 'paid', total: 9000, propertyId: 4 },
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
