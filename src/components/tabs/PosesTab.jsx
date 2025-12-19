/**
 * PosesTab Component
 * 
 * Shows directional poses and animation frames.
 */

import React from 'react';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, SPACING } from '../../styles/theme';

export default function PosesTab({ monster }) {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING.lg
    },
    section: {
      backgroundColor: COLORS.background.card,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      border: `1px solid ${COLORS.ui.border}`
    },
    sectionTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.secondary,
      marginBottom: SPACING.md,
      textTransform: 'uppercase'
    },
    posesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: SPACING.md
    },
    poseCard: {
      textAlign: 'center'
    },
    sprite: {
      width: '80px',
      height: '80px',
      imageRendering: 'pixelated',
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: COLORS.background.secondary,
      border: `1px solid ${COLORS.ui.border}`,
      marginBottom: SPACING.xs
    },
    placeholder: {
      width: '80px',
      height: '80px',
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: COLORS.background.secondary,
      border: `2px dashed ${COLORS.ui.border}`,
      marginBottom: SPACING.xs,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: COLORS.text.muted,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs
    },
    poseLabel: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary
    },
    animationsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: SPACING.md
    },
    animCard: {
      textAlign: 'center',
      padding: SPACING.sm,
      backgroundColor: COLORS.background.secondary,
      borderRadius: BORDER_RADIUS.sm
    },
    framesRow: {
      display: 'flex',
      justifyContent: 'center',
      gap: SPACING.xs,
      marginBottom: SPACING.sm
    },
    frame: {
      width: '48px',
      height: '48px',
      imageRendering: 'pixelated',
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: COLORS.background.tertiary,
      border: `1px solid ${COLORS.ui.border}`
    },
    animLabel: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary
    },
    fps: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.muted,
      marginTop: SPACING.xs
    },
    status: (generated) => ({
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: generated ? COLORS.ui.success : COLORS.text.muted,
      marginTop: SPACING.xs
    })
  };

  const poses = monster.poses || {};
  const animations = monster.animations || {};

  return (
    <div style={styles.container}>
      {/* Directional Poses */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Directional Poses</div>
        
        <div style={styles.posesGrid}>
          {['front', 'back', 'left', 'right'].map((direction) => (
            <div key={direction} style={styles.poseCard}>
              {poses[direction]?.generated ? (
                <img
                  src={poses[direction].sprite}
                  alt={`${monster.name} ${direction}`}
                  style={styles.sprite}
                />
              ) : (
                <div style={styles.placeholder}>
                  {poses[direction]?.sprite ? (
                    <img
                      src={poses[direction].sprite}
                      alt={`${monster.name} ${direction}`}
                      style={{ ...styles.sprite, opacity: 0.5, border: 'none' }}
                    />
                  ) : (
                    '?'
                  )}
                </div>
              )}
              <div style={styles.poseLabel}>
                {direction.charAt(0).toUpperCase() + direction.slice(1)}
              </div>
              <div style={styles.status(poses[direction]?.generated)}>
                {poses[direction]?.generated ? 'Generated' : 'Placeholder'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Animation Sets */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Animation Sets</div>
        
        <div style={styles.animationsGrid}>
          {Object.entries(animations).map(([name, anim]) => (
            <div key={name} style={styles.animCard}>
              <div style={styles.framesRow}>
                {anim.frames.slice(0, 4).map((frame, idx) => (
                  <img
                    key={idx}
                    src={frame}
                    alt={`${name} frame ${idx}`}
                    style={{
                      ...styles.frame,
                      opacity: anim.generated ? 1 : 0.5
                    }}
                  />
                ))}
              </div>
              <div style={styles.animLabel}>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </div>
              <div style={styles.fps}>{anim.fps} FPS</div>
              <div style={styles.status(anim.generated)}>
                {anim.generated ? 'Generated' : 'Placeholder'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
