import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, updateSettings as updateSettingsLib, resetSettings as resetSettingsLib } from '../lib/settings';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);

  // Load settings when user changes
  useEffect(() => {
    if (user?.id) {
      const userSettings = getSettings(user.id);
      setSettings(userSettings);
    } else {
      setSettings(null);
    }
  }, [user?.id]);

  const updateSettings = (updates) => {
    if (!user?.id) return;

    const updated = updateSettingsLib(user.id, updates);
    setSettings(updated);
  };

  const resetSettings = () => {
    if (!user?.id) return;

    const reset = resetSettingsLib(user.id);
    setSettings(reset);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
