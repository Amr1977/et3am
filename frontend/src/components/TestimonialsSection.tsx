import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchWithFailover } from '../services/api';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar_url: string | null;
  is_featured: boolean;
  created_at: string;
}

export default function TestimonialsSection() {
  const { t } = useTranslation();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetchWithFailover('/api/testimonials')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.testimonials) setTestimonials(data.testimonials);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  const tst = testimonials[activeIndex];

  const stars = Array.from({ length: 5 }, (_, i) => i < tst.rating ? '★' : '☆');

  return (
    <section className="testimonials-section">
      <div className="section-header">
        <span className="section-tag">{t('testimonials.tag') || 'Testimonials'}</span>
        <h2 className="section-title">{t('testimonials.title') || 'What People Say'}</h2>
        <p className="section-desc">{t('testimonials.desc') || 'Hear from our community members'}</p>
      </div>

      <div className="testimonials-carousel">
        <div className="testimonial-card" key={tst.id}>
          <div className="testimonial-avatar">
            {tst.avatar_url ? (
              <img src={tst.avatar_url} alt={tst.name} />
            ) : (
              <div className="testimonial-avatar-placeholder">
                {tst.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="testimonial-stars">{stars.join(' ')}</div>
          <p className="testimonial-content">"{tst.content}"</p>
          <div className="testimonial-author">
            <strong>{tst.name}</strong>
            <span>{tst.role === 'donor' ? t('home.donor') : t('home.receiver')}</span>
          </div>
        </div>

        {testimonials.length > 1 && (
          <div className="testimonial-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === activeIndex ? 'active' : ''}`}
                onClick={() => setActiveIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
