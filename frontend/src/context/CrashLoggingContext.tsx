import React, { createContext, useContext, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useCrashLogging, initializeGlobalErrorHandlers } from '../hooks/useCrashLogging';

interface CrashLoggingContextType {
  logCrash: (report: { title: string; message?: string; stack_trace?: string; severity?: 'info' | 'warning' | 'error' | 'critical'; metadata?: Record<string, unknown> }) => Promise<string | null>;
  logError: (title: string, error: Error | unknown, metadata?: Record<string, unknown>) => Promise<string | null>;
  logWarning: (title: string, message: string, metadata?: Record<string, unknown>) => Promise<string | null>;
}

const CrashLoggingContext = createContext<CrashLoggingContextType | undefined>(undefined);

export function useCrashLoggingContext() {
  const context = useContext(CrashLoggingContext);
  if (!context) {
    throw new Error('useCrashLoggingContext must be used within CrashLoggingProvider');
  }
  return context;
}

export function CrashLoggingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const crashLogger = useCrashLogging();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (user?.id) {
      crashLogger.setUserId(user.id);
    }
  }, [user?.id, crashLogger]);

  useEffect(() => {
    if (!initializedRef.current) {
      initializeGlobalErrorHandlers(crashLogger);
      initializedRef.current = true;
    }
  }, [crashLogger]);

  return (
    <CrashLoggingContext.Provider value={crashLogger}>
      {children}
    </CrashLoggingContext.Provider>
  );
}