/**
 * MonsterLibrary Component
 * 
 * Left sidebar showing list of processed monsters.
 */

import React from 'react';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, SPACING, ELEMENT_COLORS } from '../styles/theme';

export default function MonsterLibrary({ monsters, selectedMonster, onSelect }) {
  const styles = {
    container: {
      width: '250px',
      backgroundColor: COLORS.background.secondary,
      borderRight: `1px solid ${COLORS.ui.border}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    },
    header: {
      padding: SPACING.md,
      borderBottom: `1px solid ${COLORS.ui.border}`,
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.primary
    },
    list: {
      flex: 1,
      overflowY: 'auto',
      padding: SPACING.sm
    },
    item: (isSelected, element) => ({
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: isSelected ? `${COLORS.ui.active}30` : 'transparent',
      border: isSelected 
        ? `1px solid ${COLORS.ui.active}` 
        : `1px solid transparent`,
      cursor: 'pointer',
      marginBottom: SPACING.xs,
      transition: 'all 0.2s ease',
      ':hover': {
        backgroundColor: COLORS.ui.hover
      }
    }),
    sprite: {
      width: '40px',
      height: '40px',
      imageRendering: 'pixelated',
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: COLORS.background.tertiary
    },
    info: {
      flex: 1,
      minWidth: 0
    },
    name: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.primary,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    element: (element) => ({
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: ELEMENT_COLORS[element]?.primary || COLORS.text.secondary,
      marginTop: '2px'
    }),
    empty: {
      padding: SPACING.lg,
      textAlign: 'center',
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.muted
    },
    count: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.muted,
      marginLeft: SPACING.sm
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        Monster Library
        <span style={styles.count}>({monsters.length})</span>
      </div>
      
      <div style={styles.list}>
        {monsters.length === 0 ? (
          <div style={styles.empty}>
            No monsters yet.<br/>
            Upload a sprite to get started!
          </div>
        ) : (
          monsters.map((monster) => (
            <div
              key={monster.id}
              style={styles.item(selectedMonster?.id === monster.id, monster.primaryElement)}
              onClick={() => onSelect(monster)}
            >
              <img
                src={monster.baseSprite}
                alt={monster.name}
                style={styles.sprite}
              />
              <div style={styles.info}>
                <div style={styles.name}>{monster.name}</div>
                <div style={styles.element(monster.primaryElement)}>
                  {monster.primaryElement}
                  {monster.secondaryElement && ` / ${monster.secondaryElement}`}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
