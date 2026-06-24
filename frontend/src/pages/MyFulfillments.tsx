import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchWithFailover } from '../services/api';
import RequestCard from '../components/RequestCard';

interface Request {
  id: string;
  title: string;
  description?: string;
  member_count: number;
  meals_fulfilled: number;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  requester_id: string;
  created_at: string;
}

export default function MyFulfillments() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFulfillments = useCallback(async () => {
    try {
      const res = await fetchWithFailover('/api/requests/my-fulfillments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Fetch fulfillments error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFulfillments();
  }, [fetchFulfillments]);

  return (
    <div className="donations-page">
      <div className="donations-header">
        <div>
          <h1>{t('requests.my_fulfillments')}</h1>
        </div>
        <button onClick={() => navigate('/requests')} className="btn btn-outline">
          {t('nav.requests')}
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">✅</span>
          <p>{t('requests.empty')}</p>
          <small>{t('requests.empty_hint')}</small>
        </div>
      ) : (
        <div className="donations-grid">
          {requests.map(r => (
            <RequestCard
              key={r.id}
              request={r}
              t={t}
              onClick={() => navigate(`/requests/${r.id}`)}
              onChat={(id) => navigate(`/chat/request/${id}`)}
              isOwner={false}
              isFulfiller={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
