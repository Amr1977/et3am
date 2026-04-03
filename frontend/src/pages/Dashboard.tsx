import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { fetchWithFailover } from '../services/api';

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
      const res = await fetchWithFailover('/api/users/stats', {
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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header-modern">
        <div className="welcome-section">
          <h1>🖐️ {t('dashboard.welcome')}, {user?.name}!</h1>
          <p>Here's your impact summary</p>
        </div>
      </div>

      <div className="stats-grid-modern">
        <div className="stat-card-modern primary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.totalDonations || 0}</div>
            <div className="stat-label">{t('dashboard.total_donations')}</div>
          </div>
        </div>
        <div className="stat-card-modern success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.availableDonations || 0}</div>
            <div className="stat-label">{t('dashboard.available')}</div>
          </div>
        </div>
        <div className="stat-card-modern warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.reservedDonations || 0}</div>
            <div className="stat-label">{t('dashboard.reserved')}</div>
          </div>
        </div>
        <div className="stat-card-modern info">
          <div className="stat-icon">🎉</div>
          <div className="stat-content">
            <div className="stat-number">{stats?.completedDonations || 0}</div>
            <div className="stat-label">{t('dashboard.completed')}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-actions-modern">
        {user?.can_donate && (
          <Link to="/donations?create=true" className="btn btn-primary-modern">
            + {t('donations.create_title')}
          </Link>
        )}
        <Link to="/donations" className="btn btn-outline-modern">
          📋 {t('nav.donations')}
        </Link>
      </div>

      <div className="dashboard-section-modern">
        <h2>📈 {t('dashboard.recent_activity')}</h2>
        <div className="activity-card-modern">
          <div className="activity-stat">
            <span className="activity-icon">🎁</span>
            <div className="activity-info">
              <div className="activity-number">
                {stats?.myDonations || 0}
              </div>
              <div className="activity-label">
                {user?.can_donate ? t('dashboard.my_donations') : t('dashboard.my_reservations')}
              </div>
            </div>
          </div>
          <div className="activity-verse">
            <p>﴿وَيُطْعِمُونَ الطَّعَامَ عَلَى حُبِّهِ﴾</p>
            <span>— Surah Al-Insan 76:8</span>
          </div>
        </div>
      </div>
    </div>
  );
}
