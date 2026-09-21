import { test, expect } from '@playwright/test';
import {
  normalizeArabicDigits,
  normalizePhone,
  cleanPhoneNumber,
  validatePhone,
  validateFullName,
  validateEmail,
  validateGuestForm,
} from '../src/lib/bookingValidation.js';

test.describe('Booking Validation & Phone Normalization Unit Tests', () => {
  test('normalizePhone handles all edge cases safely without throwing', () => {
    // null, undefined, empty, unexpected types
    expect(normalizePhone(null)).toBe('');
    expect(normalizePhone(undefined)).toBe('');
    expect(normalizePhone('')).toBe('');
    expect(normalizePhone(12345)).toBe('12345');
    expect(normalizePhone({})).toBe('');

    // Spaces, dashes, parentheses
    expect(normalizePhone(' 010 2277 7320 ')).toBe('01022777320');
    expect(normalizePhone('(010) 2277-7320')).toBe('01022777320');

    // Autofill formats
    expect(normalizePhone('+20 102 468 8333')).toBe('+201024688333');
    expect(normalizePhone('+20-102-468-8333')).toBe('+201024688333');
    expect(normalizePhone('0020 102 468 8333')).toBe('00201024688333');

    // Arabic / Persian numerals
    expect(normalizePhone('٠١٠٢٢٧٧٧٣٢٠')).toBe('01022777320');
    expect(normalizePhone('+٢٠ ١٠٢ ٤٦٨ ٨٣٣٣')).toBe('+201024688333');
  });

  test('cleanPhoneNumber alias works identically to normalizePhone', () => {
    expect(cleanPhoneNumber('+20 102 468 8333')).toBe('+201024688333');
    expect(cleanPhoneNumber('01024688333')).toBe('01024688333');
    expect(cleanPhoneNumber(null)).toBe('');
  });

  test('validatePhone validates and normalizes correctly in AR and EN', () => {
    // Egyptian local
    const res1 = validatePhone('01024688333', 'ar');
    expect(res1.isValid).toBe(true);
    expect(res1.normalized).toBe('+201024688333');

    // Egyptian international with +
    const res2 = validatePhone('+20 102 468 8333', 'ar');
    expect(res2.isValid).toBe(true);
    expect(res2.normalized).toBe('+201024688333');

    // Egyptian international with 0020
    const res3 = validatePhone('00201024688333', 'ar');
    expect(res3.isValid).toBe(true);
    expect(res3.normalized).toBe('+201024688333');

    // Egyptian without + prefix
    const res4 = validatePhone('201024688333', 'ar');
    expect(res4.isValid).toBe(true);
    expect(res4.normalized).toBe('+201024688333');

    // Arabic numerals
    const res5 = validatePhone('٠١٠٢٤٦٨٨٣٣٣', 'ar');
    expect(res5.isValid).toBe(true);
    expect(res5.normalized).toBe('+201024688333');

    // Global international
    const res6 = validatePhone('+966501234567', 'en');
    expect(res6.isValid).toBe(true);
    expect(res6.normalized).toBe('+966501234567');

    // Invalid phone
    const resInvalidAr = validatePhone('12345', 'ar');
    expect(resInvalidAr.isValid).toBe(false);
    expect(resInvalidAr.error).toContain('رقم الهاتف غير صحيح');

    const resInvalidEn = validatePhone('12345', 'en');
    expect(resInvalidEn.isValid).toBe(false);
    expect(resInvalidEn.error).toContain('Invalid phone number');

    // Empty phone
    const resEmpty = validatePhone('', 'ar');
    expect(resEmpty.isValid).toBe(false);
    expect(resEmpty.error).toBe('رقم الهاتف مطلوب');
  });

  test('validateGuestForm validates whole form and returns normalizedData', () => {
    const validForm = {
      fullName: '  Ziad Emran  ',
      phone: '٠١٠٢٤٦٨٨٣٣٣',
      email: 'ZIAD@EXAMPLE.COM ',
      notes: '  Arriving late  ',
    };

    const res = validateGuestForm(validForm, 'ar');
    expect(res.isValid).toBe(true);
    expect(res.normalizedData.fullName).toBe('Ziad Emran');
    expect(res.normalizedData.phone).toBe('+201024688333');
    expect(res.normalizedData.email).toBe('ziad@example.com');
    expect(res.normalizedData.notes).toBe('Arriving late');
  });
});
