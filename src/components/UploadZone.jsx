/**
 * UploadZone Component
 * 
 * Drag & drop area for uploading sprite images/sheets.
 */

import React, { useCallback, useState } from 'react';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, SPACING } from '../styles/theme';

export default function UploadZone({ onUpload, processing }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(f => f.type.startsWith('image/'));
    
    if (imageFile) {
      onUpload(imageFile);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  }, [onUpload]);

  const styles = {
    container: {
      border: `2px dashed ${isDragging ? COLORS.ui.active : COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.lg,
      padding: SPACING.xl,
      textAlign: 'center',
      backgroundColor: isDragging ? `${COLORS.ui.active}10` : 'transparent',
      transition: 'all 0.3s ease',
      cursor: processing ? 'wait' : 'pointer'
    },
    title: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.md,
      color: COLORS.text.primary,
      marginBottom: SPACING.sm
    },
    subtitle: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary,
      marginBottom: SPACING.md
    },
    input: {
      display: 'none'
    },
    button: {
      backgroundColor: COLORS.ui.active,
      color: COLORS.text.primary,
      border: 'none',
      borderRadius: BORDER_RADIUS.sm,
      padding: `${SPACING.sm} ${SPACING.md}`,
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.sm,
      cursor: 'pointer',
      opacity: processing ? 0.5 : 1
    },
    formats: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.muted,
      marginTop: SPACING.md
    }
  };

  return (
    <div
      style={styles.container}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div style={styles.title}>
        {processing ? 'Processing...' : 'Drop Sprite Here'}
      </div>
      <div style={styles.subtitle}>
        or click to browse
      </div>
      
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={styles.input}
        id="sprite-upload"
        disabled={processing}
      />
      
      <label htmlFor="sprite-upload">
        <span style={styles.button}>
          Select Image
        </span>
      </label>
      
      <div style={styles.formats}>
        Supports PNG, JPG, GIF (single sprites or sprite sheets)
      </div>
    </div>
  );
}
