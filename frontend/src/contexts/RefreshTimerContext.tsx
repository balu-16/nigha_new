import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface RefreshTimerContextType {
  refreshInterval: number; // in seconds
  setRefreshInterval: (interval: number) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
  isAutoRefreshEnabled: boolean;
  setAutoRefreshEnabled: (enabled: boolean) => void;
}

const RefreshTimerContext = createContext<RefreshTimerContextType | undefined>(undefined);

export const RefreshTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshInterval, setRefreshIntervalState] = useState<number>(30); // Default 30 seconds
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isAutoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedInterval = localStorage.getItem('dashboard-refresh-interval');
    const savedAutoRefresh = localStorage.getItem('dashboard-auto-refresh');
    
    if (savedInterval) {
      setRefreshIntervalState(parseInt(savedInterval, 10));
    }
    
    if (savedAutoRefresh !== null) {
      setAutoRefreshEnabled(savedAutoRefresh === 'true');
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dashboard-refresh-interval', refreshInterval.toString());
  }, [refreshInterval]);

  useEffect(() => {
    localStorage.setItem('dashboard-auto-refresh', isAutoRefreshEnabled.toString());
  }, [isAutoRefreshEnabled]);

  // Auto-refresh timer
  useEffect(() => {
    if (!isAutoRefreshEnabled) return;

    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, isAutoRefreshEnabled]);

  const setRefreshInterval = useCallback((interval: number) => {
    setRefreshIntervalState(interval);
    // Trigger immediate refresh when interval changes
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <RefreshTimerContext.Provider value={{
      refreshInterval,
      setRefreshInterval,
      refreshTrigger,
      triggerRefresh,
      isAutoRefreshEnabled,
      setAutoRefreshEnabled
    }}>
      {children}
    </RefreshTimerContext.Provider>
  );
};

export const useRefreshTimer = () => {
  const context = useContext(RefreshTimerContext);
  if (!context) {
    throw new Error('useRefreshTimer must be used within RefreshTimerProvider');
  }
  return context;
};