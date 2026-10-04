const COASTAL_DEAL_CITIES = new Set([
  'alexandria',
  'الإسكندرية',
  'north-coast',
  'الساحل-الشمالي',
  'hurghada',
  'الغردقة',
  'sharm-el-sheikh',
  'شرم-الشيخ',
])

export const getPropertyBadges = (property) => {
  const city = String(property?.cityId || property?.citySlug || property?.city || property?.cityEn || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')

  return COASTAL_DEAL_CITIES.has(city) ? [{ type: 'discount', percent: 20 }] : []
}
