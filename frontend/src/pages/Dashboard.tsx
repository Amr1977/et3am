import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface Stats {
  totalDonations: number;
  availableDonations: number;
  reservedDonations: number;
  completedDonations: number;
  totalUsers: number;
  myDonations: number;
  myReservations: number;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/users/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-page">{t('common.loading')}</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>{t('dashboard.title')}</h1>
        <p className="welcome-text">{t('dashboard.welcome')}, {user?.name}!</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-number">{stats?.totalDonations || 0}</div>
          <div className="stat-label">{t('dashboard.total_donations')}</div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-number">{stats?.availableDonations || 0}</div>
          <div className="stat-label">{t('dashboard.available')}</div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-number">{stats?.reservedDonations || 0}</div>
          <div className="stat-label">{t('dashboard.reserved')}</div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-number">{stats?.completedDonations || 0}</div>
          <div className="stat-label">{t('dashboard.completed')}</div>
        </div>
      </div>

      <div className="dashboard-actions">
        {user?.role === 'donor' && (
          <Link to="/donations?create=true" className="btn btn-primary btn-lg">
            + {t('donations.create_title')}
          </Link>
        )}
        <Link to="/donations" className="btn btn-outline btn-lg">
          {t('nav.donations')}
        </Link>
      </div>

      <div className="dashboard-section">
        <h2>{t('dashboard.recent_activity')}</h2>
        <div className="activity-placeholder">
          <p>{user?.role === 'donor' ? t('dashboard.my_donations') : t('dashboard.my_reservations')}: {user?.role === 'donor' ? stats?.myDonations : stats?.myReservations}</p>
        </div>
      </div>
    </div>
  );
}
