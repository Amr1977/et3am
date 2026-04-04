import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface SoundContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playSound: (soundType: SoundType) => void;
}

type SoundType = 'new_meal' | 'reserved' | 'delivered' | 'message' | 'cancelled';

const soundUrls: Record<SoundType, string> = {
  new_meal: '/sounds/new_meal.mp3',
  reserved: '/sounds/reserved.mp3',
  delivered: '/sounds/delivered.mp3',
  message: '/sounds/message.mp3',
  cancelled: '/sounds/cancelled.mp3',
};

const SoundContext = createContext<SoundContextType | null>(null);

interface SoundProviderProps {
  children: ReactNode;
}

export function SoundProvider({ children }: SoundProviderProps) {
  const { user, token, isAuthenticated } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioCache, setAudioCache] = useState<Record<SoundType, HTMLAudioElement>>({} as any);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Load user's sound preference
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
    const cache: Record<SoundType, HTMLAudioElement> = {} as any;
    for (const [type, url] of Object.entries(soundUrls)) {
      const audio = new Audio(url);
      audio.preload = 'auto';
      cache[type as SoundType] = audio;
    }
    setAudioCache(cache);

    return () => {
      for (const audio of Object.values(cache)) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  const playSound = (soundType: SoundType) => {
    if (!soundEnabled) return;
    
    const audio = audioCache[soundType];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(console.error);
    }
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