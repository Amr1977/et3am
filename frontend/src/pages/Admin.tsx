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
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
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

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
      </div>

      <div className="admin-tabs">
        {['dashboard', 'users', 'donations', 'tickets'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`admin-tab ${activeTab === tab ? 'active' : ''}`}
          >
            {t(`admin.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && stats && (
        <div className="admin-dashboard">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">👥</span>
              <div className="stat-content">
                <span className="stat-value">{stats.users.total}</span>
                <span className="stat-label">Total Users</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📦</span>
              <div className="stat-content">
                <span className="stat-value">{stats.donations.total}</span>
                <span className="stat-label">Total Donations</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <div className="stat-content">
                <span className="stat-value">{stats.donations.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⏳</span>
              <div className="stat-content">
                <span className="stat-value">{stats.donations.activeReservations}</span>
                <span className="stat-label">Active Reservations</span>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Donations Over Time</h3>
              <div className="chart-container">
                <Line data={dailyDonationsData} options={chartOptions} />
              </div>
            </div>

            <div className="chart-card">
              <h3>Status Distribution</h3>
              <div className="chart-container">
                <Doughnut data={statusDistributionData} options={{ ...chartOptions, plugins: { legend: { display: true, position: 'bottom' } } }} />
              </div>
            </div>

            <div className="chart-card">
              <h3>Top Areas</h3>
              <div className="chart-container">
                <Bar data={topAreasData} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <h4>User Growth (30 days)</h4>
              <span className="metric-value">+{stats.users.newLast30Days}</span>
            </div>
            <div className="metric-card">
              <h4>New Donations (7 days)</h4>
              <span className="metric-value">+{stats.donations.newLast7Days}</span>
            </div>
            <div className="metric-card">
              <h4>Completions (7 days)</h4>
              <span className="metric-value">+{stats.donations.completedLast7Days}</span>
            </div>
            <div className="metric-card">
              <h4>Active Donors</h4>
              <span className="metric-value">{stats.users.donors}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}