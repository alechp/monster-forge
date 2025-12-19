/**
 * EvolutionsTab Component
 * 
 * Shows evolution chain with sprites and stats comparison.
 */

import React from 'react';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, SPACING, ELEMENT_COLORS } from '../../styles/theme';

export default function EvolutionsTab({ monster }) {
  // Guard against missing data
  if (!monster) {
    return <div style={{ padding: '20px', color: '#999' }}>No monster selected</div>;
  }

  const evolutions = monster.evolutions || [];

  if (evolutions.length === 0) {
    return <div style={{ padding: '20px', color: '#999' }}>No evolution data available</div>;
  }

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING.lg
    },
    chain: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.md,
      flexWrap: 'wrap'
    },
    evoCard: {
      backgroundColor: COLORS.background.card,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      border: `1px solid ${COLORS.ui.border}`,
      textAlign: 'center',
      minWidth: '180px'
    },
    sprite: {
      width: '96px',
      height: '96px',
      imageRendering: 'pixelated',
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: COLORS.background.secondary,
      border: `2px solid ${ELEMENT_COLORS[monster.primaryElement]?.primary || COLORS.ui.border}`,
      marginBottom: SPACING.sm
    },
    placeholder: {
      width: '96px',
      height: '96px',
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: COLORS.background.secondary,
      border: `2px dashed ${COLORS.ui.border}`,
      marginBottom: SPACING.sm,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: COLORS.text.muted,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs
    },
    name: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.primary,
      marginBottom: SPACING.xs
    },
    level: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.secondary
    },
    arrow: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xl,
      color: COLORS.ui.active
    },
    statsComparison: {
      backgroundColor: COLORS.background.card,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      border: `1px solid ${COLORS.ui.border}`
    },
    statsTitle: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.secondary,
      marginBottom: SPACING.md,
      textTransform: 'uppercase'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: '80px repeat(3, 1fr)',
      gap: SPACING.sm
    },
    statsHeader: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.secondary,
      textAlign: 'center'
    },
    statLabel: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary
    },
    statValue: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.primary,
      textAlign: 'center'
    },
    statIncrease: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.ui.success,
      textAlign: 'center'
    }
  };

  const statNames = ['hp', 'attack', 'defense', 'special', 'speed'];

  return (
    <div style={styles.container}>
      {/* Evolution Chain */}
      <div style={styles.chain}>
        {evolutions.map((evo, idx) => (
          <React.Fragment key={idx}>
            <div style={styles.evoCard}>
              <img
                src={evo.sprite || monster.baseSprite}
                alt={evo.name}
                style={{
                  ...styles.sprite,
                  opacity: evo.sprite ? 1 : 0.6
                }}
              />
              <div style={styles.name}>{evo.name}</div>
              <div style={styles.level}>
                {idx === 0 ? 'Base Form' : `Evolves at Lv.${evo.level}`}
              </div>
            </div>
            
            {idx < evolutions.length - 1 && (
              <div style={styles.arrow}>→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Stats Comparison */}
      <div style={styles.statsComparison}>
        <div style={styles.statsTitle}>Stats by Evolution</div>
        
        <div style={styles.statsGrid}>
          <div></div>
          {evolutions.map((evo, idx) => (
            <div key={idx} style={styles.statsHeader}>
              {evo.name}
            </div>
          ))}
          
          {statNames.map((stat) => (
            <React.Fragment key={stat}>
              <div style={styles.statLabel}>{stat.toUpperCase()}</div>
              {evolutions.map((evo, idx) => (
                <div 
                  key={idx} 
                  style={idx > 0 ? styles.statIncrease : styles.statValue}
                >
                  {evo.stats?.[stat] || 0}
                  {idx > 0 && evolutions[idx - 1]?.stats && (
                    <span style={{ fontSize: TYPOGRAPHY.fontSize.xs, marginLeft: '4px' }}>
                      (+{(evo.stats?.[stat] || 0) - (evolutions[idx - 1].stats?.[stat] || 0)})
                    </span>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
