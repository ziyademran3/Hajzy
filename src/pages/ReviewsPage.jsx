import React, { useEffect, useState } from 'react'
import ReviewCard from '../components/ReviewCard'
import { fetchPropertyReviews, addPropertyReview } from '../lib/dataService'
import Skeleton from '../components/Skeleton'

export default function ReviewsPage({ property, user, language = 'ar', onBack = () => {} }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ rating: 5, text: '', image: null })
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const loadReviews = async () => {
    setLoading(true)
    try {
      const rs = await fetchPropertyReviews(property?.id)
      setReviews(rs || [])
    } catch (err) {
      console.error('Failed to load reviews', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property?.id])

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setForm((f) => ({ ...f, image: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.text.trim()) return
    setSubmitting(true)
    setSuccessMsg('')
    try {
      const payload = {
        id: `rev-${Date.now()}`,
        propertyId: property?.id,
        authorId: user?.id || 'guest',
        authorName: user?.name || (language === 'en' ? 'Guest' : 'ضيف'),
        rating: Number(form.rating),
        text: form.text,
        image: form.image,
        date: new Date().toISOString(),
      }
      await addPropertyReview(payload)
      setForm({ rating: 5, text: '', image: null })
      setSuccessMsg(language === 'en' ? 'Thank you! Your review has been submitted.' : 'شكراً لك! تم إرسال تقييمك بنجاح.')
      await loadReviews()
    } catch (err) {
      console.error('Failed to submit review', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell reviews-shell">
      <div className="reviews-header">
        <button type="button" className="icon-button" onClick={onBack} aria-label={language === 'en' ? 'Back' : 'رجوع'}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2>{language === 'en' ? 'Reviews' : 'التقييمات'}</h2>
          <small>{property?.title}</small>
        </div>
      </div>

      <div className="reviews-content">
        {successMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
            {successMsg}
          </div>
        )}

        {loading ? (
          <Skeleton count={4} />
        ) : (
          <div className="review-list">
            {reviews.length === 0 ? (
              <div className="empty-reviews">{language === 'en' ? 'No reviews yet. Be the first to review!' : 'لا توجد مراجعات بعد. كن أول من يقيّم هذه الإقامة!'}</div>
            ) : (
              reviews.map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </div>
        )}

        <form className="review-form" onSubmit={handleSubmit}>
          <h3>{language === 'en' ? 'Write a review' : 'كتابة مراجعة'}</h3>
          
          <div className="review-rating-picker mb-3">
            <span className="block text-sm font-medium mb-1.5">{language === 'en' ? 'Rating' : 'التقييم'}</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rating: star }))}
                  className={`text-2xl transition hover:scale-110 ${form.rating >= star ? 'text-amber-400' : 'text-slate-300'}`}
                  aria-label={`${star} ${language === 'en' ? 'stars' : 'نجوم'}`}
                >
                  ★
                </button>
              ))}
              <span className="ms-2 font-bold text-slate-700 dark:text-slate-200">{form.rating} / 5</span>
            </div>
          </div>

          <label>
            <span>{language === 'en' ? 'Review text' : 'نص المراجعة'}</span>
            <textarea
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              placeholder={language === 'en' ? 'Share your experience staying here...' : 'شاركنا تفاصيل تجربتك وانطباعك عن الإقامة...'}
              rows="4"
              required
            />
          </label>
          
          <label>
            <span>{language === 'en' ? 'Photo (optional)' : 'صورة من الإقامة (اختياري)'}</span>
            <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
          
          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={() => setForm({ rating: 5, text: '', image: null })}>
              {language === 'en' ? 'Reset' : 'إعادة تعيين'}
            </button>
            <button className="primary-button" type="submit" disabled={submitting || !form.text.trim()}>
              {submitting ? (language === 'en' ? 'Submitting...' : 'جارٍ الإرسال...') : (language === 'en' ? 'Submit review' : 'إرسال المراجعة')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
