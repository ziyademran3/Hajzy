import React, { useEffect, useState } from 'react'
import ReviewCard from '../components/ReviewCard'
import { fetchPropertyReviews, addPropertyReview } from '../lib/dataService'
import Skeleton from '../components/Skeleton'

export default function ReviewsPage({ property, user, language = 'ar', onBack = () => {} }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ rating: 5, text: '', image: null })
  const [submitting, setSubmitting] = useState(false)

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
        {loading ? (
          <Skeleton count={4} />
        ) : (
          <div className="review-list">
            {reviews.length === 0 ? (
              <div className="empty-reviews">{language === 'en' ? 'No reviews yet.' : 'لا توجد مراجعات بعد.'}</div>
            ) : (
              reviews.map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </div>
        )}

        <form className="review-form" onSubmit={handleSubmit}>
          <h3>{language === 'en' ? 'Write a review' : 'كتابة مراجعة'}</h3>
          <label>
            <span>{language === 'en' ? 'Rating' : 'التقييم'}</span>
            <select value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}>
              {[5,4,3,2,1].map((r) => <option key={r} value={r}>{r} ⭐</option>)}
            </select>
          </label>
          <label>
            <span>{language === 'en' ? 'Review' : 'المراجعة'}</span>
            <textarea value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} rows="4" />
          </label>
          <label>
            <span>{language === 'en' ? 'Photo (optional)' : 'صورة (اختياري)'} </span>
            <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={() => setForm({ rating:5, text:'', image:null })}>{language === 'en' ? 'Reset' : 'إعادة'}</button>
            <button className="primary-button" type="submit" disabled={submitting}>{submitting ? (language === 'en' ? 'Submitting...' : 'جارٍ الإرسال...') : (language === 'en' ? 'Submit review' : 'إرسال المراجعة')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
