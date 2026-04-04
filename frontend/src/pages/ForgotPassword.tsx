import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { fetchWithFailover } from '../services/api';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetchWithFailover('/api/auth/reset-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card-modern">
            <div className="auth-header-modern">
              <div className="auth-icon">📧</div>
              <h1>{t('auth.reset_email_sent')}</h1>
              <p>{t('auth.reset_email_sent_desc')}</p>
            </div>
            <Link to="/login" className="btn btn-primary btn-lg btn-full">
              {t('auth.back_to_login')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card-modern">
          <div className="auth-header-modern">
            <div className="auth-icon">🔐</div>
            <h1>{t('auth.forgot_password')}</h1>
            <p>{t('auth.forgot_password_desc')}</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form-modern">
            <div className="form-group-modern">
              <label htmlFor="email">{t('auth.email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input-modern"
                placeholder="email@example.com"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? t('common.loading') : t('auth.send_reset_link')}
            </button>
          </form>

          <div className="auth-footer-modern">
            <span>{t('auth.remember_password')}</span>
            <Link to="/login" className="auth-link">{t('auth.login')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}