import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { useRTL } from '../hooks/useRTL';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import gitInfo from '../git-info.json';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
}

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout, updateLanguage, isAuthenticated } = useAuth();
  const { soundEnabled, setSoundEnabled } = useSound();
  const { isRTL } = useRTL();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const touchStartRef = useRef<number | null>(null);
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (mobileMenuOpen) return;
      const touchX = e.touches[0].clientX;
      if ((!isRTL && touchX < 20) || (isRTL && touchX > window.innerWidth - 20)) {
        touchStartRef.current = e.touches[0].clientX;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartRef.current === null) return;
      const currentX = e.touches[0].clientX;
      const delta = isRTL ? touchStartRef.current - currentX : currentX - touchStartRef.current;
      if (delta > 50 && !mobileMenuOpen) {
        setMobileMenuOpen(true);
        touchStartRef.current = null;
      }
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [mobileMenuOpen, isRTL]);

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

  const navItems: NavItem[] = [
    { label: t('nav.home'), path: '/', icon: '🏠' },
    { label: t('nav.donations'), path: '/donations', icon: '🎁' },
    { label: t('nav.dashboard'), path: '/dashboard', icon: '📊', requiresAuth: true },
    { label: t('my_donations.title'), path: '/my-donations', icon: '🤝', requiresAuth: true },
    { label: t('my_reservations.title'), path: '/my-reservations', icon: '📋', requiresAuth: true },
    { label: t('support.title'), path: '/support', icon: '💬', requiresAuth: true },
    { label: t('nav.profile'), path: '/profile', icon: '👤', requiresAuth: true },
    { label: t('nav.settings'), path: '/settings', icon: '⚙️', requiresAuth: true },
    { label: t('admin.tabs.dashboard'), path: '/admin', icon: '🔧', requiresAuth: true, requiresAdmin: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div 
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />
      <div className="navbar-container">
        <button 
          className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <Link to="/" className="navbar-brand">
          <div className="brand-content">
            <span className="brand-text">إطعام</span>
            <span className="brand-version">v{gitInfo.version}</span>
          </div>
        </Link>

        <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          {isAuthenticated && (
            <div className="user-section">
              <div className="user-avatar">
                {user?.name?.charAt(0).toUpperCase() || '👤'}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.name}</div>
                <div className="user-email">{user?.email}</div>
              </div>
            </div>
          )}

          <div className="nav-section">
            <span className="nav-section-title">{t('nav.home')}</span>
            {navItems.slice(0, 2).map(item => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            ))}
          </div>

          {isAuthenticated && (
            <div className="nav-section">
              <span className="nav-section-title">{t('nav.dashboard')}</span>
              {navItems.slice(2, 9).map(item => (
                (!item.requiresAdmin || user?.role === 'admin') && (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                )
              ))}
            </div>
          )}

          <div className="nav-footer">
            <div className="nav-actions">
              <button onClick={handleLanguageSwitch} className="nav-item" title={isRTL ? 'Switch to English' : 'التبديل للعربية'}>
                <span className="nav-icon">{isRTL ? '🇪🇬' : '🇸🇦'}</span>
                <span className="nav-label">{isRTL ? 'English' : 'العربية'}</span>
              </button>
              <button onClick={toggleTheme} className="nav-item" title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
                <span className="nav-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
                <span className="nav-label">{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </button>
            </div>

            {isAuthenticated ? (
              <button onClick={handleLogout} className="nav-item logout">
                <span className="nav-icon">🚪</span>
                <span className="nav-label">{t('nav.logout')}</span>
              </button>
            ) : (
              <div className="nav-auth-buttons">
                <Link to="/login" className="btn btn-ghost">{t('nav.login')}</Link>
                <Link to="/register" className="btn btn-primary">{t('nav.register')}</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}
    </nav>
  );
}