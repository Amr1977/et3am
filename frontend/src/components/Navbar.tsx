import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { useRTL } from '../hooks/useRTL';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout, updateLanguage, isAuthenticated } = useAuth();
  const { soundEnabled, setSoundEnabled } = useSound();
  const { isRTL } = useRTL();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved as 'light' | 'dark';
      return 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.background = theme === 'dark' ? '#0F1419' : '#FDFCF8';
    document.body.style.color = theme === 'dark' ? '#F1F5F9' : '#1A1A1A';
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLanguageSwitch = () => {
    const newLang = isRTL ? 'en' : 'ar';
    updateLanguage(newLang);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <button className="hamburger" onClick={toggleMobileMenu} aria-label="Menu">
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`}></span>
        </button>

        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <span className="brand-icon">🤲</span>
          <span className="brand-text">{t('app.name')}</span>
        </Link>

        <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMobileMenu}>{t('nav.home')}</Link>
          <Link to="/donations" className="nav-link" onClick={closeMobileMenu}>{t('nav.donations')}</Link>
          {isAuthenticated && (
            <>
              <Link to="/dashboard" className="nav-link" onClick={closeMobileMenu}>{t('nav.dashboard')}</Link>
              <Link to="/support" className="nav-link" onClick={closeMobileMenu}>{t('support.title')}</Link>
              <Link to="/settings" className="nav-link" onClick={closeMobileMenu}>⚙️ {t('nav.settings')}</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="nav-link admin-link" onClick={closeMobileMenu}>🔧 {t('admin.tabs.dashboard')}</Link>
              )}
              <div className="sidemenu-user-section">
                <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="nav-link logout-link">
                  🚪 {t('nav.logout')}
                </button>
              </div>
            </>
          )}
          {!isAuthenticated && (
            <div className="sidemenu-auth-section">
              <Link to="/login" className="nav-link" onClick={closeMobileMenu}>{t('nav.login')}</Link>
              <Link to="/register" className="nav-link btn btn-primary" onClick={closeMobileMenu}>{t('nav.register')}</Link>
            </div>
          )}
        </div>

        <div className="navbar-actions">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle" 
            title="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          <button onClick={handleLanguageSwitch} className="lang-switch-btn" title={t('language.switch')}>
            <span className="lang-icon">🌐</span>
            <span>{isRTL ? 'EN' : 'ع'}</span>
          </button>

          {isAuthenticated && (
            <button 
              onClick={toggleSound} 
              className={`sound-toggle ${soundEnabled ? 'active' : ''}`}
              title={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          )}

          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-avatar">👤</span>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">{t('nav.logout')}</button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-primary">{t('nav.register')}</Link>
            </div>
          )}
        </div>
      </div>
      
      {mobileMenuOpen && <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>}
    </nav>
  );
}
