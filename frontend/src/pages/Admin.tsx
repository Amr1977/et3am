import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { fetchWithFailover } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

interface Stats {
  users: {
    total: number;
    newLast30Days: number;
    admins: number;
    donors: number;
    receivers: number;
  };
  donations: {
    total: number;
    available: number;
    reserved: number;
    completed: number;
    expired: number;
    newLast7Days: number;
    newLast30Days: number;
    completedLast7Days: number;
    activeReservations: number;
  };
  charts: {
    dailyDonations: { date: string; count: number }[];
    topAreas: { area: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
  };
}

export default function Admin() {
  const { t } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      setLoading(false);
      return;
    }
    fetchStats();
  }, [isAuthenticated, user]);

  const fetchStats = async () => {
    try {
      const res = await fetchWithFailover('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="admin-page">
        <div className="admin-access-denied">
          <div className="denied-icon">🚫</div>
          <h2>Access Denied</h2>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="page-loading">
          <div className="loading-spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const dailyDonationsData = {
    labels: stats?.charts.dailyDonations.map(d => d.date) || [],
    datasets: [{
      label: 'Daily Donations',
      data: stats?.charts.dailyDonations.map(d => d.count) || [],
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
    }],
  };

  const statusDistributionData = {
    labels: stats?.charts.statusDistribution.map(s => s.status) || [],
    datasets: [{
      data: stats?.charts.statusDistribution.map(s => s.count) || [],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(107, 114, 128, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderWidth: 0,
    }],
  };

  const topAreasData = {
    labels: stats?.charts.topAreas.map(a => a.area) || [],
    datasets: [{
      label: 'Users',
      data: stats?.charts.topAreas.map(a => a.count) || [],
      backgroundColor: 'rgba(99, 102, 241, 0.8)',
      borderRadius: 4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  const tabs = [
    { id: 'dashboard', label: t('admin.tabs.dashboard'), icon: '📊' },
    { id: 'users', label: t('admin.tabs.users'), icon: '👥' },
    { id: 'donations', label: t('admin.tabs.donations'), icon: '🎁' },
    { id: 'tickets', label: t('admin.tabs.tickets'), icon: '🎫' },
  ];

  return (
    <div className="admin-page">
      <div className="page-container">
        <div className="admin-header-modern">
          <div className="admin-title-section">
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Manage your platform</p>
          </div>
          <div className="admin-actions">
            <button className="btn btn-outline">
              <span>📥</span> Export
            </button>
          </div>
        </div>

        <div className="admin-tabs-modern">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-modern ${activeTab === tab.id ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && stats && (
          <div className="admin-dashboard">
            <div className="stats-grid-modern">
              <div className="stat-card-modern">
                <div className="stat-icon-wrap blue">
                  <span>👥</span>
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats.users.total}</span>
                  <span className="stat-label">Total Users</span>
                </div>
                <span className="stat-badge positive">+{stats.users.newLast30Days} this month</span>
              </div>
              <div className="stat-card-modern">
                <div className="stat-icon-wrap green">
                  <span>🎁</span>
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats.donations.total}</span>
                  <span className="stat-label">Total Donations</span>
                </div>
                <span className="stat-badge positive">+{stats.donations.newLast7Days} this week</span>
              </div>
              <div className="stat-card-modern">
                <div className="stat-icon-wrap purple">
                  <span>✅</span>
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats.donations.completed}</span>
                  <span className="stat-label">Completed</span>
                </div>
                <span className="stat-badge">{stats.donations.completedLast7Days} this week</span>
              </div>
              <div className="stat-card-modern">
                <div className="stat-icon-wrap orange">
                  <span>⏳</span>
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats.donations.activeReservations}</span>
                  <span className="stat-label">Active Reservations</span>
                </div>
              </div>
            </div>

            <div className="charts-grid-modern">
              <div className="chart-card-modern">
                <h3>📈 Donations Over Time</h3>
                <div className="chart-container">
                  <Line data={dailyDonationsData} options={chartOptions} />
                </div>
              </div>

              <div className="chart-card-modern">
                <h3>🍩 Status Distribution</h3>
                <div className="chart-container doughnut">
                  <Doughnut data={statusDistributionData} options={{ ...chartOptions, plugins: { legend: { display: true, position: 'bottom' } } }} />
                </div>
              </div>

              <div className="chart-card-modern">
                <h3>🏛️ Top Areas</h3>
                <div className="chart-container">
                  <Bar data={topAreasData} options={chartOptions} />
                </div>
              </div>
            </div>

            <div className="metrics-grid-modern">
              <div className="metric-card-modern">
                <div className="metric-icon">📈</div>
                <div className="metric-content">
                  <span className="metric-label">User Growth (30 days)</span>
                  <span className="metric-value">+{stats.users.newLast30Days}</span>
                </div>
              </div>
              <div className="metric-card-modern">
                <div className="metric-icon">📦</div>
                <div className="metric-content">
                  <span className="metric-label">New Donations (7 days)</span>
                  <span className="metric-value">+{stats.donations.newLast7Days}</span>
                </div>
              </div>
              <div className="metric-card-modern">
                <div className="metric-icon">✨</div>
                <div className="metric-content">
                  <span className="metric-label">Completions (7 days)</span>
                  <span className="metric-value">+{stats.donations.completedLast7Days}</span>
                </div>
              </div>
              <div className="metric-card-modern">
                <div className="metric-icon">🤝</div>
                <div className="metric-content">
                  <span className="metric-label">Active Donors</span>
                  <span className="metric-value">{stats.users.donors}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}