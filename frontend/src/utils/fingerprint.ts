let deviceId: string | null = null;

export const initDeviceFingerprint = async (): Promise<string> => {
  if (deviceId) return deviceId;
  
  try {
    const stored = localStorage.getItem('et3am_device_id');
    if (stored) {
      deviceId = stored;
      console.log('[Fingerprint] Device ID from storage:', deviceId);
      return deviceId;
    }
    
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('et3am_device_id', deviceId);
    console.log('[Fingerprint] Device ID:', deviceId);
    return deviceId;
  } catch (error) {
    console.warn('[Fingerprint] Failed to get device fingerprint:', error);
    deviceId = `fallback-${Date.now()}`;
    return deviceId;
  }
};

export const getDeviceId = (): string | null => deviceId;