import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export const propertySeed = [
  {
    id: 'alex-vista',
    title: 'شقة فيستا الإسكندرية',
    location: 'المنتزه، الإسكندرية',
    city: 'الإسكندرية',
    neighborhood: 'حي المنتزه',
    coordinates: { lat: 31.2184, lng: 29.9553 },
    priceValue: 4200,
    currency: 'EGP',
    guests: 4,
    rating: 4.9,
    reviews: 142,
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    details: ['٢ غرفة', 'إطلالة بحرية', 'مسبح مشترك'],
    description: 'شقة عصرية بجوار الساحل، مناسبة للعائلات والرحلات الطويلة في مدينة الإسكندرية.',
    amenities: ['واي فاي سريع', 'مواقف سيارات', 'مسبح', 'أمن 24/7'],
  },
  {
    id: 'cairo-lounge',
    title: 'جناح القاهرة الهادئ',
    location: 'مدينة نصر، القاهرة',
    city: 'القاهرة',
    neighborhood: 'حي مدينة نصر',
    coordinates: { lat: 30.0500, lng: 31.4450 },
    priceValue: 3600,
    currency: 'EGP',
    guests: 3,
    rating: 4.7,
    reviews: 98,
    image:
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    details: ['١ غرفة', 'مكتب منزلي', 'خدمة يومية'],
    description: 'جناح فاخر في قلب القاهرة مع ديكور أنيق ومساحة واسعة للراحة والهدوء.',
    amenities: ['واي فاي', 'خدمة تنظيف', 'موقف سيارات', 'مركز تجاري قريب'],
  },
  {
    id: 'giza-sky',
    title: 'شقة جيزة سكاي',
    location: 'الشيخ زايد، الجيزة',
    city: 'الجيزة',
    neighborhood: 'حي الشيخ زايد',
    coordinates: { lat: 30.0384, lng: 31.0021 },
    priceValue: 3900,
    currency: 'EGP',
    guests: 5,
    rating: 4.8,
    reviews: 120,
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    details: ['٣ غرف', 'أطلالة واسعة', 'مسرح منزلي'],
    description: 'شقة أنيقة في الجيزة، مناسبة للرحلات العائلية أو الإقامات الطويلة.',
    amenities: ['مسبح', 'واي فاي', 'مطاعم قريبة', 'أمن'],
  },
  {
    id: 'red-sea-bay',
    title: 'شاليه البحر الأحمر',
    location: 'الغردقة، البحر الأحمر',
    city: 'الغردقة',
    neighborhood: 'شاطئ المدينة',
    coordinates: { lat: 27.2570, lng: 33.8116 },
    priceValue: 5200,
    currency: 'EGP',
    guests: 4,
    rating: 4.9,
    reviews: 178,
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    details: ['٢ غرفة', 'إطلالة بحرية', 'جاكوزي'],
    description: 'إقامة فاخرة على شواطئ البحر الأحمر مع فرصة للهدوء والراحة التامة.',
    amenities: ['شاطئ خاص', 'جاكوزي', 'مسبح', 'خدمة 24/7'],
  },
  {
    id: 'sharm-terrace',
    title: 'فيلا شرم تراس',
    location: 'شرم الشيخ، جنوب سيناء',
    city: 'شرم الشيخ',
    neighborhood: 'المنتجع السياحي',
    coordinates: { lat: 28.5535, lng: 34.5231 },
    priceValue: 6100,
    currency: 'EGP',
    guests: 6,
    rating: 5,
    reviews: 212,
    image:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    details: ['٣ غرف', 'حديقة خاصة', 'إطلالة بحرية'],
    description: 'فيلا أنيقة في شرم الشيخ، مثالية للرحلات المميزة والعائلات الكبيرة.',
    amenities: ['حديقة', 'مسبح خاص', 'موقف', 'جلسات خارجية'],
  },
]

const bookingSeed = [
  {
    id: 'booking-1',
    propertyId: 'alex-vista',
    title: 'شقة فيستا الإسكندرية',
    location: 'المنتزه، الإسكندرية',
    image:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    checkIn: '2026-10-15',
    checkOut: '2026-10-20',
    guests: 2,
    total: 21000,
    currency: 'EGP',
    status: 'confirmed',
    reference: '#REF-11001',
  },
]

const readStorage = (key, fallback) => {
  try {
    const storedValue = localStorage.getItem(key)
    if (storedValue === null) {
      return fallback
    }

    const parsedValue = JSON.parse(storedValue)
    if (Array.isArray(parsedValue) && parsedValue.length === 0) {
      return fallback
    }

    return parsedValue
  } catch {
    return fallback
  }
}

const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const normalizeProperty = (property) => ({
  id: property.id || `property-${Date.now()}`,
  title: property.title,
  location: property.location,
  city: property.city,
  neighborhood: property.neighborhood || property.location,
  coordinates: property.coordinates || { lat: 30.0333, lng: 31.2333 },
  priceValue: Number(property.priceValue || 0),
  currency: property.currency || 'EGP',
  guests: Number(property.guests || 2),
  rating: Number(property.rating || 4.8),
  reviews: Number(property.reviews || 0),
  image: property.image,
  details: property.details || [],
  description: property.description || 'وصف الشقة',
  amenities: property.amenities || [],
  bookingInfo: property.bookingInfo || '',
  ownerId: property.ownerId || null,
})

