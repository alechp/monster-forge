/**
 * UploadModal Component
 * 
 * Modal that appears after image upload to ask if it's a single sprite
 * or a sprite sheet with multiple characters.
 */

import { useState } from 'react';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, SPACING } from '../styles/theme';
import { CloseIcon, ImageIcon, GroupIcon, SparkleIcon } from './Icons';

export default function UploadModal({ 
  isOpen, 
  onClose, 
  imagePreview, 
  filename,
  onConfirm, // (isSpriteSheet: boolean, estimatedCount?: number) => void
  onAnalyze, // () => Promise<{ spriteCount: number, description: string }>
}) {
  const [mode, setMode] = useState('single'); // 'single' or 'sheet'
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [manualCount, setManualCount] = useState(1);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await onAnalyze();
      setAnalysisResult(result);
      if (result?.spriteCount > 1) {
        setMode('sheet');
        setManualCount(result.spriteCount);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(mode === 'sheet', mode === 'sheet' ? manualCount : 1);
    onClose();
  };

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
      width: '500px',
      maxHeight: '90vh',
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
      fontSize: TYPOGRAPHY.fontSize.md,
      color: COLORS.text.primary,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      color: COLORS.text.secondary,
      cursor: 'pointer',
      padding: SPACING.xs,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      padding: SPACING.lg,
      overflow: 'auto',
    },
    preview: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: SPACING.lg,
    },
    previewImage: {
      maxWidth: '100%',
      maxHeight: '200px',
      objectFit: 'contain',
      imageRendering: 'pixelated',
      borderRadius: BORDER_RADIUS.md,
      border: `2px solid ${COLORS.ui.border}`,
      backgroundColor: COLORS.background.primary,
    },
    filename: {
      textAlign: 'center',
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.muted,
      marginTop: SPACING.xs,
    },
    question: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.md,
      color: COLORS.text.primary,
      marginBottom: SPACING.md,
      textAlign: 'center',
    },
    options: {
      display: 'flex',
      gap: SPACING.md,
      marginBottom: SPACING.lg,
    },
    optionCard: (isSelected) => ({
      flex: 1,
      padding: SPACING.md,
      backgroundColor: isSelected ? `${COLORS.ui.active}20` : COLORS.background.card,
      border: `2px solid ${isSelected ? COLORS.ui.active : COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.md,
      cursor: 'pointer',
      textAlign: 'center',
      transition: 'all 0.2s ease',
    }),
    optionIcon: {
      marginBottom: SPACING.sm,
      color: COLORS.text.secondary,
    },
    optionTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      color: COLORS.text.primary,
      marginBottom: SPACING.xs,
    },
    optionDesc: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.muted,
    },
    analyzeSection: {
      backgroundColor: COLORS.background.card,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.lg,
      border: `1px solid ${COLORS.ui.border}`,
    },
    analyzeButton: {
      width: '100%',
      padding: SPACING.sm,
      backgroundColor: COLORS.background.tertiary,
      border: `1px solid ${COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      color: COLORS.text.primary,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      cursor: analyzing ? 'wait' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.sm,
      opacity: analyzing ? 0.7 : 1,
    },
    analysisResult: {
      marginTop: SPACING.md,
      padding: SPACING.sm,
      backgroundColor: `${COLORS.ui.success}20`,
      borderRadius: BORDER_RADIUS.sm,
      border: `1px solid ${COLORS.ui.success}40`,
    },
    countInput: {
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.md,
      marginTop: SPACING.md,
    },
    countLabel: {
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary,
    },
    countNumber: {
      width: '60px',
      padding: SPACING.xs,
      backgroundColor: COLORS.background.primary,
      border: `1px solid ${COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      color: COLORS.text.primary,
      textAlign: 'center',
      fontSize: TYPOGRAPHY.fontSize.md,
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: SPACING.sm,
      padding: SPACING.md,
      borderTop: `1px solid ${COLORS.ui.border}`,
    },
    button: (variant) => ({
      padding: `${SPACING.sm} ${SPACING.lg}`,
      backgroundColor: variant === 'primary' ? COLORS.ui.active : 'transparent',
      border: variant === 'primary' ? 'none' : `1px solid ${COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      color: variant === 'primary' ? '#000' : COLORS.text.secondary,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      cursor: 'pointer',
    }),
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.title}>Upload Sprite</div>
          <button style={styles.closeButton} onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div style={styles.body}>
          {/* Image Preview */}
          <div style={styles.preview}>
            <div>
              <img src={imagePreview} alt="Uploaded" style={styles.previewImage} />
              <div style={styles.filename}>{filename}</div>
            </div>
          </div>

          {/* Question */}
          <div style={styles.question}>
            What type of image is this?
          </div>

          {/* Options */}
          <div style={styles.options}>
            <div 
              style={styles.optionCard(mode === 'single')}
              onClick={() => setMode('single')}
            >
              <div style={styles.optionIcon}>
                <ImageIcon size={32} />
              </div>
              <div style={styles.optionTitle}>Single Sprite</div>
              <div style={styles.optionDesc}>One character or creature</div>
            </div>

            <div 
              style={styles.optionCard(mode === 'sheet')}
              onClick={() => setMode('sheet')}
            >
              <div style={styles.optionIcon}>
                <GroupIcon size={32} />
              </div>
              <div style={styles.optionTitle}>Sprite Sheet</div>
              <div style={styles.optionDesc}>Multiple characters/poses</div>
            </div>
          </div>

          {/* AI Analysis (for sprite sheets) */}
          {mode === 'sheet' && (
            <div style={styles.analyzeSection}>
              <button 
                style={styles.analyzeButton}
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                <SparkleIcon size={16} />
                {analyzing ? 'Analyzing...' : 'Auto-detect sprite count'}
              </button>

              {analysisResult && (
                <div style={styles.analysisResult}>
                  <div style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.ui.success }}>
                    Detected approximately {analysisResult.spriteCount} unique sprites
                  </div>
                  {analysisResult.description && (
                    <div style={{ fontSize: TYPOGRAPHY.fontSize.xs, color: COLORS.text.muted, marginTop: SPACING.xs }}>
                      {analysisResult.description}
                    </div>
                  )}
                </div>
              )}

              <div style={styles.countInput}>
                <span style={styles.countLabel}>Number of sprites:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={manualCount}
                  onChange={(e) => setManualCount(Math.max(1, parseInt(e.target.value) || 1))}
                  style={styles.countNumber}
                />
              </div>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button style={styles.button('secondary')} onClick={onClose}>
            Cancel
          </button>
          <button style={styles.button('primary')} onClick={handleConfirm}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
