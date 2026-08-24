// بيانات وهمية للعقارات (يمكن استبدالها ببيانات API حقيقية)
const propertiesData = [
  {
    id: 'skyline-tower',
    title: 'بنتهاوس الأفق الفاخر',
    location: 'دبي مارينا، الإمارات',
    price: 2600,
    currency: 'درهم',
    rating: 4.9,
    reviews: 128,
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9b274c3e2dca?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506318137071-a8e63d3c9c12?auto=format&fit=crop&w=1200&q=80',
    ],
    details: ['3 غرف نوم', 'إطلالة بحرية', 'مسبح خاص'],
    description:
      'بنتهاوس فاخر يطل على خليج دبي المذهل، مع أرضيات رخامية إيطالية وثريات كريستالية وأثاث منتقى من أشهر العلامات العالمية. الشقة مجهزة بأحدث التقنيات الذكية والاستدامة.',
    amenities: ['واي فاي سريع', 'موقف سيارات خاص', 'مسبح VIP', 'أمن 24/7', 'جيم خاص', 'إطلالة بحرية'],
    perNight: true,
  },
  {
    id: 'oasis-mansion',
    title: 'قصر الواحة الهادئ',
    location: 'وسط المدينة، الرياض',
    price: 1650,
    currency: 'ريال',
    rating: 4.7,
    reviews: 84,
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1604932406667-e0bbd1b348b0?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1521837573904-37047b4e1122?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541457017255-8de19e3ffb42?auto=format&fit=crop&w=1200&q=80',
    ],
    details: ['4 غرف نوم', 'حديقة خاصة', 'مسبح ساخن'],
    description:
      'قصر عصري بتصميم معاصر يجمع بين الفخامة والراحة. يضم حديقة لاند سكيب احترافية ومسبح بمياه دافئة وغرف نوم فسيحة مع حمامات رخامية.',
    amenities: ['واي فاي سريع', 'موقف سيارات', 'مسبح دافئ', 'أمن 24/7', 'مطبخ فخم', 'حديقة خاصة'],
    perNight: true,
  },
  {
    id: 'royal-villa',
    title: 'فيلا العائلة الملكية',
    location: 'الفيصلية، جدة',
    price: 1900,
    currency: 'ريال',
    rating: 4.8,
    reviews: 156,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-96c89a4f3f78?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1613545325278-f24b0186e5e0?auto=format&fit=crop&w=1200&q=80',
    ],
    details: ['5 غرف نوم', 'مكتبة خاصة', 'جاكوزي'],
    description:
      'فيلا على الساحل تتمتع بإطلالة على البحر الأحمر الخلاب. تم تصميمها من قبل معماريين عالميين مشهورين مع كل وسائل الراحة الفاخرة.',
    amenities: ['واي فاي سريع', 'موقف سيارات عديدة', 'جاكوزي', 'أمن 24/7', 'شيف خاص', 'إطلالة بحرية'],
    perNight: true,
  },
]

export const fetchProperties = async () => {
  // محاكاة تأخير الشبكة
  await new Promise((resolve) => setTimeout(resolve, 1000))
  return propertiesData
}

export const fetchPropertyById = async (id) => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return propertiesData.find((p) => p.id === id)
}

export const searchProperties = async (query) => {
  await new Promise((resolve) => setTimeout(resolve, 800))
  return propertiesData.filter(
    (p) =>
      p.title.includes(query) ||
      p.location.includes(query) ||
      p.details.some((d) => d.includes(query))
  )
}
