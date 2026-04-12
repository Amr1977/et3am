import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useRTL } from '../hooks/useRTL';
import { playSound as playSoundEffect, preloadSounds } from '../utils/soundPlayer';

type SoundType = 'new_meal' | 'reserved' | 'delivered' | 'message' | 'cancelled';

interface SoundContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playSound: (soundType: SoundType) => void;
}

const soundMessages: Record<SoundType, { en: string; ar: string }> = {
  new_meal: {
    en: 'New meal available!',
    ar: 'وجبة جديدة متاحة!',
  },
  reserved: {
    en: 'Your donation has been reserved!',
    ar: 'تم حجز تبرعك!',
  },
  delivered: {
    en: 'Meal has been delivered!',
    ar: 'تم تسليم الوجبة!',
  },
  message: {
    en: 'New message received!',
    ar: 'رسالة جديدة!',
  },
  cancelled: {
    en: 'Reservation cancelled!',
    ar: 'تم إلغاء الحجز!',
  },
};

const SoundContext = createContext<SoundContextType | null>(null);

interface SoundProviderProps {
  children: ReactNode;
}

export function SoundProvider({ children }: SoundProviderProps) {
  const { user, token, isAuthenticated } = useAuth();
  const { isRTL } = useRTL();
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    fetch(`/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.user?.sound_enabled !== undefined) {
          setSoundEnabled(data.user.sound_enabled);
        }
      })
      .catch(console.error);
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (soundEnabled) {
      preloadSounds();
    }
  }, [soundEnabled]);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isRTL ? 'ar-SA' : 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    window.speechSynthesis.speak(utterance);
  };

  const playSound = (soundType: SoundType) => {
    if (!soundEnabled) return;
    
    try {
      playSoundEffect(soundType);
    } catch (err) {
      console.log('Sound effect not available, using speech fallback');
    }
    
    const messages = soundMessages[soundType];
    const text = isRTL ? messages.ar : messages.en;
    setTimeout(() => speak(text), 100);
  };

  const handleSetSoundEnabled = async (enabled: boolean) => {
    setSoundEnabled(enabled);
    
    if (isAuthenticated && token) {
      try {
        await fetch('/api/users/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sound_enabled: enabled }),
        });
      } catch (err) {
        console.error('Failed to update sound preference:', err);
      }
    }
  };

  return (
    <SoundContext.Provider value={{
      soundEnabled,
      setSoundEnabled: handleSetSoundEnabled,
      playSound,
    }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within SoundProvider');
  }
  return context;
}