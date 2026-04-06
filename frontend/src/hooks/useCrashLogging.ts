import { useCallback, useRef } from 'react';

interface CrashReport {
  crash_type: 'frontend';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message?: string;
  stack_trace?: string;
  url?: string;
  metadata?: Record<string, unknown>;
}

interface CrashWithContext extends CrashReport {
  user_id?: string;
  session_id: string;
  user_agent: string;
}

function generateSessionId(): string {
  const stored = sessionStorage.getItem('et3am_session_id');
  if (stored) return stored;
  const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  sessionStorage.setItem('et3am_session_id', newId);
  return newId;
}

async function submitCrash(crash: CrashWithContext): Promise<string | null> {
  try {
    const response = await fetch('/api/crash/crash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crash),
    });
    if (response.ok) {
      const data = await response.json();
      return data.id;
    }
  } catch (e) {
    console.error('Failed to submit crash report:', e);
  }
  return null;
}

export function useCrashLogging() {
  const userIdRef = useRef<string | null>(null);
  const sessionId = useRef(generateSessionId());

  const setUserId = useCallback((userId: string | null) => {
    userIdRef.current = userId;
  }, []);

  const logCrash = useCallback(async (report: CrashReport) => {
    const crash: CrashWithContext = {
      ...report,
      crash_type: 'frontend',
      user_id: userIdRef.current || undefined,
      session_id: sessionId.current,
      user_agent: navigator.userAgent,
      url: window.location.href,
    };
    return submitCrash(crash);
  }, []);

  const logError = useCallback(async (
    title: string,
    error: Error | unknown,
    metadata?: Record<string, unknown>
  ) => {
    const err = error instanceof Error ? error : new Error(String(error));
    return logCrash({
      title,
      message: err.message,
      stack_trace: err.stack,
      severity: 'error',
      metadata,
    });
  }, [logCrash]);

  const logWarning = useCallback(async (
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ) => {
    return logCrash({
      title,
      message,
      severity: 'warning',
      metadata,
    });
  }, [logCrash]);

  return {
    setUserId,
    logCrash,
    logError,
    logWarning,
  };
}

export function initializeGlobalErrorHandlers(crashLogger: ReturnType<typeof useCrashLogging>) {
  const originalOnerror = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    crashLogger.logError(`JavaScript Error: ${message}`, error || new Error(String(message)), {
      source,
      lineno,
      colno,
    });
    if (originalOnerror) {
      return originalOnerror(message, source, lineno, colno, error);
    }
    return false;
  };

  const originalOnunhandledrejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    crashLogger.logError('Unhandled Promise Rejection', event.reason, {
      promise: event.promise,
    });
    if (originalOnunhandledrejection) {
      return originalOnunhandledrejection(event);
    }
    return false;
  };
}

export default useCrashLogging;