import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import DonationCard from '../components/DonationCard';
import DonationMap from '../components/DonationMap';

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
  reserved_by?: string;
  reserved_by_name?: string;
}

export default function Donations() {
  const { t } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('create') === 'true');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [locationLoading, setLocationLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    food_type: '',
    quantity: '1',
    unit: 'portions',
    pickup_address: '',
    pickup_date: '',
    expiry_date: '',
    latitude: '',
    longitude: '',
  });

  const fetchDonations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`/api/donations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDonations(data.donations);
      }
    } catch (err) {
      console.error('Failed to fetch donations');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const handleReserve = async (id: string) => {
    try {
      const res = await fetch(`/api/donations/${id}/reserve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchDonations();
    } catch (err) {
      console.error('Failed to reserve donation');
    }
  };

  const handleCancelReservation = async (id: string) => {
    try {
      const res = await fetch(`/api/donations/${id}/cancel-reservation`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchDonations();
    } catch (err) {
      console.error('Failed to cancel reservation');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const res = await fetch(`/api/donations/${id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchDonations();
    } catch (err) {
      console.error('Failed to complete donation');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchDonations();
    } catch (err) {
      console.error('Failed to delete donation');
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
        setLocationLoading(false);
      },
      () => {
        alert('Unable to retrieve your location');
        setLocationLoading(false);
      }
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
        }),
      });
      if (res.ok) {
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          food_type: '',
          quantity: '1',
          unit: 'portions',
          pickup_address: '',
          pickup_date: '',
          expiry_date: '',
          latitude: '',
          longitude: '',
        });
        fetchDonations();
      }
    } catch (err) {
      console.error('Failed to create donation');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="loading-page">{t('common.loading')}</div>;

  return (
    <div className="donations-page">
      <div className="page-header">
        <h1>{t('donations.title')}</h1>
        <div className="page-header-actions">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
            className="btn btn-outline"
          >
            {viewMode === 'grid' ? `🗺️ ${t('donations.view_map')}` : `📋 ${t('donations.view_grid')}`}
          </button>
          {isAuthenticated && user?.role === 'donor' && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn btn-primary"
            >
              {showCreateForm ? t('donations.cancel') : `+ ${t('donations.create_title')}`}
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="create-form-card">
          <h2>{t('donations.create_title')}</h2>
          <form onSubmit={handleCreate} className="donation-form">
            <div className="form-row">
              <div className="form-group">
                <label>{t('donations.title')}</label>
                <input name="title" value={formData.title} onChange={handleChange} required className="form-input" />
              </div>
              <div className="form-group">
                <label>{t('donations.food_type')}</label>
                <input name="food_type" value={formData.food_type} onChange={handleChange} required className="form-input" />
              </div>
            </div>
            <div className="form-group">
              <label>{t('donations.description')}</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="form-input" rows={3} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('donations.quantity')}</label>
                <input name="quantity" type="number" min="1" value={formData.quantity} onChange={handleChange} required className="form-input" />
              </div>
              <div className="form-group">
                <label>{t('donations.unit')}</label>
                <select name="unit" value={formData.unit} onChange={handleChange} className="form-input">
                  <option value="portions">{t('donations.portions')}</option>
                  <option value="kg">{t('donations.kg')}</option>
                  <option value="items">{t('donations.items')}</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>{t('donations.pickup_address')}</label>
              <input name="pickup_address" value={formData.pickup_address} onChange={handleChange} required className="form-input" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('donations.latitude')}</label>
                <input name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} className="form-input" placeholder="30.0444" />
              </div>
              <div className="form-group">
                <label>{t('donations.longitude')}</label>
                <input name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} className="form-input" placeholder="31.2357" />
              </div>
            </div>
            <button type="button" onClick={handleUseCurrentLocation} className="btn btn-outline btn-sm" disabled={locationLoading}>
              📍 {locationLoading ? t('common.loading') : t('donations.use_current_location')}
            </button>
            <div className="form-row" style={{ marginTop: '0.5rem' }}>
              <div className="form-group">
                <label>{t('donations.pickup_date')}</label>
                <input name="pickup_date" type="datetime-local" value={formData.pickup_date} onChange={handleChange} className="form-input" />
              </div>
              <div className="form-group">
                <label>{t('donations.expiry_date')}</label>
                <input name="expiry_date" type="datetime-local" value={formData.expiry_date} onChange={handleChange} className="form-input" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">{t('donations.save')}</button>
          </form>
        </div>
      )}

      <div className="filter-bar">
        {['all', 'available', 'reserved', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
          >
            {status === 'all' ? t('donations.filter_all') : t(`donations.${status}`)}
          </button>
        ))}
      </div>

      {viewMode === 'map' ? (
        <DonationMap donations={donations} t={t} />
      ) : (
        <div className="donations-grid">
          {donations.length === 0 ? (
            <div className="empty-state">
              <p>{t('donations.no_donations')}</p>
            </div>
          ) : (
            donations.map((donation) => (
              <DonationCard
                key={donation.id}
                donation={donation}
                onReserve={isAuthenticated && user?.role === 'recipient' && donation.status === 'available' ? handleReserve : undefined}
                onCancelReservation={isAuthenticated && (donation.reserved_by === user?.id || donation.donor_id === user?.id || user?.role === 'admin') ? handleCancelReservation : undefined}
                onComplete={isAuthenticated && (donation.donor_id === user?.id || user?.role === 'admin') ? handleComplete : undefined}
                onDelete={isAuthenticated && (donation.donor_id === user?.id || user?.role === 'admin') ? handleDelete : undefined}
                isOwner={donation.donor_id === user?.id}
                isReserver={donation.reserved_by === user?.id}
                t={t}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
