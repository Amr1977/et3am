import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { fetchWithFailover } from '../services/api';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getServerUrl, getInitialTileUrl } from '../services/api';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Fulfillment {
  id: string;
  donor_id: string;
  donor_name: string;
  meals_count: number;
  notes?: string;
  created_at: string;
}

interface RequestDetail {
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
  fulfillments: Fulfillment[];
  created_at: string;
}

function MapInteractionHandler({ onInteraction }: { onInteraction: () => void }) {
  const map = useMap();
  const hasTriggered = useRef(false);

  useEffect(() => {
    const handleInteraction = () => {
      if (!hasTriggered.current) {
        hasTriggered.current = true;
        onInteraction();
      }
    };

    map.on('dragstart', handleInteraction);
    map.on('zoomstart', handleInteraction);

    return () => {
      map.off('dragstart', handleInteraction);
      map.off('zoomstart', handleInteraction);
    };
  }, [map, onInteraction]);

  return null;
}

function MapResizeHandler({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map, active]);
  return null;
}

export default function RequestDetails() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tileUrl, setTileUrl] = useState<string>(getInitialTileUrl());
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [fulfillCount, setFulfillCount] = useState(1);
  const [fulfillNotes, setFulfillNotes] = useState('');
  const [mapFullscreen, setMapFullscreen] = useState(false);

  useEffect(() => {
    getServerUrl().then(url => setTileUrl(`${url}/api/maps/tiles/{z}/{x}/{y}.png`));
  }, []);

  useEffect(() => {
    if (!mapFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMapFullscreen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mapFullscreen]);

  useEffect(() => {
    if (!id) return;

    const fetchRequest = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetchWithFailover(`/api/requests/${id}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setRequest(data.request);
        }
      } catch (err) {
        console.error('Fetch request error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, token]);

  const handleFulfill = async () => {
    if (!id || fulfillCount < 1) return;

    try {
      const res = await fetchWithFailover(`/api/requests/${id}/fulfill`, {
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
        const data = await res.json();
        setRequest(prev => prev ? {
          ...prev,
          meals_fulfilled: data.request.meals_fulfilled,
          status: data.request.status,
          fulfillments: [...prev.fulfillments, data.fulfillment],
        } : prev);
        setShowFulfillModal(false);
        setFulfillCount(1);
        setFulfillNotes('');
      }
    } catch (err) {
      console.error('Fulfill error:', err);
    }
  };

  if (loading) {
    return <div className="loading-spinner" />;
  }

  if (!request) {
    return (
      <div className="empty-state">
        <p>{t('requests.not_found')}</p>
        <button onClick={() => navigate('/requests')} className="btn btn-primary">
          {t('common.back')}
        </button>
      </div>
    );
  }

  const isOwner = request.requester_id === user?.id;
  const isFulfiller = request.fulfillments.some(f => f.donor_id === user?.id);
  const progress = request.member_count > 0
    ? Math.min(100, Math.round((request.meals_fulfilled / request.member_count) * 100))
    : 0;
  const remaining = request.member_count - request.meals_fulfilled;

  const statusColors: Record<string, string> = {
    open: '#22c55e',
    partially_fulfilled: '#f59e0b',
    fulfilled: '#3b82f6',
    cancelled: '#ef4444',
  };

  return (
    <div className="meal-details-page">
      <div className="meal-details-container">
        <button onClick={() => navigate('/requests')} className="btn btn-ghost" style={{ marginBottom: '16px' }}>
          ← {t('common.back')}
        </button>

        <div className="meal-details-header">
          <h1>{request.title}</h1>
          <span className="donation-status" style={{ backgroundColor: statusColors[request.status] || '#6b7280' }}>
            {t(`requests.status.${request.status}`)}
          </span>
        </div>

        {request.description && <p className="meal-description" dir="auto">{request.description}</p>}

        <div className="meal-info-grid">
          <div className="meal-info-item">
            <span className="info-label">{t('requests.fields.member_count')}</span>
            <span className="info-value">{request.member_count}</span>
          </div>
          {request.address && (
            <div className="meal-info-item">
              <span className="info-label">{t('requests.fields.address')}</span>
              <span className="info-value">{request.address}</span>
            </div>
          )}
        </div>

        <div className="progress-section" style={{ margin: '24px 0' }}>
          <h3>{t('requests.progress', { fulfilled: request.meals_fulfilled, total: request.member_count })}</h3>
          <div style={{
            height: '12px',
            backgroundColor: 'var(--color-border, #e0e0e0)',
            borderRadius: '6px',
            overflow: 'hidden',
            marginTop: '8px',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: progress >= 100 ? '#22c55e' : '#3b82f6',
              borderRadius: '6px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          {remaining > 0 && (
            <p style={{ marginTop: '8px', color: 'var(--color-text-secondary)' }}>
              {t('requests.remaining', { count: remaining })}
            </p>
          )}
        </div>

        {request.latitude && request.longitude && (
          <div
            className={`detail-map${mapFullscreen ? ' fullscreen' : ''}`}
            style={mapFullscreen ? {
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              width: '100vw',
              height: '100vh',
              background: '#fff',
              overflow: 'hidden',
            } : { height: '300px', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}
          >
            <MapContainer
              center={[request.latitude, request.longitude]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              key={`${request.latitude}-${request.longitude}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url={tileUrl}
              />
              <Marker position={[request.latitude, request.longitude]} />
              {!mapFullscreen && (
                <MapInteractionHandler onInteraction={() => setMapFullscreen(true)} />
              )}
              <MapResizeHandler active={mapFullscreen} />
            </MapContainer>
            {mapFullscreen && (
              <button
                className="map-fullscreen-close"
                onClick={() => setMapFullscreen(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  zIndex: 1000,
                  background: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}

        <div className="action-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {!isOwner && request.status !== 'fulfilled' && request.status !== 'cancelled' && isAuthenticated && (
            <button onClick={() => setShowFulfillModal(true)} className="btn btn-primary">
              {t('requests.fulfill')}
            </button>
          )}
          {isAuthenticated && (isOwner || isFulfiller) && (
            <button onClick={() => navigate(`/chat/request/${request.id}`)} className="btn btn-info">
              💬 {isOwner ? t('requests.chat_with') : t('requests.chat_with_requester')}
            </button>
          )}
        </div>

        {request.fulfillments.length > 0 && (
          <div className="fulfillments-section">
            <h3>{t('support.tickets')}</h3>
            <div className="chat-messages" style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '12px' }}>
              {request.fulfillments.map(f => (
                <div key={f.id} className="chat-message other" style={{ marginBottom: '12px' }}>
                  <div className="message-bubble">
                    <strong>{f.donor_name}</strong> {t('requests.fulfill')} {f.meals_count} {f.meals_count === 1 ? 'meal' : 'meals'}
                    {f.notes && <p style={{ marginTop: '4px', fontSize: '0.9em' }}>{f.notes}</p>}
                    <span className="message-time">
                      {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {request.status === 'fulfilled' && (
          <div className="empty-state" style={{ marginTop: '24px', padding: '24px' }}>
            <span style={{ fontSize: '48px' }}>🎉</span>
            <p style={{ fontWeight: 'bold', marginTop: '8px' }}>
              {t('donations.completed')}
            </p>
          </div>
        )}
      </div>

      {showFulfillModal && (
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
                  max={remaining}
                  value={fulfillCount}
                  onChange={e => setFulfillCount(Math.max(1, Math.min(remaining, parseInt(e.target.value) || 1)))}
                />
                <small>{t('requests.remaining', { count: remaining })}</small>
              </div>
              <div className="form-group">
                <label>{t('requests.notes')}</label>
                <textarea
                  value={fulfillNotes}
                  onChange={e => setFulfillNotes(e.target.value)}
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
