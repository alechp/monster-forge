/**
 * Theme Configuration
 * 
 * Color schemes, fonts, and styling constants for Monster Forge.
 */

/**
 * Element-specific color palettes
 */
export const ELEMENT_COLORS = {
  Fire: { primary: '#ff6b35', secondary: '#ff4500', glow: '#ff8c00' },
  Water: { primary: '#4a90d9', secondary: '#1e90ff', glow: '#00bfff' },
  Earth: { primary: '#8b7355', secondary: '#a0522d', glow: '#cd853f' },
  Air: { primary: '#87ceeb', secondary: '#00bfff', glow: '#e0ffff' },
  Electric: { primary: '#ffd700', secondary: '#ffff00', glow: '#fffacd' },
  Shadow: { primary: '#4a4a6a', secondary: '#663399', glow: '#9370db' },
  Light: { primary: '#fffacd', secondary: '#fafad2', glow: '#ffffe0' },
  Nature: { primary: '#228b22', secondary: '#32cd32', glow: '#90ee90' },
  Ice: { primary: '#b0e0e6', secondary: '#00ced1', glow: '#e0ffff' },
  Psychic: { primary: '#da70d6', secondary: '#ff00ff', glow: '#dda0dd' }
};

/**
 * Main application color palette
 */
export const COLORS = {
  // Background colors
  background: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    tertiary: '#0f3460',
    card: '#1f2940'
  },
  
  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#b0b0b0',
    muted: '#6c757d',
    accent: '#e94560'
  },
  
  // UI element colors
  ui: {
    border: '#3a3a5a',
    hover: '#2a2a4a',
    active: '#e94560',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#17a2b8'
  },
  
  // Stat bar colors
  stats: {
    hp: '#28a745',
    attack: '#dc3545',
    defense: '#ffc107',
    special: '#9370db',
    speed: '#17a2b8'
  }
};

/**
 * Typography settings
 */
export const TYPOGRAPHY = {
  fontFamily: {
    pixel: "'Press Start 2P', cursive",
    system: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    xxl: '24px',
    title: '32px'
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    bold: 700
  }
};

/**
 * Spacing scale
 */
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
};

/**
 * Border radius values
 */
export const BORDER_RADIUS = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  round: '50%'
};

/**
 * Shadow definitions
 */
export const SHADOWS = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 20px rgba(0, 0, 0, 0.5)',
  glow: (color) => `0 0 20px ${color}40`,
  inset: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
};

/**
 * Common component styles
 */
export const COMPONENT_STYLES = {
  card: {
    backgroundColor: COLORS.background.card,
    borderRadius: BORDER_RADIUS.md,
    border: `1px solid ${COLORS.ui.border}`,
    padding: SPACING.md
  },
  
  button: {
    primary: {
      backgroundColor: COLORS.ui.active,
      color: COLORS.text.primary,
      border: 'none',
      borderRadius: BORDER_RADIUS.sm,
      padding: `${SPACING.sm} ${SPACING.md}`,
      cursor: 'pointer',
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.sm
    },
    secondary: {
      backgroundColor: 'transparent',
      color: COLORS.text.primary,
      border: `1px solid ${COLORS.ui.border}`,
      borderRadius: BORDER_RADIUS.sm,
      padding: `${SPACING.sm} ${SPACING.md}`,
      cursor: 'pointer',
      fontFamily: TYPOGRAPHY.fontFamily.pixel,
      fontSize: TYPOGRAPHY.fontSize.sm
    }
  },
  
  input: {
    backgroundColor: COLORS.background.secondary,
    color: COLORS.text.primary,
    border: `1px solid ${COLORS.ui.border}`,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily.system,
    fontSize: TYPOGRAPHY.fontSize.md
  }
};

/**
 * Animation durations
 */
export const ANIMATIONS = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms'
};

/**
 * Breakpoints for responsive design
 */
export const BREAKPOINTS = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px'
};

/**
 * Get element color with fallback
 * @param {string} element - Element type
 * @param {string} variant - Color variant (primary, secondary, glow)
 * @returns {string} Color hex code
 */
export function getElementColor(element, variant = 'primary') {
  const colors = ELEMENT_COLORS[element] || ELEMENT_COLORS.Psychic;
  return colors[variant] || colors.primary;
}

export default {
  ELEMENT_COLORS,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  COMPONENT_STYLES,
  ANIMATIONS,
  BREAKPOINTS,
  getElementColor
};
