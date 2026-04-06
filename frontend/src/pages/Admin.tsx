import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { fetchWithFailover } from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  can_donate: boolean;
  can_receive: boolean;
  reputation_score: number;
  total_donations: number;
  total_received: number;
  created_at: string;
}

interface Ticket {
  id: string;
  user_id: string;
  user_name?: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigned_to?: string;
  created_at: string;
}

interface Donation {
  id: string;
  title: string;
  donor_id: string;
  donor_name?: string;
  food_type: string;
  quantity: number;
  unit: string;
  status: string;
  pickup_address: string;
  created_at: string;
}

interface Report {
  id: string;
  reporter_name?: string;
  donation_title?: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

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
  const { onAdminNotification } = useSocket();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      setLoading(false);
      return;
    }
    fetchStats();

    const unsub = onAdminNotification((data: any) => {
      console.log('[Admin] Notification received:', data);
      fetchStats();
    });

    return () => {
      unsub();
    };
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

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetchWithFailover(`/api/admin/users?search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchDonations = async () => {
    setDonationsLoading(true);
    try {
      const res = await fetchWithFailover('/api/admin/donations?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDonations(data.donations || []);
      }
    } catch (err) {
      console.error('Failed to fetch donations:', err);
    } finally {
      setDonationsLoading(false);
    }
  };

  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const res = await fetchWithFailover('/api/admin/tickets?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await fetchWithFailover('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'users' && users.length === 0) fetchUsers();
    if (tabId === 'donations' && donations.length === 0) fetchDonations();
    if (tabId === 'tickets' && tickets.length === 0) fetchTickets();
    if (tabId === 'reports' && reports.length === 0) fetchReports();
  };

  const handleUserRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetchWithFailover(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleTicketUpdate = async (ticketId: string, updates: { status?: string; priority?: string }) => {
    try {
      const res = await fetchWithFailover(`/api/admin/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });
      if (res.ok) fetchTickets();
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  const handleReportResolve = async (reportId: string) => {
    try {
      const res = await fetchWithFailover(`/api/admin/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchReports();
    } catch (err) {
      console.error('Failed to resolve report:', err);
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
    { id: 'reports', label: t('admin.tabs.reports') || 'Reports', icon: '🚩' },
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
              onClick={() => handleTabChange(tab.id)}
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

        {activeTab === 'users' && (
          <div className="admin-users">
            <div className="admin-section-header">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="search-input"
              />
              <button onClick={fetchUsers} className="btn btn-primary">Search</button>
            </div>
            {usersLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Donor</th>
                      <th>Receiver</th>
                      <th>Reputation</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <select value={user.role} onChange={(e) => handleUserRoleChange(user.id, e.target.value)}>
                            <option value="user">User</option>
                            <option value="donor">Donor</option>
                            <option value="recipient">Receiver</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>{user.can_donate ? '✓' : '✗'}</td>
                        <td>{user.can_receive ? '✓' : '✗'}</td>
                        <td>{user.reputation_score || '-'}</td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'donations' && (
          <div className="admin-donations">
            {donationsLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Food Type</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Address</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map(d => (
                      <tr key={d.id}>
                        <td>{d.title}</td>
                        <td>{d.food_type}</td>
                        <td>{d.quantity} {d.unit}</td>
                        <td><span className={`status-badge ${d.status}`}>{d.status}</span></td>
                        <td>{d.pickup_address}</td>
                        <td>{new Date(d.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="admin-tickets">
            {ticketsLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(t => (
                      <tr key={t.id}>
                        <td>{t.user_name || t.user_id}</td>
                        <td>{t.type}</td>
                        <td>{t.title}</td>
                        <td>
                          <select value={t.status} onChange={(e) => handleTicketUpdate(t.id, { status: e.target.value })}>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </td>
                        <td>
                          <select value={t.priority} onChange={(e) => handleTicketUpdate(t.id, { priority: e.target.value })}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </td>
                        <td>{new Date(t.created_at).toLocaleDateString()}</td>
                        <td>
                          <button onClick={() => handleTicketUpdate(t.id, { status: 'resolved' })} className="btn btn-sm">Resolve</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="admin-reports">
            {reportsLoading ? (
              <div className="loading-spinner"></div>
            ) : reports.length === 0 ? (
              <p className="empty-state">No reports yet</p>
            ) : (
              <div className="admin-table">
                <table>
                  <thead>
                    <tr>
                      <th>Reporter</th>
                      <th>Donation</th>
                      <th>Reason</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(r => (
                      <tr key={r.id}>
                        <td>{r.reporter_name || '-'}</td>
                        <td>{r.donation_title || '-'}</td>
                        <td>{r.reason}</td>
                        <td>{r.description || '-'}</td>
                        <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td>
                          {r.status === 'pending' && (
                            <button onClick={() => handleReportResolve(r.id)} className="btn btn-sm btn-success">Resolve</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}