/**
 * Settings Store
 * 
 * Manages application settings including Y14D integration configuration.
 * Uses localStorage for persistence.
 */

const STORAGE_KEY = 'monster-forge-settings';

// Default settings
const defaultSettings = {
  // Y14D Integration
  y14dApiKey: null,
  y14dBaseUrl: 'http://localhost:4740',
  
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
