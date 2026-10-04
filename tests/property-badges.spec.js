import { test, expect } from '@playwright/test'
import { getPropertyBadges } from '../src/lib/propertyBadges.js'

test('availability and low-inventory badges are not shown without an authoritative inventory source', () => {
  const property = {
    id: 'stay-without-public-inventory',
    city: 'القاهرة',
    availableRooms: 1,
  }
  const selectedDates = {
    checkIn: '2026-11-10',
    checkOut: '2026-11-12',
    hasSearchedAvailability: true,
    bookings: [],
  }

  expect(getPropertyBadges(property, selectedDates)).toEqual([])
})

test('20 percent badge is limited to the active coastal deal', () => {
  expect(getPropertyBadges({ cityId: 'alexandria' })).toEqual([
    { type: 'discount', percent: 20 },
  ])
  expect(getPropertyBadges({ city: 'القاهرة' })).toEqual([])
  expect(getPropertyBadges({ city: 'الساحل الشمالي' })).toEqual([
    { type: 'discount', percent: 20 },
  ])
})
