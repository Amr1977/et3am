import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { fetchWithFailover } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import DonationCard from '../components/DonationCard';

interface Donation {
  id: string;
  title: string;
  description?: string;
  food_type: string;
  quantity: number;
  unit: string;
  pickup_address: string;
  latitude: number | null;
  longitude: number | null;
  pickup_date: string;
  expiry_date: string;
  status: 'available' | 'reserved' | 'received' | 'completed' | 'expired';
  donor_id: string;
  donor_name?: string;
  reserved_by: string | null;
  reserved_by_name?: string;
  hash_code: string | null;
  created_at: string;
}

export default function MyDonations() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchMyDonations = async () => {
      if (!token) return;
      
      try {
        const res = await fetchWithFailover('/api/donations/my-donations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.donations) {
          setDonations(data.donations);
        }
      } catch (err) {
        console.error('Failed to fetch my donations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyDonations();
  }, [token]);

  const handleCancel = async (id: string) => {
    if (!token) return;
    try {
      await fetchWithFailover(`/api/donations/${id}/cancel-reservation`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh donations
      const res = await fetchWithFailover('/api/donations/my-donations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDonations(data.donations || []);
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  const handleComplete = async (id: string) => {
    if (!token) return;
    try {
      await fetchWithFailover(`/api/donations/${id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh donations
      const res = await fetchWithFailover('/api/donations/my-donations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDonations(data.donations || []);
    } catch (err) {
      console.error('Failed to complete:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token || !confirm(t('donations.confirm_delete') || 'Are you sure you want to delete this donation?')) return;
    try {
      await fetchWithFailover(`/api/donations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonations(donations.filter(d => d.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '', food_type: '', quantity: '', unit: '', pickup_address: '' });

  const openEditModal = (donation: Donation) => {
    setEditingDonation(donation);
    setEditFormData({
      title: donation.title,
      description: donation.description || '',
      food_type: donation.food_type,
      quantity: donation.quantity.toString(),
      unit: donation.unit,
      pickup_address: donation.pickup_address,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!token || !editingDonation) return;
    try {
      const res = await fetchWithFailover(`/api/donations/${editingDonation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        setDonations(donations.map(d => d.id === editingDonation.id ? { ...d, ...editFormData, quantity: parseInt(editFormData.quantity) } : d));
      }
    } catch (err) {
      console.error('Failed to edit:', err);
    } finally {
      setShowEditModal(false);
      setEditingDonation(null);
    }
  };

  const filteredDonations = filter === 'all' 
    ? donations 
    : donations.filter(d => d.status === filter);

  if (loading) {
    return (
      <div className="my-donations-page">
        <div className="loading-container">
          <div className="loading-dots">...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-donations-page">
      <div className="page-header">
        <h1>{t('my_donations.title')}</h1>
        <Link to="/donations?create=true" className="btn btn-primary">
          + {t('donations.create_title')}
        </Link>
      </div>

      <div className="filter-tabs">
        {['all', 'available', 'reserved', 'received', 'completed'].map((status) => (
          <button
            key={status}
            className={`filter-tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? t('common.all') : t(`donations.${status}`)}
            <span className="count">
              {status === 'all' 
                ? donations.length 
                : donations.filter(d => d.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {filteredDonations.length === 0 ? (
        <div className="empty-state">
          <p>{t('my_donations.empty')}</p>
          <Link to="/donations" className="btn btn-primary">
            {t('nav.donations')}
          </Link>
        </div>
      ) : (
        <div className="donations-grid">
          {filteredDonations.map((donation) => (
            <DonationCard
              key={donation.id}
              donation={donation}
              isOwner={donation.donor_id === user?.id}
              isReserver={donation.reserved_by === user?.id}
              t={t}
              onDelete={donation.status === 'available' ? () => handleDelete(donation.id) : undefined}
              onEdit={donation.status === 'available' ? () => openEditModal(donation) : undefined}
              onCancelReservation={donation.reserved_by ? () => handleCancel(donation.id) : undefined}
              onComplete={donation.status === 'reserved' || donation.status === 'received' ? () => handleComplete(donation.id) : undefined}
              onClick={() => navigate(`/donations/${donation.id}`)}
            />
          ))}
        </div>
      )}

      {showEditModal && editingDonation && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            <h3>{t('donations.edit_title')}</h3>
            <div className="form-group">
              <label>{t('donations.title')}</label>
              <input type="text" value={editFormData.title} onChange={(e) => setEditFormData({...editFormData, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label>{t('donations.description')}</label>
              <textarea value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} />
            </div>
            <div className="form-group">
              <label>{t('donations.food_type')}</label>
              <select value={editFormData.food_type} onChange={(e) => setEditFormData({...editFormData, food_type: e.target.value})}>
                <option value="meat">Meat</option>
                <option value="chicken">Chicken</option>
                <option value="fish">Fish</option>
                <option value="vegetables">Vegetables</option>
                <option value="fruits">Fruits</option>
                <option value="bread">Bread</option>
                <option value="rice">Rice</option>
                <option value="pasta">Pasta</option>
                <option value="soup">Soup</option>
                <option value="dessert">Dessert</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('donations.quantity')}</label>
              <input type="number" value={editFormData.quantity} onChange={(e) => setEditFormData({...editFormData, quantity: e.target.value})} />
            </div>
            <div className="form-group">
              <label>{t('donations.pickup_address')}</label>
              <input type="text" value={editFormData.pickup_address} onChange={(e) => setEditFormData({...editFormData, pickup_address: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowEditModal(false)} className="btn btn-outline">{t('common.cancel')}</button>
              <button onClick={handleSaveEdit} className="btn btn-primary">{t('donations.save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
