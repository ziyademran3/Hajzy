import { test, expect } from '@playwright/test';
import { pluralize, pluralizeArabic, getArabicPluralWord } from '../src/lib/formatters.js';

test.describe('Arabic & English Pluralization Tests', () => {
  test('follows Arabic grammar rules for stay (إقامة)', () => {
    expect(pluralize(1, 'stay', 'ar')).toBe('1 إقامة');
    expect(pluralize(2, 'stay', 'ar')).toBe('2 إقامتان');
    expect(pluralize(3, 'stay', 'ar')).toBe('3 إقامات');
    expect(pluralize(6, 'stay', 'ar')).toBe('6 إقامات');
    expect(pluralize(10, 'stay', 'ar')).toBe('10 إقامات');
    expect(pluralize(11, 'stay', 'ar')).toBe('11 إقامة');
    expect(pluralize(15, 'stay', 'ar')).toBe('15 إقامة');
    expect(pluralize(25, 'stay', 'ar')).toBe('25 إقامة');
  });

  test('follows Arabic grammar rules for result (نتيجة)', () => {
    expect(pluralize(1, 'result', 'ar')).toBe('1 نتيجة');
    expect(pluralize(2, 'result', 'ar')).toBe('2 نتيجتان');
    expect(pluralize(3, 'result', 'ar')).toBe('3 نتائج');
    expect(pluralize(5, 'result', 'ar')).toBe('5 نتائج');
    expect(pluralize(10, 'result', 'ar')).toBe('10 نتائج');
    expect(pluralize(11, 'result', 'ar')).toBe('11 نتيجة');
    expect(pluralize(15, 'result', 'ar')).toBe('15 نتيجة');
  });

  test('follows Arabic grammar rules for point (نقطة)', () => {
    expect(pluralize(1, 'point', 'ar')).toBe('1 نقطة');
    expect(pluralize(2, 'point', 'ar')).toBe('2 نقطتان');
    expect(pluralize(6, 'point', 'ar')).toBe('6 نقاط');
    expect(pluralize(10, 'point', 'ar')).toBe('10 نقاط');
    expect(pluralize(12, 'point', 'ar')).toBe('12 نقطة');
    expect(pluralize(100, 'point', 'ar')).toBe('100 نقطة');
  });

  test('follows Arabic grammar rules for night (ليلة)', () => {
    expect(pluralize(1, 'night', 'ar')).toBe('1 ليلة');
    expect(pluralize(2, 'night', 'ar')).toBe('2 ليلتان');
    expect(pluralize(3, 'night', 'ar')).toBe('3 ليالٍ');
    expect(pluralize(7, 'night', 'ar')).toBe('7 ليالٍ');
    expect(pluralize(10, 'night', 'ar')).toBe('10 ليالٍ');
    expect(pluralize(14, 'night', 'ar')).toBe('14 ليلة');
  });

  test('follows Arabic grammar rules for guest (ضيف)', () => {
    expect(pluralize(1, 'guest', 'ar')).toBe('1 ضيف');
    expect(pluralize(2, 'guest', 'ar')).toBe('2 ضيفان');
    expect(pluralize(4, 'guest', 'ar')).toBe('4 ضيوف');
    expect(pluralize(10, 'guest', 'ar')).toBe('10 ضيوف');
    expect(pluralize(12, 'guest', 'ar')).toBe('12 ضيف');
  });

  test('follows Arabic grammar rules for booking (حجز)', () => {
    expect(pluralize(1, 'booking', 'ar')).toBe('1 حجز');
    expect(pluralize(2, 'booking', 'ar')).toBe('2 حجزان');
    expect(pluralize(5, 'booking', 'ar')).toBe('5 حجوزات');
    expect(pluralize(11, 'booking', 'ar')).toBe('11 حجزًا');
  });

  test('follows Arabic grammar rules for property counters (عقار)', () => {
    expect(pluralizeArabic(1, 'property')).toBe('1 عقار');
    expect(pluralizeArabic(2, 'property')).toBe('2 عقاران');
    expect(pluralizeArabic(3, 'property')).toBe('3 عقارات');
    expect(pluralizeArabic(10, 'property')).toBe('10 عقارات');
    expect(pluralizeArabic(11, 'property')).toBe('11 عقارًا');
    expect(pluralizeArabic(15, 'property')).toBe('15 عقارًا');
    expect(pluralizeArabic(0, 'property')).toBe('0 عقارات');
    expect(pluralize(1.2, 'hour', 'ar')).toBe('1.2 ساعة');
    expect(getArabicPluralWord(3, 'property')).toBe('عقارات');
    expect(getArabicPluralWord(11, 'property')).toBe('عقارًا');
    expect(pluralize(15, 'عقار', 'ar')).toBe('15 عقارًا');
  });

  test('handles English pluralization properly', () => {
    expect(pluralize(1, 'stay', 'en')).toBe('1 stay');
    expect(pluralize(3, 'stay', 'en')).toBe('3 stays');
    expect(pluralize(1, 'night', 'en')).toBe('1 night');
    expect(pluralize(5, 'night', 'en')).toBe('5 nights');
    expect(pluralize(1, 'guest', 'en')).toBe('1 guest');
    expect(pluralize(2, 'guest', 'en')).toBe('2 guests');
  });

  test('supports includeNumber=false option', () => {
    expect(pluralize(1, 'stay', 'ar', { includeNumber: false })).toBe('إقامة');
    expect(pluralize(2, 'stay', 'ar', { includeNumber: false })).toBe('إقامتان');
    expect(pluralize(4, 'stay', 'ar', { includeNumber: false })).toBe('إقامات');
    expect(pluralize(15, 'stay', 'ar', { includeNumber: false })).toBe('إقامة');
  });
});
