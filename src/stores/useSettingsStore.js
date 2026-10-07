/**
 * Settings Store
 * 
 * Manages application settings including Y14D integration configuration.
 * Uses localStorage for persistence.
 */

const STORAGE_KEY = 'monster-forge-settings';
const ORIGINALS_STORAGE_KEY = 'monster-forge-originals';
const TRANSFORMATIONS_STORAGE_KEY = 'monster-forge-transformations';

// Default settings
const defaultSettings = {
  // Storage mode: 'local' (localStorage) or 'y14d' (Y14D cloud sync)
  storageMode: 'local',
  
  // Y14D Integration
  y14dApiKey: null,
  y14dBaseUrl: 'http://localhost:4740',
  
  // Google API Key
  googleApiKey: null,
  
  // Forge settings
  autoAnalyze: true,
  autoGenerate: true,
  
  // Display preferences
  showTransformationHistory: true,
};

// Load from localStorage
function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('[SettingsStore] Failed to load settings:', error);
  }
  return { ...defaultSettings };
}

// Save to localStorage
function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[SettingsStore] Failed to save settings:', error);
  }
}

// Simple state management (no external dependencies)
let currentSettings = loadSettings();
const listeners = new Set();

export const settingsStore = {
  // Get current settings
  getSettings() {
    return { ...currentSettings };
  },
  
  // Update settings
  updateSettings(updates) {
    currentSettings = { ...currentSettings, ...updates };
    saveSettings(currentSettings);
    listeners.forEach(listener => listener(currentSettings));
  },
  
  // Subscribe to changes
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  
  // Y14D specific methods
  getY14DConfig() {
    return {
      apiKey: currentSettings.y14dApiKey,
      baseUrl: currentSettings.y14dBaseUrl,
    };
  },
  
  setY14DApiKey(apiKey) {
    this.updateSettings({ y14dApiKey: apiKey });
  },
  
  setY14DBaseUrl(baseUrl) {
    this.updateSettings({ y14dBaseUrl: baseUrl });
  },
  
  // Test Y14D connection
  async testY14DConnection() {
    const { y14dApiKey, y14dBaseUrl } = currentSettings;
    
    if (!y14dApiKey) {
      return { success: false, error: 'No API key configured' };
    }
    
    try {
      // Test by calling the tokens endpoint
      const response = await fetch(`${y14dBaseUrl}/api/v1/tokens`, {
        headers: {
          'Authorization': `Bearer ${y14dApiKey}`,
        },
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: `Server returned ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Check if Y14D is configured
  isY14DConfigured() {
    return !!currentSettings.y14dApiKey;
  },
  
  // Clear Y14D configuration
  clearY14DConfig() {
    this.updateSettings({ y14dApiKey: null });
  },
  
  // Storage mode methods
  getStorageMode() {
    return currentSettings.storageMode || 'local';
  },
  
  setStorageMode(mode) {
    this.updateSettings({ storageMode: mode });
  },
  
  // Local storage for sprites
  // Note: Always use localStorage for now - Y14D integration can be added later
  saveOriginals(originals) {
    try {
      const data = JSON.stringify(originals);
      console.log('[SettingsStore] Saving originals, size:', Math.round(data.length / 1024), 'KB');
      localStorage.setItem(ORIGINALS_STORAGE_KEY, data);
    } catch (error) {
      console.error('[SettingsStore] Failed to save originals:', error);
    }
  },
  
  loadOriginals() {
    try {
      const stored = localStorage.getItem(ORIGINALS_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      console.log('[SettingsStore] Loaded', parsed.length, 'originals from localStorage');
      return parsed;
    } catch (error) {
      console.error('[SettingsStore] Failed to load originals:', error);
      return [];
    }
  },
  
  saveTransformations(transformations) {
    console.log('[SettingsStore] saveTransformations called with', transformations.length, 'items');
    
    try {
      const data = JSON.stringify(transformations);
      const sizeKB = Math.round(data.length / 1024);
      console.log('[SettingsStore] Saving transformations, size:', sizeKB, 'KB');
      
      // Check if we might exceed quota (localStorage typically has 5-10MB limit)
      if (sizeKB > 4000) {
        console.warn('[SettingsStore] Data size is large, may hit quota limits');
      }
      
      localStorage.setItem(TRANSFORMATIONS_STORAGE_KEY, data);
      
      // Verify the save worked
      const verifyData = localStorage.getItem(TRANSFORMATIONS_STORAGE_KEY);
      const verified = verifyData ? JSON.parse(verifyData) : [];
      console.log('[SettingsStore] Verified save - stored', verified.length, 'transformations');
      
      if (verified.length !== transformations.length) {
        console.error('[SettingsStore] MISMATCH! Tried to save', transformations.length, 'but only', verified.length, 'were stored');
      }
    } catch (error) {
      console.error('[SettingsStore] Failed to save transformations:', error);
      console.error('[SettingsStore] Error name:', error.name);
      console.error('[SettingsStore] Error message:', error.message);
      // Re-throw to let caller handle quota issues
      throw error;
    }
  },
  
  loadTransformations() {
    console.log('[SettingsStore] loadTransformations called');
    
    try {
      const stored = localStorage.getItem(TRANSFORMATIONS_STORAGE_KEY);
      console.log('[SettingsStore] Raw localStorage data exists:', !!stored);
      if (stored) {
        console.log('[SettingsStore] Raw data size:', Math.round(stored.length / 1024), 'KB');
      }
      const parsed = stored ? JSON.parse(stored) : [];
      console.log('[SettingsStore] Loaded', parsed.length, 'transformations from localStorage');
      return parsed;
    } catch (error) {
      console.error('[SettingsStore] Failed to load transformations:', error);
      return [];
    }
  },
  
  clearLocalStorage() {
    try {
      localStorage.removeItem(ORIGINALS_STORAGE_KEY);
      localStorage.removeItem(TRANSFORMATIONS_STORAGE_KEY);
    } catch (error) {
      console.error('[SettingsStore] Failed to clear local storage:', error);
    }
  },
};

// React hook for using settings
export function useSettings() {
  const [settings, setSettings] = React.useState(settingsStore.getSettings());
  
  React.useEffect(() => {
    return settingsStore.subscribe(setSettings);
  }, []);
  
  return settings;
}

// Need to import React for the hook
import React from 'react';

export default settingsStore;
