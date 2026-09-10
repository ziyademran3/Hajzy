import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`

export const BROKEN_PHOTO_REPLACEMENTS = {
  'photo-1539650116574-75c0c6d73a6e': 'photo-1503177119275-0aa32b3a9368',
  'photo-1551882547-ff40c63fe97d': 'photo-1582719478250-c89cae4dc85b',
  'photo-1618773928922-de9e3ec5341d': 'photo-1590490360182-c33d57733427',
}

export const sanitizePhotoUrl = (url) => {
  if (!url || typeof url !== 'string') return FALLBACK_STAY_PHOTO
  let cleanUrl = url
  for (const [brokenId, fixId] of Object.entries(BROKEN_PHOTO_REPLACEMENTS)) {
    if (cleanUrl.includes(brokenId)) {
      cleanUrl = cleanUrl.replace(brokenId, fixId)
    }
  }
  return cleanUrl
}

export const CITY_PHOTOS = {
  'الإسكندرية': photo('photo-1507525428034-b723cf961d3e'),
  'القاهرة': photo('photo-1568322445389-f64ac2515020'),
  'الجيزة': photo('photo-1553913861-c0fddf2619ee'),
  'الغردقة': photo('photo-1544551763-46a013bb70d5'),
  'شرم الشيخ': photo('photo-1571896349842-33c89424de2d'),
}

export const FALLBACK_STAY_PHOTO = photo('photo-1566073771259-6a8506099945')

const stay = ({
  id,
  title,
  titleEn,
  location,
  locationEn,
  city,
  cityEn,
  neighborhood,
  coordinates,
  priceValue,
  guests,
  rating,
  reviews,
  image,
  images = [],
  details,
  detailsEn,
  description,
  descriptionEn,
  amenities,
  amenitiesEn,
}) => ({
  id,
  title,
  titleEn,
  location,
  locationEn,
  city,
  cityEn,
  neighborhood,
  coordinates,
  priceValue,
  currency: 'EGP',
  guests,
  rating,
  reviews,
  image,
  images: [image, ...images.filter((item) => item && item !== image)],
  details,
  detailsEn,
  description,
  descriptionEn,
  amenities,
  amenitiesEn,
})

export const propertySeed = [
  stay({
    id: 'alex-vista',
    title: 'شقة فيستا الإسكندرية',
    titleEn: 'Alexandria Vista Apartment',
    location: 'المنتزه، الإسكندرية',
    locationEn: 'Montaza, Alexandria',
    city: 'الإسكندرية',
    cityEn: 'Alexandria',
    neighborhood: 'حي المنتزه',
    coordinates: { lat: 31.2184, lng: 29.9553 },
    priceValue: 4200,
    guests: 4,
    rating: 4.9,
    reviews: 142,
    image: photo('photo-1505693416388-ac5ce068fe85'),
    images: [photo('photo-1522708323590-d24dbb6b0267'), photo('photo-1502672260266-1c1ef2d93688')],
    details: ['٢ غرفة', 'إطلالة بحرية', 'مسبح مشترك'],
    detailsEn: ['2 Bedrooms', 'Sea View', 'Shared Pool'],
    description: 'شقة عصرية بجوار الساحل، مناسبة للعائلات والرحلات الطويلة في مدينة الإسكندرية.',
    descriptionEn: 'Modern coastal apartment by the beach, perfect for families and extended stays in Alexandria.',
    amenities: ['واي فاي سريع', 'مواقف سيارات', 'مسبح', 'أمن 24/7'],
    amenitiesEn: ['Fast Wi-Fi', 'Parking', 'Pool', '24/7 Security'],
  }),
  stay({
    id: 'alex-corniche-hotel',
    title: 'فندق كورنيش الإسكندرية',
    titleEn: 'Alexandria Corniche Hotel',
    location: 'الكورنيش، الإسكندرية',
    locationEn: 'Corniche, Alexandria',
    city: 'الإسكندرية',
    cityEn: 'Alexandria',
    neighborhood: 'بحري',
    coordinates: { lat: 31.2156, lng: 29.8853 },
    priceValue: 3100,
    guests: 3,
    rating: 4.6,
    reviews: 186,
    image: photo('photo-1566073771259-6a8506099945'),
    images: [photo('photo-1571896349842-33c89424de2d'), photo('photo-1590490360182-c33d57733427')],
    details: ['غرفة ديلوكس', 'إفطار', 'إطلالة بحر'],
    detailsEn: ['Deluxe Room', 'Breakfast', 'Sea View'],
    description: 'فندق أنيق على كورنيش الإسكندرية مع إطلالة مباشرة على البحر وخدمة استقبال على مدار اليوم.',
    descriptionEn: 'An elegant Corniche hotel with direct sea views and round-the-clock reception.',
    amenities: ['واي فاي', 'إفطار', 'موقف سيارات', 'تكييف'],
    amenitiesEn: ['Wi-Fi', 'Breakfast', 'Parking', 'Air Conditioning'],
  }),
  stay({
    id: 'alex-stanley-hotel',
    title: 'فندق خليج ستانلي',
    titleEn: 'Stanley Bay Hotel',
    location: 'ستانلي، الإسكندرية',
    locationEn: 'Stanley, Alexandria',
    city: 'الإسكندرية',
    cityEn: 'Alexandria',
    neighborhood: 'ستانلي',
    coordinates: { lat: 31.2335, lng: 29.9486 },
    priceValue: 3650,
    guests: 4,
    rating: 4.8,
    reviews: 154,
    image: photo('photo-1582719478250-c89cae4dc85b'),
    images: [photo('photo-1578683010236-d716f9a3f461'), photo('photo-1590490360182-c33d57733427')],
    details: ['جناح عائلي', 'مسبح', 'شاطئ قريب'],
    detailsEn: ['Family Suite', 'Pool', 'Near Beach'],
    description: 'إقامة فندقية هادئة في ستانلي، قريبة من الكوبري الشهير والمطاعم الساحلية.',
    descriptionEn: 'A calm Stanley Bay hotel close to the famous bridge and waterfront dining.',
    amenities: ['مسبح', 'واي فاي', 'إطلالة بحرية', 'أمن'],
    amenitiesEn: ['Pool', 'Wi-Fi', 'Sea View', 'Security'],
  }),
  stay({
    id: 'cairo-lounge',
    title: 'جناح القاهرة الهادئ',
    titleEn: 'Cairo Peaceful Suite',
    location: 'مدينة نصر، القاهرة',
    locationEn: 'Nasr City, Cairo',
    city: 'القاهرة',
    cityEn: 'Cairo',
    neighborhood: 'حي مدينة نصر',
    coordinates: { lat: 30.05, lng: 31.445 },
    priceValue: 3600,
    guests: 3,
    rating: 4.7,
    reviews: 98,
    image: photo('photo-1494526585095-c41746248156'),
    images: [photo('photo-1502672260266-1c1ef2d93688'), photo('photo-1484154218962-a197022b5858')],
    details: ['١ غرفة', 'مكتب منزلي', 'خدمة يومية'],
    detailsEn: ['1 Bedroom', 'Home Office', 'Daily Service'],
    description: 'جناح فاخر في قلب القاهرة مع ديكور أنيق ومساحة واسعة للراحة والهدوء.',
    descriptionEn: 'Luxury suite in the heart of Cairo featuring elegant decor and spacious comfort.',
    amenities: ['واي فاي', 'خدمة تنظيف', 'موقف سيارات', 'مركز تجاري قريب'],
    amenitiesEn: ['Wi-Fi', 'Cleaning Service', 'Parking', 'Nearby Mall'],
  }),
  stay({
    id: 'cairo-nile-hotel',
    title: 'فندق النيل القاهرة',
    titleEn: 'Nile Cairo Hotel',
    location: 'وسط البلد، القاهرة',
    locationEn: 'Downtown, Cairo',
    city: 'القاهرة',
    cityEn: 'Cairo',
    neighborhood: 'كورنيش النيل',
    coordinates: { lat: 30.0444, lng: 31.2357 },
    priceValue: 4800,
    guests: 2,
    rating: 4.9,
    reviews: 241,
    image: photo('photo-1542314831-068cd1dbfeeb'),
    images: [photo('photo-1564501049412-61c2a3083791'), photo('photo-1578683010236-d716f9a3f461')],
    details: ['غرفة كينج', 'إطلالة نيل', 'سبا'],
    detailsEn: ['King Room', 'Nile View', 'Spa'],
    description: 'فندق فاخر مطل على النيل في قلب القاهرة، مناسب للأعمال والإجازات القصيرة.',
    descriptionEn: 'A luxury Nile-view hotel in central Cairo, ideal for business trips and short stays.',
    amenities: ['واي فاي', 'إفطار', 'موقف', 'خدمة الغرف'],
    amenitiesEn: ['Wi-Fi', 'Breakfast', 'Parking', 'Room Service'],
  }),
  stay({
    id: 'cairo-zamalek-hotel',
    title: 'فندق الزمالك رويال',
    titleEn: 'Zamalek Royal Hotel',
    location: 'الزمالك، القاهرة',
    locationEn: 'Zamalek, Cairo',
    city: 'القاهرة',
    cityEn: 'Cairo',
    neighborhood: 'الزمالك',
    coordinates: { lat: 30.0619, lng: 31.2197 },
    priceValue: 4100,
    guests: 3,
    rating: 4.7,
    reviews: 167,
    image: photo('photo-1520250497591-112f2f40a3f4'),
    images: [photo('photo-1631049307264-da0ec9d70304'), photo('photo-1445019980597-93fa8acb246c')],
    details: ['غرفة ديلوكس', 'حديقة', 'مطعم'],
    detailsEn: ['Deluxe Room', 'Garden', 'Restaurant'],
    description: 'فندق بوتيك في الزمالك بأجواء هادئة ومطاعم راقية على بعد دقائق من وسط المدينة.',
    descriptionEn: 'A boutique Zamalek hotel with a quiet garden setting minutes from downtown Cairo.',
    amenities: ['واي فاي', 'مطعم', 'تكييف', 'أمن 24/7'],
    amenitiesEn: ['Wi-Fi', 'Restaurant', 'Air Conditioning', '24/7 Security'],
  }),
  stay({
    id: 'giza-sky',
    title: 'شقة جيزة سكاي',
    titleEn: 'Giza Sky Residence',
    location: 'الشيخ زايد، الجيزة',
    locationEn: 'Sheikh Zayed, Giza',
    city: 'الجيزة',
    cityEn: 'Giza',
    neighborhood: 'حي الشيخ زايد',
    coordinates: { lat: 30.0384, lng: 31.0021 },
    priceValue: 3900,
    guests: 5,
    rating: 4.8,
    reviews: 120,
    image: photo('photo-1512917774080-9991f1c4c750'),
    images: [photo('photo-1505693416388-ac5ce068fe85'), photo('photo-1484154218962-a197022b5858')],
    details: ['٣ غرف', 'إطلالة واسعة', 'مسرح منزلي'],
    detailsEn: ['3 Bedrooms', 'Panoramic View', 'Home Theater'],
    description: 'شقة أنيقة في الجيزة، مناسبة للرحلات العائلية أو الإقامات الطويلة.',
    descriptionEn: 'Stylish apartment in Giza, perfect for family getaways and long-term stays.',
    amenities: ['مسبح', 'واي فاي', 'مطاعم قريبة', 'أمن'],
    amenitiesEn: ['Pool', 'Wi-Fi', 'Nearby Dining', 'Security'],
  }),
  stay({
    id: 'giza-pyramid-hotel',
    title: 'فندق أهرامات الجيزة',
    titleEn: 'Giza Pyramids Hotel',
    location: 'هرم، الجيزة',
    locationEn: 'Haram, Giza',
    city: 'الجيزة',
    cityEn: 'Giza',
    neighborhood: 'منطقة الأهرامات',
    coordinates: { lat: 29.9773, lng: 31.1325 },
    priceValue: 5200,
    guests: 4,
    rating: 4.8,
    reviews: 298,
    image: photo('photo-1503177119275-0aa32b3a9368'),
    images: [photo('photo-1566073771259-6a8506099945'), photo('photo-1582719478250-c89cae4dc85b')],
    details: ['غرفة إطلالة أهرامات', 'مسبح', 'عشاء'],
    detailsEn: ['Pyramid View Room', 'Pool', 'Dinner'],
    description: 'فندق بإطلالة مباشرة على الأهرامات، مع مسبح خارجي وخدمة نقل للمناطق السياحية.',
    descriptionEn: 'A hotel with direct pyramid views, an outdoor pool, and easy access to nearby sights.',
    amenities: ['إطلالة أهرامات', 'مسبح', 'واي فاي', 'موقف'],
    amenitiesEn: ['Pyramid View', 'Pool', 'Wi-Fi', 'Parking'],
  }),
  stay({
    id: 'giza-sphinx-hotel',
    title: 'فندق أبو الهول',
    titleEn: 'Sphinx View Hotel',
    location: 'نزلة السمان، الجيزة',
    locationEn: 'Nazlet El-Samman, Giza',
    city: 'الجيزة',
    cityEn: 'Giza',
    neighborhood: 'نزلة السمان',
    coordinates: { lat: 29.975, lng: 31.137 },
    priceValue: 2950,
    guests: 3,
    rating: 4.5,
    reviews: 132,
    image: photo('photo-1553913861-c0fddf2619ee'),
    images: [photo('photo-1596436889106-be35e843f974'), photo('photo-1611892440504-42a792e24d32')],
    details: ['غرفة كوين', 'تراس', 'إفطار'],
    detailsEn: ['Queen Room', 'Terrace', 'Breakfast'],
    description: 'فندق قريب من أبو الهول والأهرامات، مناسب للرحلات السياحية والعائلات الصغيرة.',
    descriptionEn: 'A practical hotel near the Sphinx and pyramids, suited to sightseeing trips.',
    amenities: ['إفطار', 'واي فاي', 'تكييف', 'خدمة نقل'],
    amenitiesEn: ['Breakfast', 'Wi-Fi', 'Air Conditioning', 'Shuttle'],
  }),
  stay({
    id: 'red-sea-bay',
    title: 'شاليه البحر الأحمر',
    titleEn: 'Red Sea Bay Chalet',
    location: 'الغردقة، البحر الأحمر',
    locationEn: 'Hurghada, Red Sea',
    city: 'الغردقة',
    cityEn: 'Hurghada',
    neighborhood: 'شاطئ المدينة',
    coordinates: { lat: 27.257, lng: 33.8116 },
    priceValue: 5200,
    guests: 4,
    rating: 4.9,
    reviews: 178,
    image: photo('photo-1507525428034-b723cf961d3e'),
    images: [photo('photo-1500375592092-40eb2168fd21'), photo('photo-1544551763-46a013bb70d5')],
    details: ['٢ غرفة', 'إطلالة بحرية', 'جاكوزي'],
    detailsEn: ['2 Bedrooms', 'Sea View', 'Jacuzzi'],
    description: 'إقامة فاخرة على شواطئ البحر الأحمر مع فرصة للهدوء والراحة التامة.',
    descriptionEn: 'Luxury stay on the shores of the Red Sea offering complete peace and relaxation.',
    amenities: ['شاطئ خاص', 'جاكوزي', 'مسبح', 'خدمة 24/7'],
    amenitiesEn: ['Private Beach', 'Jacuzzi', 'Pool', '24/7 Service'],
  }),
  stay({
    id: 'hurghada-marina-hotel',
    title: 'فندق مارينا الغردقة',
    titleEn: 'Hurghada Marina Hotel',
    location: 'المارينا، الغردقة',
    locationEn: 'Marina, Hurghada',
    city: 'الغردقة',
    cityEn: 'Hurghada',
    neighborhood: 'المارينا',
    coordinates: { lat: 27.223, lng: 33.845 },
    priceValue: 3400,
    guests: 3,
    rating: 4.6,
    reviews: 205,
    image: photo('photo-1571896349842-33c89424de2d'),
    images: [photo('photo-1582719478250-c89cae4dc85b'), photo('photo-1544551763-77ef2d0cfc6c')],
    details: ['غرفة بحرية', 'مسبح', 'غوص'],
    detailsEn: ['Sea Room', 'Pool', 'Diving'],
    description: 'فندق بجانب مارينا الغردقة، مثالي لمحبي البحر والجولات البحرية.',
    descriptionEn: 'A marina-side Hurghada hotel, ideal for sea trips and diving days.',
    amenities: ['مسبح', 'شاطئ', 'واي فاي', 'إفطار'],
    amenitiesEn: ['Pool', 'Beach', 'Wi-Fi', 'Breakfast'],
  }),
  stay({
    id: 'hurghada-reef-hotel',
    title: 'فندق الشعاب بالغردقة',
    titleEn: 'Hurghada Reef Hotel',
    location: 'سفاجا الطريق، الغردقة',
    locationEn: 'Safaga Road, Hurghada',
    city: 'الغردقة',
    cityEn: 'Hurghada',
    neighborhood: 'سهل حشيش',
    coordinates: { lat: 27.188, lng: 33.87 },
    priceValue: 4550,
    guests: 5,
    rating: 4.8,
    reviews: 176,
    image: photo('photo-1568084680786-a84f91d1153c'),
    images: [photo('photo-1507525428034-b723cf961d3e'), photo('photo-1540541338287-41700207dee6')],
    details: ['جناح عائلي', 'شاطئ خاص', 'سبا'],
    detailsEn: ['Family Suite', 'Private Beach', 'Spa'],
    description: 'منتجع فندقي على الشعاب مع شاطئ خاص وأنشطة مائية للعائلات.',
    descriptionEn: 'A reef-side hotel resort with a private beach and family water activities.',
    amenities: ['شاطئ خاص', 'مسبح', 'سبا', 'واي فاي'],
    amenitiesEn: ['Private Beach', 'Pool', 'Spa', 'Wi-Fi'],
  }),
  stay({
    id: 'sharm-terrace',
    title: 'فيلا شرم تراس',
    titleEn: 'Sharm Terrace Villa',
    location: 'شرم الشيخ، جنوب سيناء',
    locationEn: 'Sharm El-Sheikh, South Sinai',
    city: 'شرم الشيخ',
    cityEn: 'Sharm El-Sheikh',
    neighborhood: 'المنتجع السياحي',
    coordinates: { lat: 28.5535, lng: 34.5231 },
    priceValue: 6100,
    guests: 6,
    rating: 5,
    reviews: 212,
    image: photo('photo-1502672260266-1c1ef2d93688'),
    images: [photo('photo-1571896349842-33c89424de2d'), photo('photo-1582719478250-c89cae4dc85b')],
    details: ['٣ غرف', 'حديقة خاصة', 'إطلالة بحرية'],
    detailsEn: ['3 Bedrooms', 'Private Garden', 'Sea View'],
    description: 'فيلا أنيقة في شرم الشيخ، مثالية للرحلات المميزة والعائلات الكبيرة.',
    descriptionEn: 'Elegant villa in Sharm El-Sheikh, ideal for special vacations and large families.',
    amenities: ['حديقة', 'مسبح خاص', 'موقف', 'جلسات خارجية'],
    amenitiesEn: ['Garden', 'Private Pool', 'Parking', 'Outdoor Lounge'],
  }),
  stay({
    id: 'sharm-naama-hotel',
    title: 'فندق نعمة باي',
    titleEn: 'Naama Bay Hotel',
    location: 'نعمة باي، شرم الشيخ',
    locationEn: 'Naama Bay, Sharm El-Sheikh',
    city: 'شرم الشيخ',
    cityEn: 'Sharm El-Sheikh',
    neighborhood: 'نعمة باي',
    coordinates: { lat: 27.9138, lng: 34.3299 },
    priceValue: 3900,
    guests: 3,
    rating: 4.7,
    reviews: 264,
    image: photo('photo-1611892440504-42a792e24d32'),
    images: [photo('photo-1564501049412-61c2a3083791'), photo('photo-1520250497591-112f2f40a3f4')],
    details: ['غرفة ديلوكس', 'قريب من السوق', 'مسبح'],
    detailsEn: ['Deluxe Room', 'Near Market', 'Pool'],
    description: 'فندق في قلب نعمة باي، قريب من الممشى والمطاعم والبحر.',
    descriptionEn: 'A Naama Bay hotel close to the promenade, restaurants, and the sea.',
    amenities: ['مسبح', 'واي فاي', 'إفطار', 'أمن'],
    amenitiesEn: ['Pool', 'Wi-Fi', 'Breakfast', 'Security'],
  }),
  stay({
    id: 'sharm-ras-hotel',
    title: 'فندق رأس أم سيد',
    titleEn: 'Ras Um Sid Hotel',
    location: 'رأس أم سيد، شرم الشيخ',
    locationEn: 'Ras Um Sid, Sharm El-Sheikh',
    city: 'شرم الشيخ',
    cityEn: 'Sharm El-Sheikh',
    neighborhood: 'رأس أم سيد',
    coordinates: { lat: 27.851, lng: 34.316 },
    priceValue: 4700,
    guests: 4,
    rating: 4.9,
    reviews: 188,
    image: photo('photo-1542314831-068cd1dbfeeb'),
    images: [photo('photo-1500375592092-40eb2168fd21'), photo('photo-1568084680786-a84f91d1153c')],
    details: ['جناح بحري', 'شعاب مرجانية', 'غوص'],
    detailsEn: ['Sea Suite', 'Coral Reef', 'Diving'],
    description: 'فندق مطل على الشعاب في رأس أم سيد، مناسب للغطس والاسترخاء.',
    descriptionEn: 'A reef-view hotel in Ras Um Sid, made for diving and quiet Red Sea stays.',
    amenities: ['شاطئ', 'غوص', 'مسبح', 'واي فاي'],
    amenitiesEn: ['Beach', 'Diving', 'Pool', 'Wi-Fi'],
  }),
]

const readStorage = (key, fallback) => {
  try {
    let storedValue = localStorage.getItem(key)
    if (storedValue === null && key.startsWith('hajzy_')) {
      // Fallback for legacy stitch_ keys
      storedValue = localStorage.getItem(key.replace('hajzy_', 'stitch_'))
    }
    if (storedValue === null) {
      return fallback
    }

    const parsedValue = JSON.parse(storedValue)
    return parsedValue
  } catch {
    return fallback
  }
}

const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const propertySeedById = Object.fromEntries(propertySeed.map((item) => [String(item.id), item]))

const normalizeProperty = (property) => {
  const seed = propertySeedById[String(property?.id)] || {}
  const rawImage = property.image || seed.image || FALLBACK_STAY_PHOTO
  const image = sanitizePhotoUrl(rawImage)
  const rawImages = property.images || seed.images || [image]
  const images = (Array.isArray(rawImages) ? rawImages : [rawImages])
    .map(sanitizePhotoUrl)
    .filter(Boolean)

  return {
    id: property.id || seed.id || `property-${Date.now()}`,
    title: property.title || seed.title,
    titleEn: property.titleEn || seed.titleEn || '',
    location: property.location || seed.location,
    locationEn: property.locationEn || seed.locationEn || '',
    city: property.city || seed.city,
    cityEn: property.cityEn || seed.cityEn || '',
    neighborhood: property.neighborhood || seed.neighborhood || property.location || seed.location,
    coordinates: property.coordinates || seed.coordinates || { lat: 30.0333, lng: 31.2333 },
    priceValue: Number(property.priceValue || seed.priceValue || 0),
    currency: property.currency || seed.currency || 'EGP',
    guests: Number(property.guests || seed.guests || 2),
    rating: Number(property.rating || seed.rating || 4.8),
    reviews: Number(property.reviews || seed.reviews || 0),
    image,
    images: images.length ? images : [image],
    details: property.details || seed.details || [],
    detailsEn: property.detailsEn || seed.detailsEn || [],
    description: property.description || seed.description || '',
    descriptionEn: property.descriptionEn || seed.descriptionEn || '',
    amenities: property.amenities || seed.amenities || [],
    amenitiesEn: property.amenitiesEn || seed.amenitiesEn || [],
    bookingInfo: property.bookingInfo || seed.bookingInfo || '',
    ownerId: property.ownerId || seed.ownerId || null,
  }
}

const normalizeBooking = (booking) => {
  const rawImage = booking.image || FALLBACK_STAY_PHOTO
  return {
    id: booking.id || `booking-${Date.now()}`,
    propertyId: booking.propertyId,
    title: booking.title,
    location: booking.location,
    image: sanitizePhotoUrl(rawImage),
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: Number(booking.guests || 1),
    total: Number(booking.total || 0),
    currency: booking.currency || 'EGP',
    status: booking.status || 'confirmed',
    reference: booking.reference || '#REF-00000',
    paymentMethod: booking.paymentMethod || 'card',
  }
}

export const fetchProperties = async () => {
  if (supabase) {
    const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false })
    if (!error && data && data.length) {
      const remoteById = new Map(data.map((item) => [String(item.id), item]))
      const mergedCatalog = propertySeed.map((seed) => {
        const remote = remoteById.get(String(seed.id))
        return remote
          ? {
              ...remote,
              ...seed,
              image: remote.image || seed.image,
              images: remote.images?.length ? remote.images : seed.images,
            }
          : seed
      })
      const extras = data.filter((item) => !propertySeedById[String(item.id)])
      return [...mergedCatalog, ...extras].map(normalizeProperty)
    }
  }

  const storedProperties = readStorage('hajzy_properties', [])
  const customProperties = (Array.isArray(storedProperties) ? storedProperties : []).filter(
    (item) => !propertySeedById[String(item?.id)],
  )
  const merged = [...propertySeed, ...customProperties]
  writeStorage('hajzy_properties', merged)
  return merged.map(normalizeProperty)
}

export const addProperty = async (property) => {
  const normalizedProperty = normalizeProperty(property)

  if (supabase) {
    const { data, error } = await supabase
      .from('properties')
      .insert([normalizedProperty])
      .select()

    if (!error && data && data[0]) {
      return normalizeProperty(data[0])
    }
  }

  const savedProperties = readStorage('hajzy_properties', propertySeed)
  const updatedProperties = [normalizedProperty, ...savedProperties]
  writeStorage('hajzy_properties', updatedProperties)
  return normalizedProperty
}

export const updateProperty = async (property) => {
  const normalizedProperty = normalizeProperty(property)

  if (supabase) {
    const { data, error } = await supabase
      .from('properties')
      .update(normalizedProperty)
      .eq('id', normalizedProperty.id)
      .select()

    if (!error && data && data[0]) {
      return normalizeProperty(data[0])
    }
  }

  const savedProperties = readStorage('hajzy_properties', propertySeed)
  const updatedProperties = savedProperties.map((item) =>
    item.id === normalizedProperty.id ? normalizedProperty : item,
  )
  writeStorage('hajzy_properties', updatedProperties)
  return normalizedProperty
}

export const deleteProperty = async (propertyId) => {
  if (supabase) {
    const { error } = await supabase.from('properties').delete().eq('id', propertyId)
    if (!error) {
      return true
    }
  }

  const savedProperties = readStorage('hajzy_properties', propertySeed)
  const filteredProperties = savedProperties.filter((property) => property.id !== propertyId)
  writeStorage('hajzy_properties', filteredProperties)
  return true
}

export const fetchPropertiesByOwner = async (ownerId) => {
  const allProperties = await fetchProperties()

  if (!ownerId) {
    return allProperties
  }

  return allProperties.filter(
    (property) => property.ownerId === ownerId || (!property.ownerId && ownerId === 'owner-demo'),
  )
}

export const fetchBookings = async () => {
  if (supabase) {
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
    if (!error && data) {
      return data.map(normalizeBooking)
    }
  }

  // A customer with no completed booking must see an empty history, never a
  // demonstration booking shared by every new browser session.
  const storedBookings = readStorage('hajzy_bookings', [])
  return storedBookings.map(normalizeBooking)
}

export const addBooking = async (booking) => {
  const normalizedBooking = normalizeBooking(booking)

  if (supabase) {
    const { data, error } = await supabase.from('bookings').insert([normalizedBooking]).select()
    if (!error && data && data[0]) {
      return normalizeBooking(data[0])
    }
  }

  const savedBookings = readStorage('hajzy_bookings', [])
  const updatedBookings = [normalizedBooking, ...savedBookings]
  writeStorage('hajzy_bookings', updatedBookings)
  return normalizedBooking
}

export const normalizeChatMessage = (message) => {
  const createdAt = message.createdAt || message.created_at || new Date().toISOString()

  return {
    id: message.id || `message-${Date.now()}`,
    propertyId: message.propertyId,
    sender: message.sender || 'user',
    text: message.text || '',
    createdAt,
    time: message.time || new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
}

export const fetchChatMessages = async (propertyId) => {
  if (supabase) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('propertyId', propertyId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      return data.map(normalizeChatMessage)
    }
  }

  const savedMessages = readStorage('hajzy_chat_messages', [])
  return savedMessages
    .filter((message) => message.propertyId === propertyId)
    .map(normalizeChatMessage)
}

const initialSeedReviews = {
  'alex-vista': [
    {
      id: 'rev-alex-1',
      propertyId: 'alex-vista',
      authorName: 'سارة محمود',
      authorId: 'guest-1',
      rating: 5,
      text: 'إطلالة بحرية ساحرة وتجهيز ممتاز ونظافة فائقة. الاستقبال كان سريعاً والمالك متعاون جداً.',
      date: '2026-08-15T14:30:00Z',
    },
    {
      id: 'rev-alex-2',
      propertyId: 'alex-vista',
      authorName: 'م. أحمد خالد',
      authorId: 'guest-2',
      rating: 5,
      text: 'المكان هادئ ومناسب جداً للعائلات وقريب من كل معالم المنتزه والكورنيش. تجربة 10/10.',
      date: '2026-08-10T11:20:00Z',
    },
  ],
  'cairo-lounge': [
    {
      id: 'rev-cairo-1',
      propertyId: 'cairo-lounge',
      authorName: 'عمر عبد العزيز',
      authorId: 'guest-3',
      rating: 5,
      text: 'جناح راقي وتصميم داخلي فاخر ومكتب مريح للعمل عن بُعد في قلب القاهرة.',
      date: '2026-08-18T09:15:00Z',
    },
    {
      id: 'rev-cairo-2',
      propertyId: 'cairo-lounge',
      authorName: 'منى الشريف',
      authorId: 'guest-4',
      rating: 4,
      text: 'موقع استراتيجي قريب من سيتي ستارز والمطاعم، والتكييف والخدمة ممتازة.',
      date: '2026-08-05T16:45:00Z',
    },
  ],
  'giza-sky': [
    {
      id: 'rev-giza-1',
      propertyId: 'giza-sky',
      authorName: 'كريم نبيل',
      authorId: 'guest-5',
      rating: 5,
      text: 'شقة واسعة جداً في الشيخ زايد، تشطيب مودرن وأمان عالي ومسرح منزلي ممتع.',
      date: '2026-08-12T18:00:00Z',
    },
  ],
  'red-sea-bay': [
    {
      id: 'rev-red-1',
      propertyId: 'red-sea-bay',
      authorName: 'د. ياسمين فؤاد',
      authorId: 'guest-6',
      rating: 5,
      text: 'أجمل شاليه في الغردقة! شاطئ خاص وجاكوزي وإطلالة مباشرة على البحر الأحمر.',
      date: '2026-08-20T12:00:00Z',
    },
  ],
  'sharm-terrace': [
    {
      id: 'rev-sharm-1',
      propertyId: 'sharm-terrace',
      authorName: 'طارق حسني',
      authorId: 'guest-7',
      rating: 5,
      text: 'فيلا فاخرة بمسبح خاص وخصوصية تامة، تناسب العائلات الكبيرة وإقامة لا تُنسى.',
      date: '2026-08-22T10:00:00Z',
    },
  ],
}

// Reviews stored in local storage with seed fallbacks
export const fetchPropertyReviews = async (propertyId) => {
  const saved = readStorage('hajzy_reviews', null)
  if (saved && saved[propertyId] && Array.isArray(saved[propertyId]) && saved[propertyId].length > 0) {
    return saved[propertyId]
  }

  const initial = initialSeedReviews[propertyId] || []
  if (initial.length > 0) {
    const current = saved || {}
    const updated = { ...current, [propertyId]: initial }
    writeStorage('hajzy_reviews', updated)
  }
  return initial
}

export const addPropertyReview = async (review) => {
  const key = 'hajzy_reviews'
  try {
    const current = readStorage(key, {})
    const byProp = { ...current }
    const existingList = byProp[review.propertyId] || initialSeedReviews[review.propertyId] || []
    const updatedList = [review, ...existingList.filter((item) => item.id !== review.id)]
    byProp[review.propertyId] = updatedList
    writeStorage(key, byProp)

    // Recalculate property average rating & review count
    const totalRating = updatedList.reduce((acc, curr) => acc + Number(curr.rating || 5), 0)
    const newRating = Number((totalRating / updatedList.length).toFixed(1))
    const newReviewsCount = updatedList.length

    const properties = readStorage('hajzy_properties', propertySeed)
    const updatedProps = properties.map((prop) => {
      if (prop.id === review.propertyId) {
        return { ...prop, rating: newRating, reviews: newReviewsCount }
      }
      return prop
    })
    writeStorage('hajzy_properties', updatedProps)

    return review
  } catch (err) {
    console.error('addPropertyReview', err)
    return null
  }
}

export const addChatMessage = async (message) => {
  const normalizedMessage = normalizeChatMessage({
    ...message,
    propertyId: message.propertyId,
    sender: message.sender || 'user',
    text: message.text || '',
  })

  if (supabase) {
    const { data, error } = await supabase.from('chat_messages').insert([normalizedMessage]).select()
    if (!error && data && data[0]) {
      return normalizeChatMessage(data[0])
    }
  }

  const savedMessages = readStorage('hajzy_chat_messages', [])
  const updatedMessages = [...savedMessages, normalizedMessage]
  writeStorage('hajzy_chat_messages', updatedMessages)
  return normalizedMessage
}

export const updateBooking = async (booking) => {
  const normalizedBooking = normalizeBooking(booking)

  if (supabase) {
    const { data, error } = await supabase
      .from('bookings')
      .update(normalizedBooking)
      .eq('id', normalizedBooking.id)
      .select()

    if (!error && data && data[0]) {
      return normalizeBooking(data[0])
    }
  }

  const savedBookings = readStorage('hajzy_bookings', [])
  const updatedBookings = savedBookings.map((item) =>
    item.id === normalizedBooking.id ? normalizedBooking : item,
  )
  writeStorage('hajzy_bookings', updatedBookings)
  return normalizedBooking
}

export const deleteBooking = async (bookingId) => {
  if (supabase) {
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId)
    if (!error) {
      return true
    }
  }

  const savedBookings = readStorage('hajzy_bookings', [])
  const filteredBookings = savedBookings.filter((booking) => booking.id !== bookingId)
  writeStorage('hajzy_bookings', filteredBookings)
  return true
}

export const hasSupabaseConnection = Boolean(supabase)
