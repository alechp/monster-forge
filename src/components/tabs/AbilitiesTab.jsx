/**
 * AbilitiesTab Component
 * 
 * Shows monster abilities for each evolution stage.
 */

import React, { useState } from 'react';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, SPACING, ELEMENT_COLORS } from '../../styles/theme';

export default function AbilitiesTab({ monster }) {
  const [selectedEvo, setSelectedEvo] = useState(1);

  // Guard against missing data
  if (!monster) {
    return <div style={{ padding: '20px', color: '#999' }}>No monster selected</div>;
  }

  const evolutions = monster.evolutions || [];
  const currentEvo = evolutions[selectedEvo] || evolutions[0] || {};
  const abilities = currentEvo?.abilities || [];

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING.md
    },
    evoSelector: {
      display: 'flex',
      gap: SPACING.sm
    },
    evoButton: (isActive) => ({
      padding: `${SPACING.sm} ${SPACING.md}`,
      backgroundColor: isActive ? COLORS.ui.active : COLORS.background.card,
      color: COLORS.text.primary,
      border: `1px solid ${isActive ? COLORS.ui.active : COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      cursor: 'pointer'
    }),
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: SPACING.md
    },
    card: {
      backgroundColor: COLORS.background.card,
      borderRadius: BORDER_RADIUS.md,
      padding: SPACING.md,
      border: `1px solid ${COLORS.ui.border}`
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm
    },
    name: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.primary
    },
    typeBadge: (element) => ({
      padding: `${SPACING.xs} ${SPACING.sm}`,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: `${ELEMENT_COLORS[element]?.primary || COLORS.ui.border}30`,
      color: ELEMENT_COLORS[element]?.primary || COLORS.text.secondary,
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs
    }),
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: SPACING.sm,
      marginBottom: SPACING.sm
    },
    stat: {
      textAlign: 'center'
    },
    statLabel: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.muted,
      marginBottom: '2px'
    },
    statValue: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.primary
    },
    effect: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary,
      fontStyle: 'italic',
      marginTop: SPACING.sm,
      padding: SPACING.sm,
      backgroundColor: COLORS.background.secondary,
      borderRadius: BORDER_RADIUS.sm
    },
    empty: {
      textAlign: 'center',
      padding: SPACING.xl,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.muted
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.evoSelector}>
        {evolutions.map((evo, idx) => (
          <button
            key={idx}
            style={styles.evoButton(selectedEvo === idx)}
            onClick={() => setSelectedEvo(idx)}
          >
            {evo.name} (Lv.{evo.level})
          </button>
        ))}
      </div>

      {abilities.length === 0 ? (
        <div style={styles.empty}>
          No abilities available for this evolution
        </div>
      ) : (
        <div style={styles.grid}>
          {abilities.map((ability, idx) => (
            <div key={idx} style={styles.card}>
              <div style={styles.header}>
                <span style={styles.name}>{ability.name}</span>
                <span style={styles.typeBadge(ability.type)}>{ability.type}</span>
              </div>
              
              <div style={styles.stats}>
                <div style={styles.stat}>
                  <div style={styles.statLabel}>Power</div>
                  <div style={styles.statValue}>{ability.power}</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statLabel}>Accuracy</div>
                  <div style={styles.statValue}>{ability.accuracy}%</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statLabel}>PP</div>
                  <div style={styles.statValue}>{ability.pp}</div>
                </div>
              </div>

              {ability.effect && (
                <div style={styles.effect}>
                  {ability.effect}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
