import React from 'react'
import Card from './Card'

export default function CardExamples() {
  const onCardClick = () => {
    // simple demo handler
    // eslint-disable-next-line no-alert
    alert('Card clicked! (interactive)')
  }

  return (
    <div className="space-y-8 p-6">
      {/* Light mode examples */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Light mode — أمثلة البطاقات</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default" size="md">
            <div className="space-y-2">
              <h4 className="text-base font-semibold">بطاقة عادية</h4>
              <p className="text-sm text-gray-600">هذا مثال لبطاقة افتراضية بخلفية بيضاء وظل خفيف.</p>
            </div>
          </Card>

          <Card variant="outlined" size="md">
            <div className="space-y-2">
              <h4 className="text-base font-semibold">بطاقة مع صورة</h4>
              <div className="rounded-md overflow-hidden">
                <img src="https://images.unsplash.com/photo-1501117716987-c8e9077d1b13?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder" alt="property" className="w-full h-36 object-cover" />
              </div>
              <p className="text-sm text-gray-600">مع نص توضيحي أسفله.</p>
            </div>
          </Card>

          <Card variant="interactive" size="md" onClick={onCardClick}>
            <div className="space-y-2">
              <h4 className="text-base font-semibold">بطاقة تفاعلية</h4>
              <p className="text-sm text-gray-600">يمكن الضغط على هذه البطاقة (hover / focus / press).</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Dark mode examples — wrap with .dark to preview dark tokens (works if Tailwind configured with class strategy) */}
      <section className="dark">
        <h3 className="text-lg font-semibold mb-4 text-white">Dark mode — أمثلة البطاقات</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="default" size="md">
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-hajzy-text">بطاقة عادية</h4>
              <p className="text-sm text-hajzy-muted">هذا مثال لبطاقة داكنة بخلفية Slate 800 وحدود Slate 700.</p>
            </div>
          </Card>

          <Card variant="outlined" size="md">
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-hajzy-text">بطاقة مع صورة</h4>
              <div className="rounded-md overflow-hidden">
                <img src="https://images.unsplash.com/photo-1501117716987-c8e9077d1b13?q=80&w=800&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder" alt="property" className="w-full h-36 object-cover" />
              </div>
              <p className="text-sm text-hajzy-muted">مع نص توضيحي أسفله.</p>
            </div>
          </Card>

          <Card variant="interactive" size="md" onClick={onCardClick}>
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-hajzy-text">بطاقة تفاعلية</h4>
              <p className="text-sm text-hajzy-muted">اضغط لمشاهدة التفاعل.</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
