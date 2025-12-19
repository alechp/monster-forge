/**
 * ExportTab Component
 * 
 * Export monster data to JSON format or upload to Y14D.
 */

import React, { useState, useEffect } from 'react';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, SPACING } from '../../styles/theme';
import { y14dStorage } from '../../services/y14dStorage';
import { settingsStore } from '../../stores/useSettingsStore';

export default function ExportTab({ monster }) {
  const [copied, setCopied] = useState(false);
  const [y14dConfigured, setY14dConfigured] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Check Y14D configuration
  useEffect(() => {
    setY14dConfigured(settingsStore.isY14DConfigured());
    
    return settingsStore.subscribe(() => {
      setY14dConfigured(settingsStore.isY14DConfigured());
    });
  }, []);

  const generateExportData = () => {
    return {
      version: '2.0.0',
      generator: 'Monster Forge',
      exportDate: new Date().toISOString(),
      aiServices: {
        vision: 'Claude Sonnet (Anthropic)',
        imageGeneration: 'Nano Banana (Google Gemini)'
      },
      monster: {
        id: monster.id,
        name: monster.name,
        primaryElement: monster.primaryElement,
        secondaryElement: monster.secondaryElement,
        creatureType: monster.creatureType,
        sizeClass: monster.sizeClass,
        catchRate: monster.catchRate,
        baseExp: monster.baseExp,
        genderRatio: monster.genderRatio,
        eggGroups: monster.eggGroups,
        analysis: monster.analysis,
        evolutions: monster.evolutions.map(evo => ({
          level: evo.level,
          name: evo.name,
          stats: evo.stats,
          abilities: evo.abilities,
          lore: evo.lore,
          hasSprite: !!evo.sprite
        })),
        poses: Object.entries(monster.poses || {}).reduce((acc, [key, val]) => {
          acc[key] = { generated: val.generated };
          return acc;
        }, {}),
        animations: Object.entries(monster.animations || {}).reduce((acc, [key, val]) => {
          acc[key] = { frameCount: val.frames?.length || 0, fps: val.fps, generated: val.generated };
          return acc;
        }, {})
      }
    };
  };

  const handleCopy = () => {
    const data = generateExportData();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const data = generateExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${monster.name.toLowerCase()}_data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSprites = () => {
    // For now, just download the base sprite
    const a = document.createElement('a');
    a.href = monster.baseSprite;
    a.download = `${monster.name.toLowerCase()}_sprite.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleUploadToY14D = async () => {
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    
    try {
      const result = await y14dStorage.uploadMonster(monster);
      setUploadResult(result);
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const exportData = generateExportData();

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING.md
    },
    card: {
      backgroundColor: COLORS.background.card,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      border: `1px solid ${COLORS.ui.border}`
    },
    title: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.primary,
      marginBottom: SPACING.md
    },
    buttonRow: {
      display: 'flex',
      gap: SPACING.sm,
      marginBottom: SPACING.md,
      flexWrap: 'wrap'
    },
    button: (variant) => ({
      backgroundColor: variant === 'primary' ? COLORS.ui.active : 
                       variant === 'y14d' ? '#4a90d9' :
                       COLORS.background.secondary,
      color: COLORS.text.primary,
      border: `1px solid ${variant === 'primary' ? COLORS.ui.active : 
                          variant === 'y14d' ? '#4a90d9' :
                          COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      padding: `${SPACING.sm} ${SPACING.md}`,
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.xs,
      opacity: variant === 'disabled' ? 0.5 : 1,
    }),
    preview: {
      backgroundColor: COLORS.background.secondary,
      borderRadius: BORDER_RADIUS.sm,
      padding: SPACING.md,
      fontFamily: 'monospace',
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.secondary,
      maxHeight: '400px',
      overflow: 'auto',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    },
    copied: {
      color: COLORS.ui.success,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      marginLeft: SPACING.sm
    },
    summary: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: SPACING.sm,
      marginBottom: SPACING.md
    },
    summaryItem: {
      display: 'flex',
      justifyContent: 'space-between',
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm
    },
    summaryLabel: {
      color: COLORS.text.secondary
    },
    summaryValue: {
      color: COLORS.text.primary
    },
    y14dSection: {
      marginTop: SPACING.md,
      padding: SPACING.md,
      backgroundColor: `${COLORS.ui.info}10`,
      borderRadius: BORDER_RADIUS.sm,
      border: `1px solid ${COLORS.ui.info}30`,
    },
    y14dTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.ui.info,
      marginBottom: SPACING.sm,
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    y14dDescription: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.secondary,
      marginBottom: SPACING.md,
    },
    successBox: {
      padding: SPACING.md,
      backgroundColor: `${COLORS.ui.success}20`,
      borderRadius: BORDER_RADIUS.sm,
      border: `1px solid ${COLORS.ui.success}40`,
      marginTop: SPACING.md,
    },
    successText: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.ui.success,
      marginBottom: SPACING.xs,
    },
    archiveId: {
      fontFamily: 'monospace',
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.secondary,
      backgroundColor: COLORS.background.primary,
      padding: `${SPACING.xs} ${SPACING.sm}`,
      borderRadius: BORDER_RADIUS.sm,
      display: 'inline-block',
    },
    errorBox: {
      padding: SPACING.md,
      backgroundColor: `${COLORS.ui.error}20`,
      borderRadius: BORDER_RADIUS.sm,
      border: `1px solid ${COLORS.ui.error}40`,
      marginTop: SPACING.md,
    },
    errorText: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.ui.error,
    },
    notConfigured: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.muted,
      fontStyle: 'italic',
    },
  };

  return (
    <div style={styles.container}>
      {/* Local Export Options */}
      <div style={styles.card}>
        <div style={styles.title}>Local Export</div>
        
        <div style={styles.buttonRow}>
          <button style={styles.button('primary')} onClick={handleDownload}>
            📥 Download JSON
          </button>
          <button style={styles.button('secondary')} onClick={handleCopy}>
            📋 Copy to Clipboard
          </button>
          {copied && <span style={styles.copied}>Copied!</span>}
        </div>
        
        <div style={styles.buttonRow}>
          <button style={styles.button('secondary')} onClick={handleDownloadSprites}>
            🖼️ Download Base Sprite
          </button>
        </div>
      </div>

      {/* Y14D Cloud Export */}
      <div style={styles.card}>
        <div style={styles.title}>Cloud Archive (Y14D)</div>
        
        <div style={styles.y14dSection}>
          <div style={styles.y14dTitle}>
            ☁️ Yapture Archived Integration
          </div>
          <div style={styles.y14dDescription}>
            Upload your monster to Y14D for permanent cloud storage. Your sprite and data will be 
            securely archived and accessible from any device.
          </div>
          
          {y14dConfigured ? (
            <>
              <button 
                style={styles.button('y14d')} 
                onClick={handleUploadToY14D}
                disabled={uploading}
              >
                {uploading ? '⏳ Uploading...' : '☁️ Upload to Y14D'}
              </button>
              
              {uploadResult && (
                <div style={styles.successBox}>
                  <div style={styles.successText}>✓ Successfully uploaded to Y14D!</div>
                  <div>
                    <span style={{ color: COLORS.text.secondary, fontSize: TYPOGRAPHY.fontSize.xs }}>
                      Archive ID:{' '}
                    </span>
                    <span style={styles.archiveId}>{uploadResult.archiveId}</span>
                  </div>
                </div>
              )}
              
              {uploadError && (
                <div style={styles.errorBox}>
                  <div style={styles.errorText}>✗ Upload failed: {uploadError}</div>
                </div>
              )}
            </>
          ) : (
            <div style={styles.notConfigured}>
              Y14D not configured. Go to Settings → Integrations to add your API key.
            </div>
          )}
        </div>
      </div>

      {/* Export Summary */}
      <div style={styles.card}>
        <div style={styles.title}>Export Summary</div>
        
        <div style={styles.summary}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Monster Name</span>
            <span style={styles.summaryValue}>{monster.name}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Elements</span>
            <span style={styles.summaryValue}>
              {monster.primaryElement}
              {monster.secondaryElement && ` / ${monster.secondaryElement}`}
            </span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Evolutions</span>
            <span style={styles.summaryValue}>{monster.evolutions?.length || 0}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Abilities</span>
            <span style={styles.summaryValue}>
              {monster.evolutions?.reduce((sum, evo) => sum + (evo.abilities?.length || 0), 0) || 0}
            </span>
          </div>
        </div>
      </div>

      {/* JSON Preview */}
      <div style={styles.card}>
        <div style={styles.title}>JSON Preview</div>
        <pre style={styles.preview}>
          {JSON.stringify(exportData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