const normalizeBooking = (booking) => ({
  id: booking.id || `booking-${Date.now()}`,
  propertyId: booking.propertyId,
  title: booking.title,
  location: booking.location,
  image: booking.image,
  checkIn: booking.checkIn,
  checkOut: booking.checkOut,
  guests: Number(booking.guests || 1),
  total: Number(booking.total || 0),
  currency: booking.currency || 'EGP',
  status: booking.status || 'confirmed',
  reference: booking.reference || '#REF-00000',
  paymentMethod: booking.paymentMethod || 'card',
})

export const fetchProperties = async () => {
  if (supabase) {
    const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false })
    if (!error && data) {
      return data.map(normalizeProperty)
    }
  }

  const storedProperties = readStorage('stitch_properties', propertySeed)
  const fallbackProperties = Array.isArray(storedProperties) && storedProperties.length ? storedProperties : propertySeed

  if (fallbackProperties !== storedProperties) {
    writeStorage('stitch_properties', fallbackProperties)
  }

  return fallbackProperties.map(normalizeProperty)
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

  const savedProperties = readStorage('stitch_properties', propertySeed)
  const updatedProperties = [normalizedProperty, ...savedProperties]
  writeStorage('stitch_properties', updatedProperties)
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

  const savedProperties = readStorage('stitch_properties', propertySeed)
  const updatedProperties = savedProperties.map((item) =>
    item.id === normalizedProperty.id ? normalizedProperty : item,
  )
  writeStorage('stitch_properties', updatedProperties)
  return normalizedProperty
}

export const deleteProperty = async (propertyId) => {
  if (supabase) {
    const { error } = await supabase.from('properties').delete().eq('id', propertyId)
    if (!error) {
      return true
    }
  }

  const savedProperties = readStorage('stitch_properties', propertySeed)
  const filteredProperties = savedProperties.filter((property) => property.id !== propertyId)
  writeStorage('stitch_properties', filteredProperties)
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

  const storedBookings = readStorage('stitch_bookings', bookingSeed)
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

  const savedBookings = readStorage('stitch_bookings', bookingSeed)
  const updatedBookings = [normalizedBooking, ...savedBookings]
  writeStorage('stitch_bookings', updatedBookings)
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

  const savedMessages = readStorage('stitch_chat_messages', [])
  return savedMessages
    .filter((message) => message.propertyId === propertyId)
    .map(normalizeChatMessage)
}

// Reviews stored in local storage (demo)
export const fetchPropertyReviews = async (propertyId) => {
  const saved = readStorage('stitch_reviews', {})
  const arr = (saved && saved[propertyId]) ? saved[propertyId] : []
  return arr
}

export const addPropertyReview = async (review) => {
  const key = 'stitch_reviews'
  try {
    const current = readStorage(key, {})
    const byProp = { ...current }
    byProp[review.propertyId] = byProp[review.propertyId] || []
    byProp[review.propertyId].unshift(review)
    writeStorage(key, byProp)
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

  const savedMessages = readStorage('stitch_chat_messages', [])
  const updatedMessages = [...savedMessages, normalizedMessage]
  writeStorage('stitch_chat_messages', updatedMessages)
  return normalizedMessage
}

export const createPaymentSession = async ({ amount, currency, propertyTitle, paymentMethod }) => {
  const provider = import.meta.env.VITE_PAYMENT_PROVIDER || 'demo'
  const reference = `#REF-${Math.floor(10000 + Math.random() * 90000)}`

  if (provider === 'stripe') {
    return {
      provider,
      status: 'ready',
      reference,
      redirectUrl: `https://checkout.stripe.com/pay?amount=${Math.round(amount * 100)}&currency=${currency}&title=${encodeURIComponent(propertyTitle || 'Stay')}&method=${encodeURIComponent(paymentMethod)}`,
    }
  }

  if (provider === 'paymob') {
    return {
      provider,
      status: 'ready',
      reference,
      redirectUrl: `https://accept.paymob.com/checkout?amount=${amount}&currency=${currency}&method=${encodeURIComponent(paymentMethod)}&title=${encodeURIComponent(propertyTitle || 'Stay')}`,
    }
  }

  return {
    provider: 'demo',
    status: 'demo',
    reference,
    message: 'بيانات الدفع قيد المحاكاة المحلية حتى يتم ربط بوابة دفع حقيقية.',
  }
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

  const savedBookings = readStorage('stitch_bookings', bookingSeed)
  const updatedBookings = savedBookings.map((item) =>
    item.id === normalizedBooking.id ? normalizedBooking : item,
  )
  writeStorage('stitch_bookings', updatedBookings)
  return normalizedBooking
}

export const deleteBooking = async (bookingId) => {
  if (supabase) {
    const { error } = await supabase.from('bookings').delete().eq('id', bookingId)
    if (!error) {
      return true
    }
  }

  const savedBookings = readStorage('stitch_bookings', bookingSeed)
  const filteredBookings = savedBookings.filter((booking) => booking.id !== bookingId)
  writeStorage('stitch_bookings', filteredBookings)
  return true
}

export const hasSupabaseConnection = Boolean(supabase)
