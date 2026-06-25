import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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
    document.title = 'ادعم إطعام | Et3am';
  }, []);

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

  return (
    <div className="support-page">
      <Link to="/" className="support-back-link">← {t('common.back')}</Link>

      <section className="support-dev-section">
        <div className="support-dev-container">
          <p className="support-dev-note">
            هذه المنصة مفتوحة المصدر ومجانية تماماً. مساهماتك تساعد في استمرار التطوير.
          </p>

          <div className="support-dev-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          <h2 className="support-dev-title">{t('home.support_dev_title')}</h2>
          <p className="support-dev-desc">
            {t('home.support_dev_desc')}
          </p>

          <div className="support-phone-group">
            <div className="support-phone-section">
              <span className="support-phone-label">{t('home.support_phone')}</span>
              <div className="support-phone-display">
                <span className="support-phone-number">01094450141</span>
                <button className="copy-btn" onClick={() => navigator.clipboard.writeText('01094450141')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                  </svg>
                  <span>{t('home.support_copy')}</span>
                </button>
              </div>
            </div>

            <div className="support-methods-list">
              <div className="support-method-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="5" width="18" height="14" rx="2"/>
                  <path d="M3 10h18"/>
                </svg>
                <span>Instapay</span>
              </div>
              <div className="support-method-badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                </svg>
                <span>Vodafone Cash</span>
              </div>
            </div>
          </div>

          <div className="support-crypto-section">
            <span className="support-crypto-label">{t('home.support_crypto')}</span>
            <div className="support-crypto-display">
              <span className="support-crypto-number">TACcgwLC4GeKzKGLWz14tiVahnpftHre1H</span>
              <button className="copy-btn" onClick={() => navigator.clipboard.writeText('TACcgwLC4GeKzKGLWz14tiVahnpftHre1H')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                <span>{t('home.support_copy')}</span>
              </button>
            </div>
            <span className="support-crypto-network">{t('home.support_crypto_network')}</span>
          </div>

          <p className="support-dev-thanks">{t('home.support_thanks')}</p>
        </div>
      </section>

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

      {loading ? (
        <div className="support-loading">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
