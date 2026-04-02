import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useRTL } from '../hooks/useRTL';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout, updateLanguage, isAuthenticated } = useAuth();
  const { isRTL } = useRTL();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLanguageSwitch = () => {
    const newLang = isRTL ? 'en' : 'ar';
    updateLanguage(newLang);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🍽️</span>
          <span className="brand-text">{t('app.name')}</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className="nav-link">{t('nav.home')}</Link>
          <Link to="/donations" className="nav-link">{t('nav.donations')}</Link>
          {isAuthenticated && (
            <Link to="/dashboard" className="nav-link">{t('nav.dashboard')}</Link>
          )}
        </div>

        <div className="navbar-actions">
          <button onClick={handleLanguageSwitch} className="lang-switch-btn" title={t('language.switch')}>
            <span className="lang-icon">🌐</span>
            <span>{isRTL ? 'EN' : 'عر'}</span>
          </button>

          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-name">{user?.name}</span>
              <button onClick={handleLogout} className="btn btn-outline">{t('nav.logout')}</button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-primary">{t('nav.register')}</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
