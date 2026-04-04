import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { fetchWithFailover } from '../services/api';

interface Ticket {
  id: string;
  type: 'bug' | 'feature' | 'support';
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export default function Support() {
  const { t } = useTranslation();
  const { user, token, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ type: 'support', title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    fetchTickets();
  }, [isAuthenticated, token]);

  const fetchTickets = async () => {
    try {
      const res = await fetchWithFailover('/api/support', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const res = await fetchWithFailover('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setShowCreateForm(false);
        setFormData({ type: 'support', title: '', description: '' });
        fetchTickets();
      } else {
        const data = await res.json();
        setSubmitError(data.messageKey || 'Failed to create ticket');
      }
    } catch (err) {
      setSubmitError('Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'var(--warning)';
      case 'in_progress': return 'var(--primary)';
      case 'resolved': return 'var(--success)';
      case 'closed': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'var(--danger)';
      case 'medium': return 'var(--warning)';
      case 'low': return 'var(--success)';
      default: return 'var(--text-muted)';
    }
  };

  if (loading) {
    return (
      <div className="support-loading">
        <div className="loading-spinner"></div>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="support-page">
      <div className="support-header">
        <div>
          <h1>{t('support.title')}</h1>
          <p className="support-subtitle">{t('support.subtitle')}</p>
        </div>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn btn-primary">
          {showCreateForm ? '✕ ' + t('support.cancel') : '+ ' + t('support.create')}
        </button>
      </div>

      {showCreateForm && (
        <div className="support-form-container">
          <form onSubmit={handleSubmit} className="support-form">
            <h3>{t('support.create_ticket')}</h3>
            
            {submitSuccess && (
              <div className="form-success" style={{ color: 'var(--success)', marginBottom: '1rem' }}>
                {t('support.ticket_created')}
              </div>
            )}
            
            {submitError && (
              <div className="form-error" style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
                {submitError}
              </div>
            )}

            <div className="form-group">
              <label>{t('support.type')}</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-input"
                required
              >
                <option value="support">{t('support.types.support')}</option>
                <option value="bug">{t('support.types.bug')}</option>
                <option value="feature">{t('support.types.feature')}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t('support.title_label')}</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="form-input"
                placeholder={t('support.title_placeholder')}
                required
              />
            </div>

            <div className="form-group">
              <label>{t('support.description')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-input"
                rows={4}
                placeholder={t('support.description_placeholder')}
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn btn-outline">
                {t('support.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? t('common.loading') : t('support.submit')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tickets-list">
        {tickets.length === 0 ? (
          <div className="empty-state-container">
            <span className="empty-state-icon">🎫</span>
            <h3>{t('support.no_tickets')}</h3>
            <p>{t('support.no_tickets_desc')}</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-header">
                <span className={`ticket-type ticket-type-${ticket.type}`}>
                  {t(`support.types.${ticket.type}`)}
                </span>
                <span className="ticket-status" style={{ backgroundColor: getStatusColor(ticket.status) }}>
                  {t(`support.statuses.${ticket.status}`)}
                </span>
                <span className="ticket-priority" style={{ color: getPriorityColor(ticket.priority) }}>
                  {t(`support.priorities.${ticket.priority}`)}
                </span>
              </div>
              <h3 className="ticket-title">{ticket.title}</h3>
              <p className="ticket-description">{ticket.description}</p>
              <div className="ticket-footer">
                <span className="ticket-date">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}