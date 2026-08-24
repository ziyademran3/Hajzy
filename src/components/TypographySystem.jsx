import React from 'react';

// TypographySystem
// - Provides simple presentational components for the requested scale:
//   Hero (32px), H1 (24px), Body (16px), Caption (12px), Price (18px)
// - Uses the Tailwind font families defined in tailwind.config.js:
//   font-cairo for Arabic headings/body, font-poppins for numbers/prices

export const Hero = ({ children, className = '' }) => (
  <h0 className={`text-[32px] leading-tight font-cairo font-bold ${className}`}>{children}</h0>
);

export const H1 = ({ children, className = '' }) => (
  <h1 className={`text-[24px] leading-snug font-cairo font-bold ${className}`}>{children}</h1>
);

export const Body = ({ children, className = '' }) => (
  <p className={`text-[16px] leading-relaxed font-cairo ${className}`}>{children}</p>
);

export const Caption = ({ children, className = '' }) => (
  <span className={`text-[12px] leading-tight font-cairo text-hajzy-muted ${className}`}>{children}</span>
);

export const Price = ({ children, currency = 'ج.م', className = '' }) => (
  <div className={`text-[18px] font-poppins font-semibold ${className}`}>
    <span className="ml-1">{children}</span>
    <span className="text-[14px] font-medium"> {currency}</span>
  </div>
);

// Examples component to show Arabic and English usage
export const TypographyExamples = () => {
  const isRtl = typeof document !== 'undefined' && document.documentElement?.dir === 'rtl';

  return (
    <div className={`p-6 space-y-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className="space-y-1">
        <Hero>مرحبا بك ziad omran</Hero>
        <Caption>Hero — Cairo Bold, 32px</Caption>
      </div>

      <div className="space-y-1">
        <H1>عنوان الصفحة</H1>
        <Caption>H1 — Cairo Bold, 24px</Caption>
      </div>

      <div className="space-y-1">
        <Body>
          هذا نص مثال يوضح كيفية ظهور النص العربي باستخدام خط Cairo Regular. الأرقام أدناه تستخدم Poppins لوضوح أكثر: 61,000
        </Body>
        <Price>61,000</Price>
        <Caption>Body — Cairo Regular, 16px · Numbers — Poppins</Caption>
      </div>

      <div className="space-y-1">
        <H1 className="ltr:font-sans">Welcome, Ziad</H1>
        <Body className="ltr:font-sans">This is an English example (LTR) using the same scale. Dates and currency should format based on locale.</Body>
        <Price currency="EGP">61,000</Price>
        <Caption>English numbers use Poppins for alignment and consistency.</Caption>
      </div>
    </div>
  );
};

export default TypographyExamples;
