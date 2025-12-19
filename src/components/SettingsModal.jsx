/**
 * SettingsModal Component
 * 
 * Application settings including Y14D integration configuration.
 */

import React, { useState, useEffect } from 'react';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, SPACING } from '../styles/theme';
import { settingsStore } from '../stores/useSettingsStore';
import { IntegrationsIcon, ForgeIcon, InfoIcon, CloseIcon, SaveIcon, DeleteIcon, RefreshIcon, ImageIcon } from './Icons';

const TABS = [
  { id: 'storage', label: 'Storage', Icon: ImageIcon },
  { id: 'integrations', label: 'Integrations', Icon: IntegrationsIcon },
  { id: 'forge', label: 'Forge', Icon: ForgeIcon },
  { id: 'about', label: 'About', Icon: InfoIcon },
];

export default function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('storage');
  const [settings, setSettings] = useState(settingsStore.getSettings());
  
  // Google API state
  const [googleApiKey, setGoogleApiKey] = useState(settings.googleApiKey || '');
  const [showGoogleApiKey, setShowGoogleApiKey] = useState(false);
  
  // Y14D form state
  const [y14dApiKey, setY14dApiKey] = useState(settings.y14dApiKey || '');
  const [y14dBaseUrl, setY14dBaseUrl] = useState(settings.y14dBaseUrl || 'http://localhost:4740');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState('idle'); // idle, testing, success, error
  const [testError, setTestError] = useState(null);
  
  // Sync with store
  useEffect(() => {
    return settingsStore.subscribe((newSettings) => {
      setSettings(newSettings);
    });
  }, []);
  
  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestError(null);
    
    // Temporarily save the values for testing
    settingsStore.updateSettings({ y14dApiKey, y14dBaseUrl });
    
    const result = await settingsStore.testY14DConnection();
    
    if (result.success) {
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } else {
      setTestStatus('error');
      setTestError(result.error);
    }
  };
  
  const handleSaveY14D = () => {
    settingsStore.updateSettings({ y14dApiKey, y14dBaseUrl });
    setTestStatus('idle');
  };
  
  const handleClearY14D = () => {
    setY14dApiKey('');
    settingsStore.clearY14DConfig();
    setTestStatus('idle');
  };
  
  const hasChanges = y14dApiKey !== (settings.y14dApiKey || '') || 
                     y14dBaseUrl !== settings.y14dBaseUrl;
  
  if (!isOpen) return null;
  
  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      width: '800px',
      height: '600px',
      backgroundColor: COLORS.background.secondary,
      borderRadius: BORDER_RADIUS.lg,
      border: `1px solid ${COLORS.ui.border}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACING.md,
      borderBottom: `1px solid ${COLORS.ui.border}`,
    },
    title: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.lg,
      color: COLORS.text.primary,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: COLORS.text.secondary,
      fontSize: '24px',
      cursor: 'pointer',
      padding: SPACING.xs,
      lineHeight: 1,
    },
    body: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
    },
    sidebar: {
      width: '200px',
      borderRight: `1px solid ${COLORS.ui.border}`,
      padding: SPACING.sm,
    },
    tabButton: (isActive) => ({
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
      padding: `${SPACING.sm} ${SPACING.md}`,
      marginBottom: SPACING.xs,
      backgroundColor: isActive ? `${COLORS.ui.active}20` : 'transparent',
      border: 'none',
      borderRadius: BORDER_RADIUS.sm,
      color: isActive ? COLORS.ui.active : COLORS.text.secondary,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.md,
      cursor: 'pointer',
      textAlign: 'left',
    }),
    content: {
      flex: 1,
      padding: SPACING.lg,
      overflow: 'auto',
    },
    section: {
      marginBottom: SPACING.lg,
    },
    sectionTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.md,
      color: COLORS.text.primary,
      marginBottom: SPACING.md,
    },
    sectionDesc: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary,
      marginBottom: SPACING.md,
    },
    formGroup: {
      marginBottom: SPACING.md,
    },
    label: {
      display: 'block',
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary,
      marginBottom: SPACING.xs,
    },
    inputWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    },
    input: {
      width: '100%',
      padding: SPACING.sm,
      paddingRight: '40px',
      backgroundColor: COLORS.background.primary,
      border: `1px solid ${COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      color: COLORS.text.primary,
      fontFamily: 'monospace',
      fontSize: TYPOGRAPHY.fontSize.sm,
    },
    toggleButton: {
      position: 'absolute',
      right: SPACING.sm,
      background: 'none',
      border: 'none',
      color: COLORS.text.secondary,
      cursor: 'pointer',
      padding: SPACING.xs,
    },
    hint: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.muted,
      marginTop: SPACING.xs,
    },
    buttonRow: {
      display: 'flex',
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },
    button: (variant) => ({
      padding: `${SPACING.sm} ${SPACING.md}`,
      backgroundColor: variant === 'primary' ? COLORS.ui.active : 
                       variant === 'danger' ? COLORS.ui.error : 
                       COLORS.background.tertiary,
      border: 'none',
      borderRadius: BORDER_RADIUS.sm,
      color: COLORS.text.primary,
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.xs,
    }),
    statusBadge: (status) => ({
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
      padding: `${SPACING.sm} ${SPACING.md}`,
      borderRadius: BORDER_RADIUS.sm,
      marginBottom: SPACING.md,
      backgroundColor: status === 'success' ? `${COLORS.ui.success}20` :
                       status === 'error' ? `${COLORS.ui.error}20` :
                       status === 'configured' ? `${COLORS.ui.success}20` :
                       `${COLORS.ui.info}20`,
      border: `1px solid ${status === 'success' ? COLORS.ui.success :
                          status === 'error' ? COLORS.ui.error :
                          status === 'configured' ? COLORS.ui.success :
                          COLORS.ui.info}40`,
      color: status === 'success' ? COLORS.ui.success :
             status === 'error' ? COLORS.ui.error :
             status === 'configured' ? COLORS.ui.success :
             COLORS.ui.info,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
    }),
    infoBox: {
      backgroundColor: COLORS.background.primary,
      borderRadius: BORDER_RADIUS.sm,
      padding: SPACING.md,
      marginTop: SPACING.md,
    },
    infoTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.primary,
      fontWeight: 'bold',
      marginBottom: SPACING.sm,
    },
    infoList: {
      listStyle: 'disc',
      listStylePosition: 'inside',
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.secondary,
      lineHeight: 1.8,
    },
    setupSteps: {
      backgroundColor: COLORS.background.card,
      borderRadius: BORDER_RADIUS.sm,
      padding: SPACING.md,
      marginTop: SPACING.md,
      border: `1px solid ${COLORS.ui.border}`,
    },
    stepTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.primary,
      fontWeight: 'bold',
      marginBottom: SPACING.sm,
    },
    stepList: {
      listStyle: 'decimal',
      listStylePosition: 'inside',
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.secondary,
      lineHeight: 2,
    },
    code: {
      backgroundColor: COLORS.background.primary,
      padding: '2px 6px',
      borderRadius: BORDER_RADIUS.sm,
      fontFamily: 'monospace',
      fontSize: TYPOGRAPHY.fontSize.xs,
    },
    link: {
      color: COLORS.ui.active,
      textDecoration: 'none',
    },
  };
  
  const renderStorageTab = () => (
    <div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Storage Mode</div>
        <div style={styles.sectionDesc}>
          Choose where to save your sprites and transformations.
        </div>
        
        {/* Storage Mode Selection */}
        <div style={styles.formGroup}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: SPACING.md,
              padding: SPACING.md,
              backgroundColor: settings.storageMode === 'local' ? `${COLORS.ui.active}20` : COLORS.background.card,
              border: `2px solid ${settings.storageMode === 'local' ? COLORS.ui.active : COLORS.ui.border}`,
              borderRadius: BORDER_RADIUS.md,
              cursor: 'pointer',
            }}>
              <input
                type="radio"
                name="storageMode"
                value="local"
                checked={settings.storageMode === 'local'}
                onChange={() => settingsStore.setStorageMode('local')}
                style={{ marginTop: '4px' }}
              />
              <div>
                <div style={{ fontWeight: 'bold', color: COLORS.text.primary, marginBottom: SPACING.xs }}>
                  Local Storage (Browser)
                </div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.secondary }}>
                  Sprites are saved in your browser's localStorage. Data persists across refreshes but is limited to this browser/device.
                </div>
              </div>
            </label>
            
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: SPACING.md,
              padding: SPACING.md,
              backgroundColor: settings.storageMode === 'y14d' ? `${COLORS.ui.active}20` : COLORS.background.card,
              border: `2px solid ${settings.storageMode === 'y14d' ? COLORS.ui.active : COLORS.ui.border}`,
              borderRadius: BORDER_RADIUS.md,
              cursor: 'pointer',
              opacity: settings.y14dApiKey ? 1 : 0.6,
            }}>
              <input
                type="radio"
                name="storageMode"
                value="y14d"
                checked={settings.storageMode === 'y14d'}
                onChange={() => settingsStore.setStorageMode('y14d')}
                disabled={!settings.y14dApiKey}
                style={{ marginTop: '4px' }}
              />
              <div>
                <div style={{ fontWeight: 'bold', color: COLORS.text.primary, marginBottom: SPACING.xs }}>
                  Y14D Cloud Sync
                </div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.secondary }}>
                  Sync sprites to your Y14D archive. Access from any device. {!settings.y14dApiKey && '(Configure API key in Integrations tab)'}
                </div>
              </div>
            </label>
          </div>
        </div>
        
        {/* Local Storage Info */}
        {settings.storageMode === 'local' && (
          <div style={styles.infoBox}>
            <div style={styles.infoTitle}>Local Storage Notes:</div>
            <ul style={styles.infoList}>
              <li>Data is stored in your browser's localStorage</li>
              <li>Storage limit is typically 5-10MB depending on browser</li>
              <li>Data will be lost if you clear browser data</li>
              <li>Not synced across devices or browsers</li>
            </ul>
            
            <div style={{ marginTop: SPACING.md }}>
              <button
                style={styles.button('danger')}
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
                    settingsStore.clearLocalStorage();
                    window.location.reload();
                  }
                }}
              >
                <DeleteIcon size={14} />
                Clear All Local Data
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Google API Key Section */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Google API Key</div>
        <div style={styles.sectionDesc}>
          Required for sprite generation (Gemini/Nano Banana). Get your key from{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={styles.link}>
            Google AI Studio ↗
          </a>
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>API Key</label>
          <div style={styles.inputWrapper}>
            <input
              type={showGoogleApiKey ? 'text' : 'password'}
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
              placeholder="AIzaSy..."
              style={styles.input}
            />
            <button
              style={styles.toggleButton}
              onClick={() => setShowGoogleApiKey(!showGoogleApiKey)}
            >
              {showGoogleApiKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>
        
        <div style={styles.buttonRow}>
          <button
            style={styles.button('primary')}
            onClick={() => {
              settingsStore.updateSettings({ googleApiKey });
              // Also save to env for NanoBanana service
              window.localStorage.setItem('GOOGLE_API_KEY', googleApiKey);
            }}
            disabled={googleApiKey === (settings.googleApiKey || '')}
          >
            <SaveIcon size={14} />
            Save API Key
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderIntegrationsTab = () => (
    <div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Y14D Integration</div>
        <div style={styles.sectionDesc}>
          Connect your Yapture Archived (Y14D) account to store sprites and monster data in your personal archive.
        </div>
        
        {/* Status Badge */}
        {settings.y14dApiKey && !hasChanges && (
          <div style={styles.statusBadge('configured')}>
            ✓ Y14D integration active
          </div>
        )}
        
        {testStatus === 'success' && (
          <div style={styles.statusBadge('success')}>
            ✓ Connection successful! Your API key is valid.
          </div>
        )}
        
        {testStatus === 'error' && (
          <div style={styles.statusBadge('error')}>
            ✗ Connection failed: {testError}
          </div>
        )}
        
        {/* Base URL */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Y14D Base URL</label>
          <input
            type="text"
            value={y14dBaseUrl}
            onChange={(e) => setY14dBaseUrl(e.target.value)}
            placeholder="http://localhost:4740"
            style={styles.input}
          />
          <div style={styles.hint}>
            The URL of your Y14D instance (use http://localhost:4740 for local development)
          </div>
        </div>
        
        {/* API Key */}
        <div style={styles.formGroup}>
          <label style={styles.label}>API Key</label>
          <div style={styles.inputWrapper}>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={y14dApiKey}
              onChange={(e) => setY14dApiKey(e.target.value)}
              placeholder="y14d_..."
              style={styles.input}
            />
            <button
              style={styles.toggleButton}
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <div style={styles.hint}>
            Generate an API key in your{' '}
            <a href={y14dBaseUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
              Y14D account ↗
            </a>
            {' '}with scopes: <span style={styles.code}>archive:read</span>, <span style={styles.code}>archive:write</span>, <span style={styles.code}>archive:delete</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={styles.buttonRow}>
          <button
            style={styles.button('secondary')}
            onClick={handleTestConnection}
            disabled={!y14dApiKey || testStatus === 'testing'}
          >
            <RefreshIcon size={14} />
            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            style={styles.button('primary')}
            onClick={handleSaveY14D}
            disabled={!y14dApiKey || !hasChanges}
          >
            <SaveIcon size={14} />
            Save
          </button>
          {settings.y14dApiKey && (
            <button
              style={styles.button('danger')}
              onClick={handleClearY14D}
            >
              <DeleteIcon size={14} />
              Clear
            </button>
          )}
        </div>
        
        {/* Info Box */}
        <div style={styles.infoBox}>
          <div style={styles.infoTitle}>How it works:</div>
          <ul style={styles.infoList}>
            <li>Uploaded sprites are stored in your Y14D archive</li>
            <li>Generated monster data (JSON) is saved alongside sprites</li>
            <li>Access your sprites and data from any device via Y14D</li>
            <li>Transformations history is preserved for future reference</li>
          </ul>
        </div>
        
        {/* Setup Instructions */}
        {!settings.y14dApiKey && (
          <div style={styles.setupSteps}>
            <div style={styles.stepTitle}>Setup Instructions:</div>
            <ol style={styles.stepList}>
              <li>Visit your Y14D instance at <a href={y14dBaseUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>{y14dBaseUrl}</a></li>
              <li>Register or log in to your account</li>
              <li>Navigate to <strong>API Tokens</strong> section</li>
              <li>Create a new token named <strong>"Monster Forge"</strong></li>
              <li>Select scopes: <span style={styles.code}>archive:read</span>, <span style={styles.code}>archive:write</span>, <span style={styles.code}>archive:delete</span></li>
              <li>Copy the generated token (shown only once!)</li>
              <li>Paste the token above and click <strong>Save</strong></li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderForgeTab = () => (
    <div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Forge Settings</div>
        <div style={styles.sectionDesc}>
          Configure transformation pipeline behavior.
        </div>
        
        <div style={styles.formGroup}>
          <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <input
              type="checkbox"
              checked={settings.autoAnalyze}
              onChange={(e) => settingsStore.updateSettings({ autoAnalyze: e.target.checked })}
            />
            Auto-analyze sprites on upload
          </label>
          <div style={styles.hint}>
            Automatically run sprite analysis when images are uploaded
          </div>
        </div>
        
        <div style={styles.formGroup}>
          <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <input
              type="checkbox"
              checked={settings.autoGenerate}
              onChange={(e) => settingsStore.updateSettings({ autoGenerate: e.target.checked })}
            />
            Auto-generate monster data
          </label>
          <div style={styles.hint}>
            Automatically generate names, stats, and abilities after analysis
          </div>
        </div>
        
        <div style={styles.formGroup}>
          <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <input
              type="checkbox"
              checked={settings.showTransformationHistory}
              onChange={(e) => settingsStore.updateSettings({ showTransformationHistory: e.target.checked })}
            />
            Show transformation history
          </label>
          <div style={styles.hint}>
            Display a log of all transformations in the Forge tab
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderAboutTab = () => (
    <div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Monster Forge</div>
        <div style={styles.sectionDesc}>
          Sprite ETL Pipeline v2.0
        </div>
        
        <div style={styles.infoBox}>
          <div style={styles.infoTitle}>About</div>
          <p style={{ ...styles.hint, marginTop: 0, lineHeight: 1.6 }}>
            Monster Forge is a sprite processing pipeline that transforms pixel art into 
            game-ready monster data. Upload sprites, analyze them with AI, and generate 
            complete monster profiles including stats, abilities, evolutions, and pose variants.
          </p>
        </div>
        
        <div style={{ ...styles.infoBox, marginTop: SPACING.md }}>
          <div style={styles.infoTitle}>ETL Architecture</div>
          <ul style={styles.infoList}>
            <li><strong>Extract:</strong> Upload and parse sprite images</li>
            <li><strong>Transform:</strong> AI-powered analysis and data generation</li>
            <li><strong>Load:</strong> Export to JSON, sprite sheets, or Y14D archive</li>
          </ul>
        </div>
        
        <div style={{ ...styles.infoBox, marginTop: SPACING.md }}>
          <div style={styles.infoTitle}>AI Services</div>
          <ul style={styles.infoList}>
            <li><strong>Claude Vision:</strong> Sprite analysis and classification</li>
            <li><strong>Nano Banana:</strong> Pose and evolution generation</li>
          </ul>
        </div>
      </div>
    </div>
  );
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'storage':
        return renderStorageTab();
      case 'integrations':
        return renderIntegrationsTab();
      case 'forge':
        return renderForgeTab();
      case 'about':
        return renderAboutTab();
      default:
        return null;
    }
  };
  
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>Settings</div>
          <button style={styles.closeButton} onClick={onClose}><CloseIcon size={20} /></button>
        </div>
        
        <div style={styles.body}>
          <div style={styles.sidebar}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                style={styles.tabButton(activeTab === tab.id)}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.Icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
          
          <div style={styles.content}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
