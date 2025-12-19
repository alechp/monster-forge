/**
 * GenerateTab Component
 * 
 * Interface for generating new sprite variants using Nano Banana API.
 */

import React, { useState } from 'react';
import { COLORS, BORDER_RADIUS, TYPOGRAPHY, SPACING } from '../../styles/theme';
import NanoBananaService from '../../services/nanoBanana';

export default function GenerateTab({ monster, onUpdate }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({
    poses: true,
    evolutions: true,
    shiny: false
  });

  const nanoBanana = new NanoBananaService();

  const handleGenerate = async () => {
    setGenerating(true);
    const description = monster.analysis?.visualDescription || monster.name;
    
    try {
      const updates = { ...monster };

      if (selectedOptions.poses) {
        setProgress('Generating poses...');
        const poses = await nanoBanana.generateAllPoses(description, monster.baseSprite);
        
        updates.poses = {
          front: { sprite: poses.front || monster.baseSprite, generated: !!poses.front },
          back: { sprite: poses.back || monster.baseSprite, generated: !!poses.back },
          left: { sprite: poses.left || monster.baseSprite, generated: !!poses.left },
          right: { sprite: poses.right || monster.baseSprite, generated: !!poses.right }
        };
      }

      if (selectedOptions.evolutions) {
        setProgress('Generating evolutions...');
        const evoSprites = await nanoBanana.generateEvolutions(description, monster.baseSprite);
        
        if (monster.evolutions && Array.isArray(monster.evolutions)) {
          updates.evolutions = monster.evolutions.map((evo, idx) => ({
            ...evo,
            sprite: evoSprites[idx] || evo.sprite
          }));
        }
      }

      if (selectedOptions.shiny) {
        setProgress('Generating shiny variant...');
        const shiny = await nanoBanana.generateSprite(description, 'shiny', monster.baseSprite);
        updates.shinySprite = shiny;
      }

      onUpdate(updates);
      setProgress('Generation complete!');
    } catch (error) {
      console.error('Generation failed:', error);
      setProgress(`Error: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING.md,
      maxWidth: '600px'
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
    description: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary,
      marginBottom: SPACING.md,
      lineHeight: 1.5
    },
    optionRow: {
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
      marginBottom: SPACING.sm
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer'
    },
    optionLabel: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.primary,
      cursor: 'pointer'
    },
    optionDesc: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.muted,
      marginLeft: '26px',
      marginBottom: SPACING.sm
    },
    button: {
      backgroundColor: generating ? COLORS.ui.border : COLORS.ui.active,
      color: COLORS.text.primary,
      border: 'none',
      borderRadius: BORDER_RADIUS.sm,
      padding: `${SPACING.sm} ${SPACING.lg}`,
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.sm,
      cursor: generating ? 'wait' : 'pointer',
      opacity: generating ? 0.7 : 1
    },
    progress: {
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.text.secondary,
      marginTop: SPACING.md
    },
    warning: {
      backgroundColor: `${COLORS.ui.warning}20`,
      border: `1px solid ${COLORS.ui.warning}`,
      borderRadius: BORDER_RADIUS.sm,
      padding: SPACING.md,
      fontFamily: TYPOGRAPHY.fontFamily.system,
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.ui.warning
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.title}>Generate Sprite Variants</div>
        <div style={styles.description}>
          Use the Nano Banana (Google Gemini) API to generate additional sprite variants
          based on the original sprite and its analysis.
        </div>

        <div style={styles.optionRow}>
          <input
            type="checkbox"
            id="poses"
            checked={selectedOptions.poses}
            onChange={(e) => setSelectedOptions(prev => ({ ...prev, poses: e.target.checked }))}
            style={styles.checkbox}
            disabled={generating}
          />
          <label htmlFor="poses" style={styles.optionLabel}>
            Directional Poses (4 variants)
          </label>
        </div>
        <div style={styles.optionDesc}>
          Front, back, left, and right facing sprites
        </div>

        <div style={styles.optionRow}>
          <input
            type="checkbox"
            id="evolutions"
            checked={selectedOptions.evolutions}
            onChange={(e) => setSelectedOptions(prev => ({ ...prev, evolutions: e.target.checked }))}
            style={styles.checkbox}
            disabled={generating}
          />
          <label htmlFor="evolutions" style={styles.optionLabel}>
            Evolution Sprites (3 variants)
          </label>
        </div>
        <div style={styles.optionDesc}>
          Baby, adult, and final evolution forms
        </div>

        <div style={styles.optionRow}>
          <input
            type="checkbox"
            id="shiny"
            checked={selectedOptions.shiny}
            onChange={(e) => setSelectedOptions(prev => ({ ...prev, shiny: e.target.checked }))}
            style={styles.checkbox}
            disabled={generating}
          />
          <label htmlFor="shiny" style={styles.optionLabel}>
            Shiny Variant (1 variant)
          </label>
        </div>
        <div style={styles.optionDesc}>
          Alternate color palette version
        </div>

        <button
          style={styles.button}
          onClick={handleGenerate}
          disabled={generating || (!selectedOptions.poses && !selectedOptions.evolutions && !selectedOptions.shiny)}
        >
          {generating ? 'Generating...' : 'Generate Sprites'}
        </button>

        {progress && (
          <div style={styles.progress}>{progress}</div>
        )}
      </div>

      <div style={styles.warning}>
        Note: Generation requires a valid Google API key configured in your environment.
        Each generation may take several seconds due to API rate limits.
      </div>
    </div>
  );
}
