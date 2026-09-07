import React from 'react'
import Card from './Card'
import { AiFillStar } from 'react-icons/ai'

const scenicArt = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 420">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#0d8d88"/>
        <stop offset="100%" stop-color="#8dd8d0"/>
      </linearGradient>
      <linearGradient id="shore" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#c7f0eb"/>
        <stop offset="100%" stop-color="#62bec9"/>
      </linearGradient>
    </defs>
    <rect width="820" height="420" fill="url(#bg)"/>
    <circle cx="655" cy="72" r="52" fill="#f8e7a7" opacity="0.95"/>
    <path d="M0 180 L110 118 L220 170 L360 70 L500 230 L610 148 L740 220 L820 178 L820 420 L0 420 Z" fill="#dfeef0" opacity="0.8"/>
    <path d="M0 260 C120 235, 240 212, 350 246 S620 286, 820 250 L820 420 L0 420 Z" fill="url(#shore)"/>
    <path d="M0 310 C160 290, 250 305, 390 330 S650 352, 820 324 L820 420 L0 420 Z" fill="#0d6880" opacity="0.62"/>
  </svg>
`)}`

export default function HeroCard() {
  return (
    <Card
      variant="elevated"
      size="md"
      className="overflow-hidden border-0 bg-[#f4f8f6] shadow-[0_12px_30px_rgba(15,44,39,0.08)]"
      style={{ borderRadius: '28px' }}
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 px-1 pt-1">
          <span className="inline-flex items-center rounded-full bg-[#0a7d7c] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
            الأكثر طلباً
          </span>

          <div className="flex items-center gap-2 text-[#0d5c5a]">
            <span className="text-[12px] font-bold text-[#0d5c5a]">حجزي</span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#d9f4f1] text-base font-bold text-[#0d5c5a]">
              🏠
            </span>
          </div>
        </div>

        <div className="px-1">
          <h2 className="text-center text-[33px] font-black leading-[1.12] tracking-[-0.06em] text-[#111827]" style={{ fontFamily: 'inherit' }}>
            استكشف إقاماتنا الفاخرة
          </h2>
        </div>

        <div className="flex items-center justify-between gap-3 px-1">
          <button className="inline-flex flex-1 items-center justify-center rounded-full bg-[#08a3a0] px-4 py-3 text-base font-extrabold text-white shadow-[0_8px_18px_rgba(8,163,160,0.25)]">
            اكتشف العقارات
          </button>

          <div className="flex items-center gap-2 rounded-full bg-[#f0f0ea] px-3 py-2 text-[#0c5d59] shadow-sm">
            <div className="flex items-center gap-1 text-[18px] font-black leading-none">
              <span>4.9</span>
            </div>
            <AiFillStar className="text-[#f4c95d]" size={16} />
            <span className="text-[10px] font-semibold text-[#4b5a5a]">(1,248)</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-[26px] bg-gradient-to-b from-[#0a8e88] via-[#62b9bf] to-[#7dd6cc]">
          <img src={scenicArt} alt="hero" className="h-[180px] w-full object-cover" />
        </div>
      </div>
    </Card>
  )
}
