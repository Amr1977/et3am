import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

interface LocationPromptProps {
  onComplete?: () => void;
}

export default function LocationPrompt({ onComplete }: LocationPromptProps) {
  const { t } = useTranslation();
  const { user, updateLocation } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    const askedBefore = localStorage.getItem('locationPromptDismissed');
    const hasLocation = user?.latitude && user?.longitude;
    
    if (!hasLocation && !askedBefore && user) {
      setShowPrompt(true);
    }
  }, [user]);

  const handleEnableLocation = () => {
    if (!navigator.geolocation) {
      alert(t('donations.geolocation_not_supported') || 'Geolocation is not supported by your browser');
      return;
    }

    setShowPrompt(false);
    localStorage.setItem('locationPromptDismissed', 'true');
    onComplete?.();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await updateLocation(latitude, longitude);
        } catch (err) {
          console.error('Failed to update location:', err);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
      },
      { timeout: 10000, maximumAge: 300000 }
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
    <div className="location-prompt-overlay" onClick={handleDismiss}>
      <div className="location-prompt-card" onClick={(e) => e.stopPropagation()}>
        <div className="location-prompt-icon">📍</div>
        <h2>{t('donations.location_permission_title')}</h2>
        <p>{t('donations.location_permission_desc')}</p>
        
        <div className="location-prompt-buttons">
          <button 
            className="btn btn-primary" 
            onClick={handleEnableLocation}
          >
            {t('donations.enable_location')}
          </button>
          <button 
            className="btn btn-ghost" 
            onClick={handleDismiss}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
