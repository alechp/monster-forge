/**
 * MonsterDetail Component
 * 
 * Main detail view for selected monster with tabbed interface.
 */

import React, { useState } from 'react';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, SPACING, ELEMENT_COLORS } from '../styles/theme';

// Tab components
import OverviewTab from './tabs/OverviewTab';
import AbilitiesTab from './tabs/AbilitiesTab';
import EvolutionsTab from './tabs/EvolutionsTab';
import PosesTab from './tabs/PosesTab';
import GenerateTab from './tabs/GenerateTab';
import ExportTab from './tabs/ExportTab';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'evolutions', label: 'Evolutions' },
  { id: 'poses', label: 'Poses' },
  { id: 'generate', label: 'Generate' },
  { id: 'export', label: 'Export' }
];

export default function MonsterDetail({ monster, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');

  const styles = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    },
    header: {
      padding: SPACING.md,
      borderBottom: `1px solid ${COLORS.ui.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.md
    },
    sprite: {
      width: '80px',
      height: '80px',
      imageRendering: 'pixelated',
      borderRadius: BORDER_RADIUS.md,
      backgroundColor: COLORS.background.tertiary,
      border: `2px solid ${ELEMENT_COLORS[monster?.primaryElement]?.primary || COLORS.ui.border}`,
      boxShadow: `0 0 20px ${ELEMENT_COLORS[monster?.primaryElement]?.glow || 'transparent'}40`
    },
    info: {
      flex: 1
    },
    name: {
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.lg,
      color: COLORS.text.primary,
      marginBottom: SPACING.xs
    },
    elements: {
      display: 'flex',
      gap: SPACING.sm
    },
    elementBadge: (element) => ({
      padding: `${SPACING.xs} ${SPACING.sm}`,
      borderRadius: BORDER_RADIUS.sm,
      backgroundColor: `${ELEMENT_COLORS[element]?.primary || COLORS.ui.border}30`,
      color: ELEMENT_COLORS[element]?.primary || COLORS.text.secondary,
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      border: `1px solid ${ELEMENT_COLORS[element]?.primary || COLORS.ui.border}`
    }),
    tabs: {
      display: 'flex',
      borderBottom: `1px solid ${COLORS.ui.border}`,
      backgroundColor: COLORS.background.secondary
    },
    tab: (isActive) => ({
      padding: `${SPACING.sm} ${SPACING.md}`,
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: isActive ? COLORS.ui.active : COLORS.text.secondary,
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: isActive ? `2px solid ${COLORS.ui.active}` : '2px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }),
    content: {
      flex: 1,
      overflow: 'auto',
      padding: SPACING.md
    },
    empty: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.md,
      color: COLORS.text.muted
    }
  };

  if (!monster) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          Select a monster from the library or upload a new sprite
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab monster={monster} />;
      case 'abilities':
        return <AbilitiesTab monster={monster} />;
      case 'evolutions':
        return <EvolutionsTab monster={monster} />;
      case 'poses':
        return <PosesTab monster={monster} />;
      case 'generate':
        return <GenerateTab monster={monster} onUpdate={onUpdate} />;
      case 'export':
        return <ExportTab monster={monster} />;
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <img
          src={monster.baseSprite}
          alt={monster.name}
          style={styles.sprite}
        />
        <div style={styles.info}>
          <div style={styles.name}>{monster.name}</div>
          <div style={styles.elements}>
            <span style={styles.elementBadge(monster.primaryElement)}>
              {monster.primaryElement}
            </span>
            {monster.secondaryElement && (
              <span style={styles.elementBadge(monster.secondaryElement)}>
                {monster.secondaryElement}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            style={styles.tab(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {renderTabContent()}
      </div>
    </div>
  );
}
