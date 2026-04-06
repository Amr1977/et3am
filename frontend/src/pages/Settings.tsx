import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { fetchWithFailover } from '../services/api';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface UserSettings {
  name: string;
  email: string;
  role: string;
  can_donate: boolean;
  can_receive: boolean;
  reputation_score: number;
  total_donations: number;
  total_received: number;
  sound_enabled: boolean;
  notifications_enabled: boolean;
  avatar_url: string | null;
  preferred_language: string;
}

export default function Settings() {
  const { t } = useTranslation();
  const { user, token, isAuthenticated, updateLanguage } = useAuth();
  const { soundEnabled, setSoundEnabled } = useSound();
  const { isSupported: pushSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    fetchSettings();
  }, [isAuthenticated, token]);

  const fetchSettings = async () => {
    try {
      const res = await fetchWithFailover('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.user);
        setSoundEnabled(data.user.sound_enabled);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings || !token) return;
    setSaving(true);
    setSuccess(false);

    try {
      // Handle push notification subscription
      if (settings.notifications_enabled && pushSupported && !isSubscribed) {
        await subscribe();
      } else if (!settings.notifications_enabled && isSubscribed) {
        await unsubscribe();
      }

      const res = await fetchWithFailover('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sound_enabled: settings.sound_enabled,
          notifications_enabled: settings.notifications_enabled,
          preferred_language: settings.preferred_language,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        if (settings.preferred_language !== user?.preferred_language) {
          updateLanguage(settings.preferred_language);
        }
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  if (loading || !settings) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{t('settings.title')}</h1>
          <p className="page-subtitle">{t('settings.subtitle')}</p>
        </div>

        <div className="settings-grid">
          <div className="settings-card profile-card">
            <div className="card-header">
              <h2>{t('settings.profile_info')}</h2>
            </div>
            <div className="profile-content">
              <div className="profile-avatar">
                {settings.name?.charAt(0).toUpperCase() || '👤'}
              </div>
              <div className="profile-info">
                <h3>{settings.name}</h3>
                <p className="profile-email">{settings.email}</p>
                <span className="profile-role">{settings.role}</span>
              </div>
            </div>
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-icon">📦</span>
                <div className="stat-info">
                  <span className="stat-value">{settings.total_donations}</span>
                  <span className="stat-label">{t('dashboard.total_donations')}</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">🍽️</span>
                <div className="stat-info">
                  <span className="stat-value">{settings.total_received}</span>
                  <span className="stat-label">{t('profile.meals_received')}</span>
                </div>
              </div>
              <div className="stat-item">
                <span className="stat-icon">⭐</span>
                <div className="stat-info">
                  <span className="stat-value">{settings.reputation_score}</span>
                  <span className="stat-label">{t('profile.reputation')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <div className="card-header">
              <h2>{t('settings.notifications')}</h2>
            </div>
            <div className="card-body">
              <label className="toggle-option">
                <div className="toggle-info">
                  <span className="toggle-icon">🔔</span>
                  <div className="toggle-text">
                    <span className="toggle-title">{t('settings.notifications_enabled')}</span>
                    <span className="toggle-desc">{t('settings.notifications_desc')}</span>
                  </div>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications_enabled}
                    onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>

              <label className="toggle-option">
                <div className="toggle-info">
                  <span className="toggle-icon">🔊</span>
                  <div className="toggle-text">
                    <span className="toggle-title">{t('settings.sound_effects')}</span>
                    <span className="toggle-desc">{t('settings.sound_effects_desc')}</span>
                  </div>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.sound_enabled}
                    onChange={(e) => setSettings({ ...settings, sound_enabled: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>
          </div>

          <div className="settings-card">
            <div className="card-header">
              <h2>{t('settings.language')}</h2>
            </div>
            <div className="card-body">
              <div className="language-options">
                <label className={`language-card ${settings.preferred_language === 'en' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="language"
                    value="en"
                    checked={settings.preferred_language === 'en'}
                    onChange={() => setSettings({ ...settings, preferred_language: 'en' })}
                  />
                  <span className="language-flag">🇬🇧</span>
                  <span className="language-name">English</span>
                  <span className="language-check">✓</span>
                </label>
                <label className={`language-card ${settings.preferred_language === 'ar' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="language"
                    value="ar"
                    checked={settings.preferred_language === 'ar'}
                    onChange={() => setSettings({ ...settings, preferred_language: 'ar' })}
                  />
                  <span className="language-flag">🇸🇦</span>
                  <span className="language-name">العربية</span>
                  <span className="language-check">✓</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {success && (
          <div className="success-toast">
            <span>✓</span> {t('settings.saved')}
          </div>
        )}

        <div className="settings-footer">
          <button onClick={handleSave} className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? (
              <>
                <span className="btn-spinner"></span>
                {t('common.loading')}
              </>
            ) : (
              t('settings.save')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}