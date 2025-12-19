/**
 * Element Type Definitions
 * 
 * Defines all element types for the Monster Forge system
 * with their properties and relationships.
 */

export const ELEMENT_TYPES = [
  'Fire',
  'Water', 
  'Earth',
  'Air',
  'Electric',
  'Shadow',
  'Light',
  'Nature',
  'Ice',
  'Psychic'
];

export const ELEMENT_CONFIG = {
  Fire: {
    name: 'Fire',
    strengths: ['Nature', 'Ice'],
    weaknesses: ['Water', 'Earth'],
    description: 'Masters of flame and heat'
  },
  Water: {
    name: 'Water',
    strengths: ['Fire', 'Earth'],
    weaknesses: ['Electric', 'Nature'],
    description: 'Controllers of tides and currents'
  },
  Earth: {
    name: 'Earth',
    strengths: ['Electric', 'Fire'],
    weaknesses: ['Water', 'Nature'],
    description: 'Sturdy guardians of stone and soil'
  },
  Air: {
    name: 'Air',
    strengths: ['Earth', 'Nature'],
    weaknesses: ['Electric', 'Ice'],
    description: 'Swift riders of wind and storm'
  },
  Electric: {
    name: 'Electric',
    strengths: ['Water', 'Air'],
    weaknesses: ['Earth', 'Shadow'],
    description: 'Crackling wielders of lightning'
  },
  Shadow: {
    name: 'Shadow',
    strengths: ['Psychic', 'Light'],
    weaknesses: ['Light', 'Fire'],
    description: 'Lurkers in darkness and void'
  },
  Light: {
    name: 'Light',
    strengths: ['Shadow', 'Psychic'],
    weaknesses: ['Shadow', 'Earth'],
    description: 'Radiant bringers of illumination'
  },
  Nature: {
    name: 'Nature',
    strengths: ['Water', 'Earth'],
    weaknesses: ['Fire', 'Ice'],
    description: 'Living embodiments of growth'
  },
  Ice: {
    name: 'Ice',
    strengths: ['Air', 'Nature'],
    weaknesses: ['Fire', 'Electric'],
    description: 'Frozen masters of frost'
  },
  Psychic: {
    name: 'Psychic',
    strengths: ['Shadow', 'Electric'],
    weaknesses: ['Shadow', 'Light'],
    description: 'Mysterious wielders of mental power'
  }
};

export const CREATURE_TYPES = [
  'beast',
  'dragon',
  'elemental',
  'spirit',
  'construct',
  'plant',
  'aquatic',
  'avian',
  'insectoid',
  'mythical'
];

export const SIZE_CLASSES = [
  'tiny',
  'small',
  'medium',
  'large',
  'massive'
];

export const BODY_SHAPES = [
  'bipedal',
  'quadruped',
  'serpentine',
  'amorphous',
  'winged',
  'floating'
];

/**
 * Map dominant colors to likely element types
 */
export function colorToElement(colors) {
  const colorMap = {
    red: 'Fire',
    orange: 'Fire',
    blue: 'Water',
    cyan: 'Ice',
    green: 'Nature',
    brown: 'Earth',
    yellow: 'Electric',
    purple: 'Psychic',
    pink: 'Psychic',
    white: 'Light',
    black: 'Shadow',
    gray: 'Earth'
  };

  if (!colors || colors.length === 0) {
    console.log('[colorToElement] No colors provided, defaulting to Psychic');
    return 'Psychic';
  }

  // Try each color in order until we find a match
  for (const color of colors) {
    if (colorMap[color]) {
      console.log('[colorToElement] Mapped', colors, 'to', colorMap[color]);
      return colorMap[color];
    }
  }

  console.log('[colorToElement] No match for', colors, ', defaulting to Psychic');
  return 'Psychic';
}

export default ELEMENT_CONFIG;
