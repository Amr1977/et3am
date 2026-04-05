import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import ClusterMap from '../components/ClusterMap';
import { fetchWithFailover } from '../services/api';

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
  hash_code?: string;
  created_at: string;
}

const foodIcons: Record<string, string> = {
  'meat': '🥩',
  'chicken': '🍗',
  'fish': '🐟',
  'vegetables': '🥬',
  'fruits': '🍎',
  'bread': '🍞',
  'rice': '🍚',
  'pasta': '🍝',
  'soup': '🥣',
  'dessert': '🍰',
  'other': '🍽️',
};

function getFoodIcon(type: string): string {
  const key = type.toLowerCase();
  for (const [k, v] of Object.entries(foodIcons)) {
    if (key.includes(k)) return v;
  }
  return foodIcons['other'];
}

export default function Donations() {
  const { t } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get('create') === 'true');
  const [filter, setFilter] = useState('available');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
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
  const [createError, setCreateError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const paginatedDonations = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return donations.slice(start, start + ITEMS_PER_PAGE);
  }, [donations, currentPage]);

  const totalPages = Math.ceil(donations.length / ITEMS_PER_PAGE);

  const fetchDonations = useCallback(async () => {
    try {
      console.log('Fetching donations, filter:', filter);
      const params = new URLSearchParams();
      
      // Pass user location for distance sorting
      if (user?.latitude && user?.longitude) {
        params.set('lat', user.latitude.toString());
        params.set('lng', user.longitude.toString());
      }
      
      // Use filter parameter - 'available', 'reserved', 'completed'
      // For unauthenticated users, only 'available' works
      if (isAuthenticated) {
        if (filter === 'all') {
          // Show all statuses user has access to
        } else {
          params.set('filter', filter);
        }
      } else {
        // Unauthenticated - only show available
        params.set('filter', 'available');
      }
      
      const res = await fetchWithFailover(`/api/donations?${params}`);
      console.log('Response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('API response:', JSON.stringify(data, null, 2));
        setDonations(data.donations);
      } else {
        console.error('API error:', res.status);
      }
    } catch (err) {
      console.error('Failed to fetch donations:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, isAuthenticated]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const navigate = useNavigate();
  
  const handleReserve = async (id: string) => {
    try {
      const res = await fetchWithFailover(`/api/donations/${id}/reserve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // Navigate to meal details page to show map and directions
        navigate(`/donations/${id}`);
      }
    } catch (err) {
      console.error('Failed to reserve donation');
    }
  };

  const handleCancelReservation = async (id: string) => {
    try {
      const res = await fetchWithFailover(`/api/donations/${id}/cancel-reservation`, {
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
      const res = await fetchWithFailover(`/api/donations/${id}/complete`, {
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
      const res = await fetchWithFailover(`/api/donations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchDonations();
    } catch (err) {
      console.error('Failed to delete donation');
    }
  };

  const handleLocationChange = (lat: string, lng: string) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      const res = await fetchWithFailover('/api/donations', {
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
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Create donation error:', res.status, errorData);
        setCreateError(errorData.error || errorData.messageKey || `Failed to create donation (${res.status})`);
      }
    } catch (err) {
      setCreateError('Unable to connect to server. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'var(--success)';
      case 'reserved': return 'var(--warning)';
      case 'completed': return 'var(--text-muted)';
      case 'expired': return 'var(--danger)';
      default: return 'var(--text-muted)';
    }
  };

  if (loading) {
    return (
      <div className="donations-loading">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="donations-page">
      <div className="donations-header">
        <div className="donations-title-section">
          <h1>{t('donations.title')}</h1>
          <p className="donations-count">
            {donations.length} {donations.length === 1 ? t('donations.donation_found') : t('donations.donations_found')}
          </p>
        </div>
        
        <div className="donations-actions">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
            className="btn btn-outline btn-sm"
          >
            {viewMode === 'grid' ? '🗺️' : '📋'} {viewMode === 'grid' ? t('donations.view_map') : t('donations.view_grid')}
          </button>
          {isAuthenticated && user?.can_donate && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn btn-primary btn-sm"
            >
              {showCreateForm ? '✕' : '+'} {showCreateForm ? t('donations.cancel') : t('donations.create_title')}
            </button>
          )}
        </div>
      </div>

      {showCreateForm && (
        <div className="create-form-container">
          <div className="create-form-card">
            <div className="create-form-header">
              <span className="create-form-icon">🍽️</span>
              <h2>{t('donations.create_title')}</h2>
            </div>
            
            {createError && (
              <div className="form-error" style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.75rem', background: 'color-mix(in srgb, var(--danger) 10%, transparent)', borderRadius: 'var(--radius)' }}>
                {createError}
              </div>
            )}
            
            <form onSubmit={handleCreate} className="donation-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('donations.title')} *</label>
                  <input 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    required 
                    className="form-input" 
                    placeholder="e.g., Fresh Biryani"
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('donations.food_type')} *</label>
                  <select name="food_type" value={formData.food_type} onChange={handleChange} required className="form-input">
                    <option value="">{t('food_types.select_type')}</option>
                    <option value="meat">🥩 {t('food_types.meat')}</option>
                    <option value="chicken">🍗 {t('food_types.chicken')}</option>
                    <option value="fish">🐟 {t('food_types.fish')}</option>
                    <option value="vegetables">🥬 {t('food_types.vegetables')}</option>
                    <option value="fruits">🍎 {t('food_types.fruits')}</option>
                    <option value="bread">🍞 {t('food_types.bread')}</option>
                    <option value="rice">🍚 {t('food_types.rice')}</option>
                    <option value="pasta">🍝 {t('food_types.pasta')}</option>
                    <option value="soup">🥣 {t('food_types.soup')}</option>
                    <option value="dessert">🍰 {t('food_types.dessert')}</option>
                    <option value="other">🍽️ {t('food_types.other')}</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>{t('donations.description')}</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  className="form-input" 
                  rows={2}
                  placeholder="Describe the food..."
                />
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('donations.quantity')} *</label>
                  <input 
                    name="quantity" 
                    type="number" 
                    min="1" 
                    value={formData.quantity} 
                    onChange={handleChange} 
                    required 
                    className="form-input" 
                  />
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
                <label>{t('donations.pickup_address')} *</label>
                <input 
                  name="pickup_address" 
                  value={formData.pickup_address} 
                  onChange={handleChange} 
                  required 
                  className="form-input" 
                  placeholder="Full address for pickup"
                />
              </div>

              <div className="form-group">
                <label>{t('donations.pickup_location')}</label>
                <LocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onLocationChange={handleLocationChange}
                  t={t}
                />
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('donations.pickup_date')}</label>
                  <input 
                    name="pickup_date" 
                    type="datetime-local" 
                    value={formData.pickup_date} 
                    onChange={handleChange} 
                    className="form-input" 
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('donations.expiry_date')}</label>
                  <input 
                    name="expiry_date" 
                    type="datetime-local" 
                    value={formData.expiry_date} 
                    onChange={handleChange} 
                    className="form-input" 
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-outline">
                  {t('donations.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('donations.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="filter-tabs">
        {isAuthenticated ? (
          <>
            {['available', 'reserved', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
              >
                {t(`donations.${status}`)}
              </button>
            ))}
          </>
        ) : (
          <button
            key="available"
            onClick={() => setFilter('available')}
            className={`filter-tab ${filter === 'available' ? 'active' : ''}`}
          >
            {t('donations.available')}
          </button>
        )}
      </div>

      {viewMode === 'map' ? (
        donations.some(d => d.latitude && d.longitude) || user?.latitude ? (
          <div style={{ height: '500px' }}>
            <ClusterMap 
              donations={donations} 
              userLocation={user?.latitude && user?.longitude ? { lat: user.latitude, lng: user.longitude } : null}
              t={t}
              onReserve={handleReserve}
              isAuthenticated={isAuthenticated}
            />
          </div>
        ) : (
          <div className="donations-map-placeholder">
            <div className="map-placeholder-content">
              <span>🗺️</span>
              <p>No donations with location data yet</p>
            </div>
          </div>
        )
      ) : (
        <>
          {paginatedDonations.length === 0 ? (
            <div className="empty-state-container">
              <div className="empty-state-icon">🍽️</div>
              <h3>{t('donations.no_donations')}</h3>
              <p>Be the first to share food with those in need</p>
              {isAuthenticated && user?.can_receive && (
                <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
                  {t('donations.create_title')}
                </button>
              )}
            </div>
          ) : (
            <div className="donations-grid">
              {paginatedDonations.map((donation) => (
                <div 
                  key={donation.id} 
                  className={`donation-card-new ${donation.status}`}
                  id={donation.id}
                  onClick={() => setSelectedDonation(donation)}
                >
                  <div className="donation-card-header">
                    <span className="donation-food-icon">{getFoodIcon(donation.food_type)}</span>
                    <span 
                      className="donation-status-badge"
                      style={{ backgroundColor: getStatusColor(donation.status) }}
                    >
                      {t(`donations.${donation.status}`)}
                    </span>
                  </div>
                  
                  <h3 className="donation-title">{donation.title}</h3>
                  
                  {donation.description && (
                    <p className="donation-desc">{donation.description.slice(0, 80)}{donation.description.length > 80 ? '...' : ''}</p>
                  )}
                  
                  <div className="donation-meta">
                    <div className="donation-meta-item">
                      <span className="meta-label">{t('donations.quantity')}</span>
                      <span className="meta-value">{donation.quantity} {t(`donations.${donation.unit}`)}</span>
                    </div>
                    {donation.reserved_by !== user?.id && donation.donor_name && (
                      <div className="donation-meta-item">
                        <span className="meta-label">{t('donations.donated_by')}</span>
                        <span className="meta-value">{donation.donor_name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="donation-address">
                    <span className="address-icon">📍</span>
                    <span className="address-text">
                      {isAuthenticated && (donation.donor_id === user?.id || donation.reserved_by === user?.id)
                        ? donation.pickup_address || 'No address'
                        : (isAuthenticated ? t('donations.address_hidden') : t('donations.login_to_see'))}
                    </span>
                  </div>
                  
                  <div className="donation-card-footer">
                    {donation.hash_code && donation.reserved_by === user?.id && (
                      <div className="hash-code-display">
                        <span className="hash-label">Code:</span>
                        <span className="hash-value">{donation.hash_code}</span>
                      </div>
                    )}
                    {donation.status === 'available' && isAuthenticated && user?.can_receive ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleReserve(donation.id); }}
                        className="btn btn-primary btn-sm"
                      >
                        {t('donations.reserve')}
                      </button>
                    ) : donation.status === 'reserved' && isAuthenticated ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCancelReservation(donation.id); }}
                        className="btn btn-outline btn-sm"
                      >
                        {t('donations.cancel_reservation')}
                      </button>
                    ) : donation.status === 'reserved' && donation.donor_id === user?.id ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleComplete(donation.id); }}
                        className="btn btn-success btn-sm"
                      >
                        {t('donations.complete')}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                ← {t('common.previous') || 'Previous'}
              </button>
              <span className="page-info">
                {currentPage} / {totalPages}
              </span>
              <button 
                className="btn btn-outline btn-sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                {t('common.next') || 'Next'} →
              </button>
            </div>
          )}
        </>
      )}

      {selectedDonation && (
        <div className="modal-overlay" onClick={() => setSelectedDonation(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedDonation(null)}>✕</button>
            
            <div className="modal-header">
              <span className="modal-food-icon">{getFoodIcon(selectedDonation.food_type)}</span>
              <div>
                <span 
                  className="modal-status"
                  style={{ backgroundColor: getStatusColor(selectedDonation.status) }}
                >
                  {t(`donations.${selectedDonation.status}`)}
                </span>
                <h2>{selectedDonation.title}</h2>
              </div>
            </div>
            
            {selectedDonation.description && (
              <div className="modal-section">
                <h4>{t('donations.description')}</h4>
                <p>{selectedDonation.description}</p>
              </div>
            )}
            
            <div className="modal-grid">
              <div className="modal-info">
                <span className="info-label">{t('donations.quantity')}</span>
                <span className="info-value">{selectedDonation.quantity} {selectedDonation.unit}</span>
              </div>
              <div className="modal-info">
                <span className="info-label">{t('donations.food_type')}</span>
                <span className="info-value">{getFoodIcon(selectedDonation.food_type)} {t(`food_types.${selectedDonation.food_type}`)}</span>
              </div>
              {selectedDonation.donor_name && selectedDonation.donor_id !== user?.id && (
                <div className="modal-info">
                  <span className="info-label">{t('donations.donated_by')}</span>
                  <span className="info-value">{selectedDonation.donor_name}</span>
                </div>
              )}
              {selectedDonation.pickup_date && (
                <div className="modal-info">
                  <span className="info-label">{t('donations.pickup_date')}</span>
                  <span className="info-value">{new Date(selectedDonation.pickup_date).toLocaleString()}</span>
                </div>
              )}
              {selectedDonation.expiry_date && (
                <div className="modal-info">
                  <span className="info-label">{t('donations.expiry_date')}</span>
                  <span className="info-value">{new Date(selectedDonation.expiry_date).toLocaleString()}</span>
                </div>
              )}
            </div>
            
            <div className="modal-section">
              <h4>{t('donations.pickup_address')}</h4>
              <p className="modal-address">📍 {selectedDonation.pickup_address}</p>
            </div>

            {selectedDonation.hash_code && (selectedDonation.reserved_by === user?.id || selectedDonation.donor_id === user?.id) && (
              <div className="modal-section hash-section">
                <h4>{t('donations.hash_code')}</h4>
                <div className="hash-code">{selectedDonation.hash_code}</div>
                <p className="hash-hint">Share this code with the other party when you meet</p>
              </div>
            )}
            
            <div className="modal-actions">
              {selectedDonation.status === 'available' && isAuthenticated && user?.can_receive ? (
                <button onClick={() => { handleReserve(selectedDonation.id); setSelectedDonation(null); }} className="btn btn-primary">
                  {t('donations.reserve')}
                </button>
              ) : selectedDonation.status === 'reserved' && isAuthenticated && (selectedDonation.reserved_by === user?.id || selectedDonation.donor_id === user?.id) ? (
                <>
                  <button onClick={() => { handleCancelReservation(selectedDonation.id); setSelectedDonation(null); }} className="btn btn-outline">
                    {t('donations.cancel_reservation')}
                  </button>
                  {selectedDonation.donor_id === user?.id && (
                    <button onClick={() => { handleComplete(selectedDonation.id); setSelectedDonation(null); }} className="btn btn-success">
                      {t('donations.complete')}
                    </button>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
