import React from 'react';

interface Donation {
  id: string;
  title: string;
  description?: string;
  food_type: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  latitude?: number | null;
  longitude?: number | null;
  pickup_date?: string;
  expiry_date?: string;
  status: string;
  donor_id: string;
  donor_name?: string;
  reserved_by_name?: string;
}

interface DonationCardProps {
  donation: Donation;
  onReserve?: (id: string) => void;
  onCancelReservation?: (id: string) => void;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMarkReceived?: (id: string) => void;
  onClick?: () => void;
  isOwner?: boolean;
  isReserver?: boolean;
  t: (key: string) => string;
}

export default function DonationCard({ donation, onReserve, onCancelReservation, onComplete, onDelete, onMarkReceived, onClick, isOwner, isReserver, t }: DonationCardProps) {
  const statusColors: Record<string, string> = {
    available: '#22c55e',
    reserved: '#f59e0b',
    received: '#8b5cf6',
    completed: '#3b82f6',
    expired: '#ef4444',
  };

  return (
    <div className="donation-card" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="donation-card-header">
        <h3 className="donation-title">{donation.title}</h3>
        <span className="donation-status" style={{ backgroundColor: statusColors[donation.status] || '#6b7280' }}>
          {t(`donations.${donation.status}`)}
        </span>
      </div>

      {donation.description && <p className="donation-desc">{donation.description}</p>}

      <div className="donation-details">
        <div className="donation-detail">
          <span className="detail-label">{t('donations.food_type')}:</span>
          <span className="detail-value">{donation.food_type}</span>
        </div>
        <div className="donation-detail">
          <span className="detail-label">{t('donations.quantity')}:</span>
          <span className="detail-value">{donation.quantity} {t(`donations.${donation.unit}`)}</span>
        </div>
        <div className="donation-detail">
          <span className="detail-label">{t('donations.pickup_address')}:</span>
          <span className="detail-value">{donation.pickup_address}</span>
        </div>
        {donation.pickup_date && (
          <div className="donation-detail">
            <span className="detail-label">{t('donations.pickup_date')}:</span>
            <span className="detail-value">{new Date(donation.pickup_date).toLocaleDateString()}</span>
          </div>
        )}
        {donation.expiry_date && (
          <div className="donation-detail">
            <span className="detail-label">{t('donations.expiry_date')}:</span>
            <span className="detail-value">{new Date(donation.expiry_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {donation.donor_name && (
        <p className="donation-meta">{t('donations.donated_by')}: {donation.donor_name}</p>
      )}
      {donation.reserved_by_name && (
        <p className="donation-meta">{t('donations.reserved_by')}: {donation.reserved_by_name}</p>
      )}

      {donation.latitude && donation.longitude && (
        <a
          href={`https://www.openstreetmap.org/?mlat=${donation.latitude}&mlon=${donation.longitude}#map=16/${donation.latitude}/${donation.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="map-link"
        >
          📍 {t('donations.view_map')}
        </a>
      )}

      <div className="donation-actions">
        {donation.status === 'available' && onReserve && (
          <button onClick={() => onReserve(donation.id)} className="btn btn-primary btn-sm">
            {t('donations.reserve')}
          </button>
        )}
        {donation.status === 'reserved' && onCancelReservation && (isReserver || isOwner) && (
          <button onClick={() => onCancelReservation(donation.id)} className="btn btn-warning btn-sm">
            {t('donations.cancel_reservation')}
          </button>
        )}
        {(donation.status === 'reserved' || donation.status === 'received') && isReserver && onMarkReceived && (
          <button onClick={() => onMarkReceived(donation.id)} className="btn btn-success btn-sm">
            {t('donations.mark_received')}
          </button>
        )}
        {donation.status === 'reserved' && isOwner && onComplete && (
          <button onClick={() => onComplete(donation.id)} className="btn btn-success btn-sm">
            {t('donations.complete')}
          </button>
        )}
        {isOwner && onDelete && (
          <button onClick={() => onDelete(donation.id)} className="btn btn-danger btn-sm">
            {t('donations.delete')}
          </button>
        )}
      </div>
    </div>
  );
}
