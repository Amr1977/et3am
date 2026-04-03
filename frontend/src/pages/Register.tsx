import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const { t } = useTranslation();
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'donor',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card-modern">
          <div className="auth-header-modern">
            <div className="auth-icon">🤲</div>
            <h1>{t('auth.register_title')}</h1>
            <p>{t('auth.register_subtitle')}</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="button" onClick={handleGoogleSignup} className="btn btn-google-modern btn-full" disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {t('auth.signup_with_google')}
          </button>

          <div className="auth-divider-modern">
            <span>{t('auth.or')}</span>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-modern">
            <div className="form-group-modern">
              <label htmlFor="name">{t('auth.name')}</label>
              <input 
                id="name" 
                name="name" 
                type="text" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                className="form-input-modern" 
                placeholder="Your full name"
              />
            </div>

            <div className="form-group-modern">
              <label htmlFor="email">{t('auth.email')}</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                className="form-input-modern" 
                placeholder="email@example.com"
              />
            </div>

            <div className="form-row-modern">
              <div className="form-group-modern">
                <label htmlFor="password">{t('auth.password')}</label>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required 
                  minLength={6}
                  className="form-input-modern" 
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group-modern">
                <label htmlFor="confirmPassword">{t('auth.confirm_password')}</label>
                <input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type="password" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  required 
                  minLength={6}
                  className="form-input-modern" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="form-group-modern">
              <label htmlFor="role">{t('auth.role')}</label>
              <div className="role-selector-modern">
                <button
                  type="button"
                  className={`role-option-modern ${formData.role === 'donor' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, role: 'donor' })}
                >
                  <span className="role-icon">🤝</span>
                  <span className="role-label">{t('auth.donor')}</span>
                  <span className="role-desc">Share surplus food</span>
                </button>
                <button
                  type="button"
                  className={`role-option-modern ${formData.role === 'recipient' ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, role: 'recipient' })}
                >
                  <span className="role-icon">🍽️</span>
                  <span className="role-label">{t('auth.recipient')}</span>
                  <span className="role-desc">Receive food donations</span>
                </button>
              </div>
            </div>

            <div className="form-row-modern">
              <div className="form-group-modern">
                <label htmlFor="phone">{t('auth.phone')}</label>
                <input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  className="form-input-modern" 
                  placeholder="+20..."
                />
              </div>
              <div className="form-group-modern">
                <label htmlFor="address">{t('auth.address')}</label>
                <input 
                  id="address" 
                  name="address" 
                  type="text" 
                  value={formData.address} 
                  onChange={handleChange} 
                  className="form-input-modern" 
                  placeholder="Your area"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary-modern btn-full" disabled={loading}>
              {loading ? (
                <span className="loading-dots">...</span>
              ) : (
                <>✨ {t('auth.register_button')}</>
              )}
            </button>
          </form>

          <p className="auth-switch-modern">
            {t('auth.has_account')}{' '}
            <Link to="/login">{t('auth.sign_in')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
