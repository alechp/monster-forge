/**
 * OverviewTab Component
 * 
 * Shows monster overview with stats and basic info.
 */

import React from 'react';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, SPACING } from '../../styles/theme';

export default function OverviewTab({ monster }) {
  // Guard against missing data
  if (!monster) {
    return <div style={{ padding: '20px', color: '#999' }}>No monster selected</div>;
  }

  // Get current evolution (middle stage by default)
  const evolutions = monster.evolutions || [];
  const currentEvo = evolutions[1] || evolutions[0] || {};

  const styles = {
    container: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: SPACING.md
    },
    card: {
      backgroundColor: COLORS.background.card,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      border: `1px solid ${COLORS.ui.border}`
    },
    cardTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.secondary,
      marginBottom: SPACING.sm,
      textTransform: 'uppercase'
    },
    statRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: SPACING.sm
    },
    statLabel: {
      width: '80px',
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary
    },
    statBar: {
      flex: 1,
      height: '12px',
      backgroundColor: COLORS.background.secondary,
      borderRadius: BORDER_RADIUS.sm,
      overflow: 'hidden',
      marginRight: SPACING.sm
    },
    statFill: (stat, value) => ({
      height: '100%',
      width: `${Math.min(value, 150) / 1.5}%`,
      backgroundColor: COLORS.stats[stat] || COLORS.ui.active,
      borderRadius: BORDER_RADIUS.sm,
      transition: 'width 0.3s ease'
    }),
    statValue: {
      width: '30px',
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.primary,
      textAlign: 'right'
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: SPACING.xs,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm
    },
    infoLabel: {
      color: COLORS.text.secondary
    },
    infoValue: {
      color: COLORS.text.primary
    },
    lore: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary,
      lineHeight: 1.6,
      fontStyle: 'italic'
    },
    description: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.primary,
      lineHeight: 1.5
    },
    fullWidth: {
      gridColumn: '1 / -1'
    }
  };

  const stats = currentEvo?.stats || {};

  return (
    <div style={styles.container}>
      {/* Stats Card */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Base Stats</div>
        
        {['hp', 'attack', 'defense', 'special', 'speed'].map((stat) => (
          <div key={stat} style={styles.statRow}>
            <div style={styles.statLabel}>
              {stat.toUpperCase()}
            </div>
            <div style={styles.statBar}>
              <div style={styles.statFill(stat, stats[stat] || 0)} />
            </div>
            <div style={styles.statValue}>
              {stats[stat] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Details</div>
        
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Type</span>
          <span style={styles.infoValue}>{monster.creatureType}</span>
        </div>
        
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Size</span>
          <span style={styles.infoValue}>{monster.sizeClass}</span>
        </div>
        
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Catch Rate</span>
          <span style={styles.infoValue}>{monster.catchRate}</span>
        </div>
        
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Base Exp</span>
          <span style={styles.infoValue}>{monster.baseExp}</span>
        </div>
        
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Gender Ratio</span>
          <span style={styles.infoValue}>
            {!monster.genderRatio ? 'Unknown' :
              monster.genderRatio.male === 0 && monster.genderRatio.female === 0
              ? 'Genderless'
              : `${Math.round((monster.genderRatio.male || 0) * 100)}% M / ${Math.round((monster.genderRatio.female || 0) * 100)}% F`
            }
          </span>
        </div>
      </div>

      {/* Description Card */}
      <div style={{ ...styles.card, ...styles.fullWidth }}>
        <div style={styles.cardTitle}>Analysis</div>
        <div style={styles.description}>
          {monster.analysis?.visualDescription || 'No description available'}
        </div>
      </div>

      {/* Lore Card */}
      <div style={{ ...styles.card, ...styles.fullWidth }}>
        <div style={styles.cardTitle}>Lore</div>
        <div style={styles.lore}>
          {currentEvo?.lore || 'No lore available'}
        </div>
      </div>
    </div>
  );
}
