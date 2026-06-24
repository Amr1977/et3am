import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import LocationPicker from '../components/LocationPicker';
import RequestsMap from '../components/RequestsMap';
import RequestCard from '../components/RequestCard';
import { fetchWithFailover } from '../services/api';
import L from 'leaflet';

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
  requester_name?: string;
  created_at: string;
}

export default function Requests() {
  const { t } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const { onAdminNotification } = useSocket();
  const { playSound } = useSound();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('create') === 'true');
  const [filter, setFilter] = useState('open');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [browserLocation, setBrowserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [fulfillRequestId, setFulfillRequestId] = useState<string | null>(null);
  const [fulfillCount, setFulfillCount] = useState(1);
  const [fulfillNotes, setFulfillNotes] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBrowserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (err) => console.error('Geolocation error:', err),
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false }
    );
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    member_count: '1',
    address: '',
    latitude: '',
    longitude: '',
  });
  const [createError, setCreateError] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let url = `/api/requests?limit=50`;
      if (filter === 'open') url += '&status=open';
      else if (filter === 'partially_fulfilled') url += '&status=partially_fulfilled';
      else if (filter === 'fulfilled') url += '&status=fulfilled';

      if (browserLocation) {
        url += `&lat=${browserLocation.lat}&lng=${browserLocation.lng}`;
      }

      const res = await fetchWithFailover(url, { headers });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, token, browserLocation]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!formData.title || !formData.member_count || !formData.latitude || !formData.longitude) {
      setCreateError(t('validation.required_field'));
      return;
    }

    try {
      const res = await fetchWithFailover('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          member_count: parseInt(formData.member_count),
          address: formData.address || undefined,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        }),
      });

      if (res.ok) {
        setFormData({ title: '', description: '', member_count: '1', address: '', latitude: '', longitude: '' });
        setShowCreateForm(false);
        fetchRequests();
      } else {
        const data = await res.json();
        setCreateError(data.messageKey || t('general.server_error'));
      }
    } catch (err) {
      setCreateError(t('general.server_error'));
    }
  };

  const handleFulfill = async () => {
    if (!fulfillRequestId || fulfillCount < 1) return;

    try {
      const res = await fetchWithFailover(`/api/requests/${fulfillRequestId}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          meals_count: fulfillCount,
          notes: fulfillNotes || undefined,
        }),
      });

      if (res.ok) {
        setShowFulfillModal(false);
        setFulfillRequestId(null);
        setFulfillCount(1);
        setFulfillNotes('');
        fetchRequests();
      }
    } catch (err) {
      console.error('Fulfill error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('requests.confirm_delete'))) return;
    try {
      const res = await fetchWithFailover(`/api/requests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchRequests();
    } catch (err) {
      console.error('Delete request error:', err);
    }
  };

  const handleChat = (id: string) => {
    navigate(`/chat/request/${id}`);
  };

  return (
    <div className="donations-page">
      <div className="donations-header">
        <div>
          <h1>{t('requests.title')}</h1>
          <p className="subtitle">{t('requests.subtitle')}</p>
        </div>
        {isAuthenticated && (
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary">
            {showCreateForm ? '✕' : '+ '}{t('requests.create')}
          </button>
        )}
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="create-donation-form">
          <div className="form-group">
            <label>{t('requests.fields.title')} *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>{t('requests.fields.description')}</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>{t('requests.fields.member_count')} *</label>
            <input
              type="number"
              min="1"
              value={formData.member_count}
              onChange={e => setFormData({ ...formData, member_count: e.target.value })}
            />
            <small>{t('requests.fields.member_count_hint')}</small>
          </div>
          <div className="form-group">
            <label>{t('requests.fields.address')}</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="form-group">
            <LocationPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              onLocationChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
              t={t}
            />
          </div>

          {createError && <p className="error-message">{createError}</p>}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">{t('common.save')}</button>
            <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-ghost">{t('common.cancel')}</button>
          </div>
        </form>
      )}

      <div className="donations-controls">
        <div className="filter-tabs">
          {['open', 'partially_fulfilled', 'fulfilled', ''].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f ? t(`requests.status.${f}`) : t('donations.all')}
            </button>
          ))}
        </div>
        <div className="view-toggle">
          <button
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('grid')}
          >
            📰
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('map')}
          >
            🗺️
          </button>
        </div>
      </div>

      {viewMode === 'map' && (
        <RequestsMap
          requests={requests}
          t={t}
          onViewDetails={(id) => navigate(`/requests/${id}`)}
          onFulfill={isAuthenticated ? (id) => { setFulfillRequestId(id); setShowFulfillModal(true); } : undefined}
        />
      )}

      <div className={`donations-grid ${viewMode === 'map' ? 'hidden' : ''}`}>
        {loading ? (
          <div className="loading-spinner" />
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🙏</span>
            <p>{t('requests.empty')}</p>
            <small>{t('requests.empty_hint')}</small>
          </div>
        ) : (
          requests.map(r => (
            <RequestCard
              key={r.id}
              request={r}
              t={t}
              onClick={() => navigate(`/requests/${r.id}`)}
              onFulfill={isAuthenticated && r.requester_id !== user?.id
                ? (id) => { setFulfillRequestId(id); setShowFulfillModal(true); }
                : undefined}
              onChat={isAuthenticated ? (id) => navigate(`/chat/request/${id}`) : undefined}
              onDelete={r.requester_id === user?.id ? handleDelete : undefined}
              isOwner={r.requester_id === user?.id}
              isFulfiller={false}
            />
          ))
        )}
      </div>

      {showFulfillModal && fulfillRequestId && (
        <div className="modal-overlay" onClick={() => setShowFulfillModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('requests.fulfill_title')}</h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{t('requests.fulfill_hint')}</label>
                <input
                  type="number"
                  min="1"
                  value={fulfillCount}
                  onChange={e => setFulfillCount(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="form-group">
                <label>{t('requests.notes')}</label>
                <textarea
                  value={fulfillNotes}
                  onChange={e => setFulfillNotes(e.target.value)}
                  placeholder={t('requests.notes')}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleFulfill} className="btn btn-primary">
                {t('requests.fulfill')}
              </button>
              <button onClick={() => setShowFulfillModal(false)} className="btn btn-ghost">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
