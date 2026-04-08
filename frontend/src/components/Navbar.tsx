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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const touchStartRef = useRef<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved as 'light' | 'dark';
      return 'dark';
    }
    return 'dark';
  });

  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.background = theme === 'dark' ? '#0F1419' : '#FDFCF8';
    document.body.style.color = theme === 'dark' ? '#F1F5F9' : '#1A1A1A';
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
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
    setUserMenuOpen(false);
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
          onClick={toggleMobileMenu}
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

        <div 
          className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}
          onTouchStart={(e) => {
            touchStartRef.current = e.touches[0].clientX;
          }}
          onTouchMove={(e) => {
            if (touchStartRef.current === null) return;
            const currentX = e.touches[0].clientX;
            const delta = isRTL ? touchStartRef.current - currentX : currentX - touchStartRef.current;
            setTouchDelta(delta);
          }}
          onTouchEnd={() => {
            if (touchStartRef.current === null) return;
            if (isRTL ? touchDelta > 75 : touchDelta > 75) {
              setMobileMenuOpen(false);
            }
            touchStartRef.current = null;
            setTouchDelta(0);
          }}
        >
          {isAuthenticated && mobileMenuOpen && (
            <div className="mobile-user-section">
              <div className="mobile-user-avatar">
                {user?.name?.charAt(0).toUpperCase() || '👤'}
              </div>
              <div className="mobile-user-info">
                <div className="mobile-user-name">{user?.name}</div>
                <div className="mobile-user-email">{user?.email}</div>
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
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                )
              ))}
            </div>
          )}

          <div className="nav-footer">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="nav-item logout">
                <span className="nav-icon">🚪</span>
                <span className="nav-label">{t('nav.logout')}</span>
              </button>
            ) : (
              <div className="nav-auth-buttons">
                <button 
                  onClick={() => { handleLanguageSwitch(); setMobileMenuOpen(false); }}
                  className="btn btn-ghost lang-switch"
                  title={isRTL ? 'Switch to English' : 'التبديل للعربية'}
                >
                  {isRTL ? 'EN' : 'عربي'}
                </button>
                <Link to="/login" className="btn btn-ghost">{t('nav.login')}</Link>
                <Link to="/register" className="btn btn-primary">{t('nav.register')}</Link>
              </div>
            )}
          </div>
        </div>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="user-menu-container" ref={userMenuRef}>
              <button 
                className="user-avatar-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
              >
                <div className="avatar">
                  {user?.name?.charAt(0).toUpperCase() || '👤'}
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`chevron ${userMenuOpen ? 'open' : ''}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              
              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <div className="user-avatar-lg">
                      {user?.name?.charAt(0).toUpperCase() || '👤'}
                    </div>
                    <div className="user-details">
                      <span className="user-name">{user?.name}</span>
                      <span className="user-email">{user?.email}</span>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/settings" className="dropdown-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span>{t('nav.settings')}</span>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item admin">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      <span>{t('admin.tabs.dashboard')}</span>
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <button 
                onClick={handleLanguageSwitch}
                className="btn btn-ghost lang-switch"
                title={isRTL ? 'Switch to English' : 'التبديل للعربية'}
              >
                {isRTL ? 'EN' : 'عربي'}
              </button>
              <Link to="/login" className="btn btn-ghost">{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-primary">{t('nav.register')}</Link>
            </div>
          )}
        </div>
      </div>

      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}
    </nav>
  );
}