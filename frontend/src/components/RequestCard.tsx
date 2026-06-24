import React from 'react';

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
}

interface RequestCardProps {
  request: Request;
  onFulfill?: (id: string) => void;
  onChat?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  isOwner?: boolean;
  isFulfiller?: boolean;
  t: (key: string, params?: any) => string;
}

export default function RequestCard({ request, onFulfill, onChat, onEdit, onDelete, onClick, isOwner, isFulfiller, t }: RequestCardProps) {
  const statusColors: Record<string, string> = {
    open: '#22c55e',
    partially_fulfilled: '#f59e0b',
    fulfilled: '#3b82f6',
    cancelled: '#ef4444',
  };

  const progress = request.member_count > 0
    ? Math.min(100, Math.round((request.meals_fulfilled / request.member_count) * 100))
    : 0;

  return (
    <div className="donation-card" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="donation-card-header">
        <h3 className="donation-title">{request.title}</h3>
        <span className="donation-status" style={{ backgroundColor: statusColors[request.status] || '#6b7280' }}>
          {t(`requests.status.${request.status}`)}
        </span>
      </div>

      {request.description && <p className="donation-desc" dir="auto">{request.description}</p>}

      <div className="donation-details">
        <div className="donation-detail">
          <span className="detail-label">{t('requests.fields.member_count')}:</span>
          <span className="detail-value">{request.member_count}</span>
        </div>
        {request.address && (
          <div className="donation-detail">
            <span className="detail-label">{t('requests.fields.address')}:</span>
            <span className="detail-value">{request.address}</span>
          </div>
        )}
      </div>

      <div className="progress-bar-container" style={{ margin: '8px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', marginBottom: '4px' }}>
          <span>{t('requests.progress', { fulfilled: request.meals_fulfilled, total: request.member_count })}</span>
          <span>{progress}%</span>
        </div>
        <div style={{
          height: '8px',
          backgroundColor: 'var(--color-border, #e0e0e0)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: progress >= 100 ? '#22c55e' : '#3b82f6',
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {request.latitude && request.longitude && (
        <a
          href={`https://www.openstreetmap.org/?mlat=${request.latitude}&mlon=${request.longitude}#map=16/${request.latitude}/${request.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="map-link"
        >
          📍 {t('donations.view_map')}
        </a>
      )}

      <div className="donation-actions">
        {request.status !== 'fulfilled' && request.status !== 'cancelled' && !isOwner && onFulfill && (
          <button onClick={() => onFulfill(request.id)} className="btn btn-primary btn-sm">
            {t('requests.fulfill')}
          </button>
        )}
        {isFulfiller && onChat && (
          <button onClick={() => onChat(request.id)} className="btn btn-info btn-sm">
            💬 {t('chat.open_chat')}
          </button>
        )}
        {isOwner && (request.status === 'open' || request.status === 'partially_fulfilled') && onEdit && (
          <button onClick={() => onEdit(request.id)} className="btn btn-outline btn-sm">
            {t('requests.edit')}
          </button>
        )}
        {isOwner && request.status !== 'fulfilled' && request.status !== 'cancelled' && onDelete && (
          <button onClick={() => onDelete(request.id)} className="btn btn-danger btn-sm">
            {t('requests.cancel')}
          </button>
        )}
      </div>
    </div>
  );
}
