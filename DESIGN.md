# Hajzy Design System (نظام تصميم حجزي)

> **Document Version:** 1.0.0  
> **Aesthetic Profile:** Luxury Travel & Hospitality, Subtle Glassmorphism, Emerald Deep Tones, Tactile Micro-feedback.

---

## 🏛️ الهوية البصرية (Visual World)

تطبيق **"حجزي" (Hajzy)** يعتمد تجربة ضيافة وسياحة فاخرة (Tier-1 Luxury Hospitality) مستوحاة من جمال الساحل والمناطق التاريخية والحديثة في مصر والعالم العربي.
الهوية مبنية على درجات **الزمرد الداكن العميق (Deep Emerald Teal)** الممزوج بأسطح زجاجية حليبية ناعمة ولمسات ذهبية رملية هادئة للتقييمات والتفاصيل المميزة.

---

## 🎨 لوحة الألوان ورموز التصميم (Color Tokens)

### 1. الألوان الأساسية (Primary & Accents)
```css
:root {
  /* العلامة التجارية */
  --primary: #00433f;              /* زمردي عميق فاخر */
  --primary-strong: #0f766e;       /* زمردي متوسط للتركيز والتفاعل */
  --primary-soft: #dff8f4;         /* خلفيات مميزة خفيفة */
  --accent-gold: #d4a24c;          /* نجوم التقييمات والعروض الحصرية */

  /* الأسطح والبطاقات (Light Mode) */
  --bg-soft: #f7faf5;              /* خلفية الصفحة الحريرية */
  --bg-card: rgba(255, 255, 255, 0.96);
  --bg-card-alt: rgba(244, 247, 245, 0.96);
  --card-glass: rgba(255, 255, 255, 0.76);
  --card-glass-border: rgba(255, 255, 255, 0.55);

  /* النصوص والخطوط */
  --text: #101b1a;                 /* نص رئيسي عالي التباين */
  --muted: #3f4947;                /* نصوص ثانوية وتفاصيل */
  --line: rgba(15, 118, 110, 0.12);/* فواصل ناعمة */

  /* الظلال الحديثة (Ambient & Float) */
  --shadow-ambient: 0 1px 3px rgba(0, 67, 63, 0.04);
  --shadow-soft: 0 14px 34px rgba(15, 23, 42, 0.06);
  --shadow-float: 0 10px 32px rgba(0, 67, 63, 0.12), 0 2px 8px rgba(0, 67, 63, 0.06);
  --shadow-strong: 0 20px 42px rgba(13, 93, 88, 0.14);
}
```

### 2. الوضع المظلم (Dark Mode Tokens)
```css
.app-shell[data-theme='dark'] {
  --bg-soft: #0b0d10;              /* أسود أونيكس مريح للعين */
  --bg-card: rgba(17, 18, 21, 0.96);
  --bg-card-alt: rgba(23, 25, 28, 0.97);
  --card-glass: rgba(20, 22, 26, 0.78);
  --card-glass-border: rgba(255, 255, 255, 0.08);

  --primary: #f8fafc;              /* أزرار مضيئة عالية الوضوح */
  --primary-strong: #dfe5ec;
  --text: #f8fafc;
  --muted: #b7beca;
  --line: rgba(255, 255, 255, 0.08);

  --shadow-ambient: 0 1px 3px rgba(0, 0, 0, 0.2);
  --shadow-soft: 0 18px 42px rgba(0, 0, 0, 0.38);
  --shadow-float: 0 14px 36px rgba(0, 0, 0, 0.45);
}
```

---

## 🔤 التايبوجرافي والخطوط (Typography Scale)

* **الخط العربي:** `Cairo` و `Tajawal` لضمان قراءة عربية أصيلة وانسيابية.
* **الخط الإنجليزي:** `Inter` و `Poppins` لأناقة الأرقام والأسماء الدولية.
* **القواعد الصارمة:**
  - `text-wrap: balance` مطبق على كافة العناوين لمنع الكلمات المنفردة.
  - `font-variant-numeric: tabular-nums` إلزامي لجميع مبالغ الحجز، الأسعار لكل ليلة، والتقييمات الرقمية لمنع اضطراب العرض.

| المستوى | الحجم | الوزن | الاستخدام |
|---|---|---|---|
| **Display H1** | `1.75rem - 2.2rem` | 800 (ExtraBold) | العناوين الرئيسية للبانر |
| **Section H2/H3** | `1.2rem - 1.45rem` | 700 (Bold) | عناوين الأقسام وكروت الإقامة |
| **Body Large** | `1.0rem` | 500 (Medium) | نصوص المداخل والبحث |
| **Body Regular** | `0.85rem - 0.92rem`| 400 (Regular) / 500 | الوصف والمواصفات |
| **Caption / Badge** | `0.68rem - 0.75rem`| 700 (Bold) | الشارات والوسوم والمرافق |

---

## 📐 معايير اللمس والمساحات (Touch Targets & Spatial Grid)

وفقاً لمعايير **Impeccable & Mobile Standards**:
1. **الحد الأدنى لمساحة اللمس (Touch Target):** لا يقل أي زر، شريحة فلتر، أيقونة تنقل، أو عنصر اختيار عن `44px × 44px`.
2. **انحناء الحواف (Border Radii):**
   - الكروت والأسطح: `20px` إلى `24px`.
   - الأزرار وحقول الإدخال: `14px` إلى `16px`.
   - الشارات والأزرار الطافية (Pills): `999px`.

---

## ⚡ الحركة والتفاعل اللمسي (Micro-motion & Physics)

```css
:root {
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}

/* فيزياء الضغط */
button:active:not(:disabled),
.card-interactive:active {
  transform: scale(0.975);
}

/* دعم حساسية الحركة */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.1s !important;
  }
}
```
