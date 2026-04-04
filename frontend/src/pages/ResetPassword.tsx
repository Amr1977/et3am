import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchWithFailover } from '../services/api';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwords_not_match'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.weak_password'));
      return;
    }

    setLoading(true);

    try {
      const res = await fetchWithFailover('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        const data = await res.json();
        setError(data.message || t('auth.reset_failed'));
      }
    } catch (err) {
      setError(t('auth.reset_failed'));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card-modern">
            <div className="auth-header-modern">
              <div className="auth-icon">❌</div>
              <h1>{t('auth.invalid_reset_token')}</h1>
              <p>{t('auth.invalid_reset_token_desc')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card-modern">
            <div className="auth-header-modern">
              <div className="auth-icon">✅</div>
              <h1>{t('auth.password_reset_success')}</h1>
              <p>{t('auth.password_reset_success_desc')}</p>
            </div>
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
            <h1>{t('auth.set_new_password')}</h1>
            <p>{t('auth.set_new_password_desc')}</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form-modern">
            <div className="form-group-modern">
              <label htmlFor="password">{t('auth.new_password')}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input-modern"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <div className="form-group-modern">
              <label htmlFor="confirmPassword">{t('auth.confirm_password')}</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="form-input-modern"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
              {loading ? t('common.loading') : t('auth.reset_password')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}