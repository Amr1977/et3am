import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { fetchWithFailover } from '../services/api';

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
      <div className="settings-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1>{t('settings.title')}</h1>
        <p className="settings-subtitle">{t('settings.subtitle')}</p>

        <div className="settings-section">
          <h2>{t('settings.profile_info')}</h2>
          <div className="profile-summary">
            <div className="profile-avatar-large">👤</div>
            <div className="profile-details">
              <p><strong>{t('auth.name')}:</strong> {settings.name}</p>
              <p><strong>{t('auth.email')}:</strong> {settings.email}</p>
              <p><strong>Role:</strong> {settings.role}</p>
              <div className="profile-stats-row">
                <span>📦 {t('dashboard.total_donations')}: {settings.total_donations}</span>
                <span>🍽️ {t('profile.meals_received')}: {settings.total_received}</span>
                <span>⭐ {t('profile.reputation')}: {settings.reputation_score}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>{t('settings.notifications')}</h2>
          <div className="settings-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.sound_enabled}
                onChange={(e) => setSettings({ ...settings, sound_enabled: e.target.checked })}
              />
              <span className="toggle-text">{t('settings.sound_effects')}</span>
            </label>
            <p className="toggle-desc">{t('settings.sound_effects_desc')}</p>
          </div>

          <div className="settings-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={settings.notifications_enabled}
                onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
              />
              <span className="toggle-text">{t('settings.notifications_enabled')}</span>
            </label>
            <p className="toggle-desc">{t('settings.notifications_desc')}</p>
          </div>
        </div>

        <div className="settings-section">
          <h2>{t('settings.language')}</h2>
          <div className="language-options">
            <label className={`language-option ${settings.preferred_language === 'en' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="language"
                value="en"
                checked={settings.preferred_language === 'en'}
                onChange={() => setSettings({ ...settings, preferred_language: 'en' })}
              />
              <span>🇬🇧 English</span>
            </label>
            <label className={`language-option ${settings.preferred_language === 'ar' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="language"
                value="ar"
                checked={settings.preferred_language === 'ar'}
                onChange={() => setSettings({ ...settings, preferred_language: 'ar' })}
              />
              <span>🇸🇦 العربية</span>
            </label>
          </div>
        </div>

        {success && (
          <div className="settings-success">{t('settings.saved')}</div>
        )}

        <div className="settings-actions">
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            {saving ? t('common.loading') : t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
}