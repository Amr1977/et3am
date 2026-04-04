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

export default function MyReservations() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchMyReservations = async () => {
      if (!token) return;
      
      try {
        const res = await fetchWithFailover('/api/donations/my-reservations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.donations) {
          setDonations(data.donations);
        }
      } catch (err) {
        console.error('Failed to fetch my reservations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyReservations();
  }, [token]);

  const handleCancel = async (id: string) => {
    if (!token) return;
    try {
      await fetchWithFailover(`/api/donations/${id}/cancel-reservation`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await fetchWithFailover('/api/donations/my-reservations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDonations(data.donations || []);
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  const handleMarkReceived = async (id: string) => {
    if (!token) return;
    try {
      await fetchWithFailover(`/api/donations/${id}/mark-received`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await fetchWithFailover('/api/donations/my-reservations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDonations(data.donations || []);
    } catch (err) {
      console.error('Failed to mark received:', err);
    }
  };

  const filteredDonations = filter === 'all' 
    ? donations 
    : donations.filter(d => d.status === filter);

  if (loading) {
    return (
      <div className="my-reservations-page">
        <div className="loading-container">
          <div className="loading-dots">...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-reservations-page">
      <div className="page-header">
        <h1>{t('my_reservations.title')}</h1>
      </div>

      <div className="filter-tabs">
        {['all', 'reserved', 'received', 'completed'].map((status) => (
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
          <p>{t('my_reservations.empty')}</p>
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
              onCancelReservation={donation.status === 'reserved' ? () => handleCancel(donation.id) : undefined}
              onMarkReceived={donation.status === 'reserved' || donation.status === 'received' ? () => handleMarkReceived(donation.id) : undefined}
              onClick={() => navigate(`/donations/${donation.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}