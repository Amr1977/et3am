import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { fetchWithFailover } from '../services/api';

interface Review {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewed_id: string;
  donation_id: string | null;
  donation_title: string | null;
  rating: number;
  comment: string | null;
  review_type: 'donor_to_receiver' | 'receiver_to_donor';
  created_at: string;
}

interface UserStats {
  avgRating: number;
  totalReviews: number;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await fetchWithFailover(`/api/reviews/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setStats(data.ratingStats || { avgRating: 0, totalReviews: 0 });
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="review-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`star ${star <= rating ? 'filled' : ''}`}>
            {star <= rating ? '⭐' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">👤</div>
        <div className="profile-info">
          <h1>{t('profile.title')}</h1>
          {stats && (
            <div className="profile-stats">
              {renderStars(Math.round(stats.avgRating))}
              <span className="rating-value">
                {stats.avgRating.toFixed(1)} ({stats.totalReviews} {t('profile.reviews')})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="reviews-section">
        <h2>{t('profile.reviews_title')}</h2>
        {reviews.length === 0 ? (
          <div className="no-reviews">
            <span>💬</span>
            <p>{t('profile.no_reviews')}</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <span className="review-type">
                    {review.review_type === 'donor_to_receiver' 
                      ? t('profile.from_donor') 
                      : t('profile.from_receiver')}
                  </span>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {renderStars(review.rating)}
                {review.comment && <p className="review-comment">{review.comment}</p>}
                {review.donation_title && (
                  <span className="review-donation">
                    re: {review.donation_title}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}