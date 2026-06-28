import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWithFailover } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar_url: string | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

export default function TestimonialsPage() {
  const { t } = useTranslation();
  const { isAuthenticated, token, user } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithFailover('/api/testimonials')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.testimonials) setTestimonials(data.testimonials);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetchWithFailover('/api/testimonials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: content.trim(), rating }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: t('testimonial.submitted') || 'Testimonial submitted for review!' });
        setContent('');
        setRating(5);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || t('general.error') || 'Error submitting' });
      }
    } catch {
      setMessage({ type: 'error', text: t('general.network_error') || 'Network error' });
    } finally {
      setSubmitting(false);
    }
  };

  const stars = (val: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`star ${i < val ? 'filled' : ''}`}
        onClick={() => setRating(i + 1)}
        style={{ cursor: 'pointer', fontSize: '1.5rem', color: i < val ? '#f59e0b' : '#d1d5db' }}
      >
        ★
      </span>
    ));

  return (
    <div className="page-container testimonials-page">
      <div className="section-header">
        <span className="section-tag">{t('testimonials.tag') || 'Testimonials'}</span>
        <h1 className="section-title">{t('testimonials.title') || 'What People Say'}</h1>
        <p className="section-desc">{t('testimonials.desc') || 'Hear from our community members'}</p>
      </div>

      {isAuthenticated && (
        <div className="card testimonial-form-card">
          <h2>{t('testimonials.add_yours') || 'Add Your Testimonial'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>{t('testimonials.rating') || 'Rating'}</label>
              <div className="star-rating">{stars(rating)}</div>
            </div>
            <div className="form-group">
              <label>{t('testimonials.content') || 'Your Experience'}</label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={4}
                placeholder={t('testimonials.placeholder') || 'Share your experience with ET3AM...'}
                maxLength={500}
                required
              />
              <small>{content.length}/500</small>
            </div>
            {message && (
              <div className={`alert alert-${message.type}`}>{message.text}</div>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting || !content.trim()}>
              {submitting ? (t('common.submitting') || 'Submitting...') : (t('common.submit') || 'Submit')}
            </button>
          </form>
        </div>
      )}

      <div className="testimonials-grid">
        {loading ? (
          <div className="loading-text">{t('common.loading') || 'Loading...'}</div>
        ) : testimonials.length === 0 ? (
          <div className="empty-text">{t('testimonials.none') || 'No testimonials yet'}</div>
        ) : (
          testimonials.map(tst => (
            <div key={tst.id} className="testimonial-card">
              <div className="testimonial-avatar">
                {tst.avatar_url ? (
                  <img src={tst.avatar_url} alt={tst.name} />
                ) : (
                  <div className="testimonial-avatar-placeholder">{tst.name.charAt(0)}</div>
                )}
              </div>
              <div className="testimonial-stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <span key={i} style={{ color: i < tst.rating ? '#f59e0b' : '#d1d5db' }}>★</span>
                ))}
              </div>
              <p className="testimonial-content">"{tst.content}"</p>
              <div className="testimonial-author">
                <strong>{tst.name}</strong>
                <span>{tst.role === 'donor' ? t('home.donor') : t('home.receiver')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
