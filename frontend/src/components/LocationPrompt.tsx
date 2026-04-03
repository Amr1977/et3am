import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

interface LocationPromptProps {
  onComplete?: () => void;
}

export default function LocationPrompt({ onComplete }: LocationPromptProps) {
  const { t } = useTranslation();
  const { user, updateLocation } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const askedBefore = localStorage.getItem('locationPromptDismissed');
    const hasLocation = user?.latitude && user?.longitude;
    
    if (!hasLocation && !askedBefore && user) {
      setShowPrompt(true);
    }
  }, [user]);

  const handleEnableLocation = async () => {
    if (!navigator.geolocation) {
      alert(t('donations.geolocation_not_supported') || 'Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          await updateLocation(latitude, longitude);
          setShowPrompt(false);
          localStorage.setItem('locationPromptDismissed', 'true');
          onComplete?.();
        } catch (error) {
          console.error('Failed to update location:', error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setDismissed(true);
          localStorage.setItem('locationPromptDismissed', 'true');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('locationPromptDismissed', 'true');
  };

  if (!showPrompt || dismissed || user?.latitude) {
    return null;
  }

  return (
    <div className="location-prompt-overlay">
      <div className="location-prompt-card">
        <div className="location-prompt-icon">📍</div>
        <h2>{t('donations.location_permission_title')}</h2>
        <p>{t('donations.location_permission_desc')}</p>
        
        <div className="location-prompt-buttons">
          <button 
            className="btn btn-primary" 
            onClick={handleEnableLocation}
            disabled={loading}
          >
            {loading ? '...' : t('donations.enable_location')}
          </button>
          <button 
            className="btn btn-ghost" 
            onClick={handleDismiss}
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
