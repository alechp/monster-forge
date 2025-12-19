/**
 * Name Generation Logic
 * 
 * Generates monster names based on element types and other characteristics.
 */

/**
 * Prefixes organized by element type
 */
export const NAME_PREFIXES = {
  Fire: ['Ember', 'Blaze', 'Pyro', 'Infern', 'Scorch', 'Cinder', 'Flare', 'Ignit'],
  Water: ['Aqua', 'Hydro', 'Tidal', 'Vapor', 'Splash', 'Coral', 'Marine', 'Torrent'],
  Earth: ['Terra', 'Geo', 'Rock', 'Quake', 'Granite', 'Clay', 'Boulder', 'Onyx'],
  Air: ['Zephyr', 'Gust', 'Aero', 'Breeze', 'Cyclone', 'Whisp', 'Storm', 'Gale'],
  Electric: ['Volt', 'Spark', 'Thunder', 'Zap', 'Surge', 'Amp', 'Shock', 'Plasma'],
  Shadow: ['Shade', 'Umbra', 'Nox', 'Dusk', 'Void', 'Murk', 'Phantom', 'Eclipse'],
  Light: ['Lux', 'Beam', 'Radiant', 'Sol', 'Gleam', 'Halo', 'Dawn', 'Prism'],
  Nature: ['Bloom', 'Fern', 'Sprout', 'Thorn', 'Moss', 'Leaf', 'Flora', 'Petal'],
  Ice: ['Frost', 'Cryo', 'Glace', 'Chill', 'Sleet', 'Rime', 'Blizz', 'Arctic'],
  Psychic: ['Mind', 'Psi', 'Mystic', 'Enigma', 'Oracle', 'Aura', 'Cosmic', 'Astral']
};

/**
 * Common suffixes for monster names
 */
export const NAME_SUFFIXES = [
  'on', 'ix', 'us', 'ara', 'eon', 'ite', 'ox', 'yn', 
  'or', 'ax', 'ion', 'ex', 'ius', 'ia', 'os', 'an'
];

/**
 * Suffixes for baby/juvenile forms
 */
export const BABY_SUFFIXES = ['let', 'ling', 'ito', 'ini', 'pup', 'kit', 'cub', 'kin'];

/**
 * Prefixes for final evolution forms
 */
export const POWER_PREFIXES = ['Mega', 'Ultra', 'Supreme', 'Arch', 'Prime', 'Neo', 'Omega', 'Alpha'];

/**
 * Generate a monster name based on element
 * @param {string} element - Primary element type
 * @param {string[]} suggestedNames - Names suggested by Claude Vision
 * @returns {string} Generated monster name
 */
export function generateName(element, suggestedNames = []) {
  // Use suggested names if available
  if (suggestedNames && suggestedNames.length > 0) {
    return suggestedNames[Math.floor(Math.random() * suggestedNames.length)];
  }

  const prefixes = NAME_PREFIXES[element] || NAME_PREFIXES.Psychic;
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];

  return prefix + suffix;
}

/**
 * Generate evolution variant name
 * @param {string} baseName - Base monster name
 * @param {number} level - Evolution level (1, 2, or 3)
 * @returns {string} Evolution name
 */
export function generateEvolutionName(baseName, level) {
  if (level === 1) {
    // Baby form - shorter/cuter version
    const suffix = BABY_SUFFIXES[Math.floor(Math.random() * BABY_SUFFIXES.length)];
    // Remove last 2-3 characters and add baby suffix
    const baseRoot = baseName.slice(0, -2);
    return baseRoot + suffix;
  } else if (level === 3) {
    // Final evolution - add power prefix
    const prefix = POWER_PREFIXES[Math.floor(Math.random() * POWER_PREFIXES.length)];
    return prefix + baseName;
  }
  
  // Level 2 - use base name as-is
  return baseName;
}

/**
 * Generate a completely random name (fallback)
 * @returns {string} Random monster name
 */
export function generateRandomName() {
  const consonants = 'bcdfghjklmnprstvwxz';
  const vowels = 'aeiou';
  
  let name = '';
  const length = Math.floor(Math.random() * 3) + 2; // 2-4 syllables
  
  for (let i = 0; i < length; i++) {
    name += consonants[Math.floor(Math.random() * consonants.length)];
    name += vowels[Math.floor(Math.random() * vowels.length)];
  }
  
  // Capitalize first letter
  name = name.charAt(0).toUpperCase() + name.slice(1);
  
  // Add a suffix
  const suffix = NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
  
  return name + suffix;
}

export default {
  generateName,
  generateEvolutionName,
  generateRandomName,
  NAME_PREFIXES,
  NAME_SUFFIXES,
  BABY_SUFFIXES,
  POWER_PREFIXES
};
