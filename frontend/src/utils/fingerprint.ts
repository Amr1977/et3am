let deviceId: string | null = null;

export const initDeviceFingerprint = async (): Promise<string> => {
  try {
    const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    deviceId = result.visitorId;
    console.log('[Fingerprint] Device ID:', deviceId);
    return deviceId;
  } catch (error) {
    console.warn('[Fingerprint] Failed to get device fingerprint:', error);
    deviceId = `fallback-${Date.now()}`;
    return deviceId;
  }
};

export const getDeviceId = (): string | null => {
  return deviceId;
};

export const getDeviceIdOrGenerate = async (): Promise<string> => {
  if (deviceId) return deviceId;
  return initDeviceFingerprint();
};
