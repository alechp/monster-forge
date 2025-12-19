/**
 * Monster Data Generator
 * 
 * Generates:
 * - Names (base + evolution variants)
 * - Stats (scaled by evolution level)
 * - Abilities (element-appropriate)
 * - Lore/descriptions
 */

import { ABILITY_DATABASE } from '../data/abilities';
import { ELEMENT_CONFIG } from '../data/elements';

export class DataGenerator {
  
  /**
   * Generate complete monster data from analysis
   */
  generateMonster(spriteBase64, analysis, index) {
    const baseName = this.generateName(analysis);
    
    return {
      id: `monster_${Date.now()}_${index}`,
      name: baseName,
      analysis: analysis,
      baseSprite: spriteBase64,
      primaryElement: analysis.primaryElement || 'Psychic',
      secondaryElement: analysis.secondaryElement,
      creatureType: analysis.creatureType || 'beast',
      sizeClass: analysis.sizeClass || 'medium',
      evolutions: this.generateEvolutions(baseName, analysis),
      poses: this.generatePosePlaceholders(spriteBase64),
      animations: this.generateAnimationPlaceholders(spriteBase64),
      catchRate: this.randomRange(55, 255),
      baseExp: this.randomRange(50, 200),
      genderRatio: this.generateGenderRatio(),
      eggGroups: [analysis.creatureType || 'monster']
    };
  }

  /**
   * Generate monster name from analysis
   */
  generateName(analysis) {
    // Use suggested names if available
    if (analysis.suggestedNames?.length > 0) {
      return analysis.suggestedNames[
        Math.floor(Math.random() * analysis.suggestedNames.length)
      ];
    }

    // Generate from element + suffix
    const prefixes = {
      Fire: ['Ember', 'Blaze', 'Pyro', 'Infern', 'Scorch', 'Cinder'],
      Water: ['Aqua', 'Hydro', 'Tidal', 'Vapor', 'Splash', 'Coral'],
      Earth: ['Terra', 'Geo', 'Rock', 'Quake', 'Granite', 'Clay'],
      Air: ['Zephyr', 'Gust', 'Aero', 'Breeze', 'Cyclone', 'Whisp'],
      Electric: ['Volt', 'Spark', 'Thunder', 'Zap', 'Surge', 'Amp'],
      Shadow: ['Shade', 'Umbra', 'Nox', 'Dusk', 'Void', 'Murk'],
      Light: ['Lux', 'Beam', 'Radiant', 'Sol', 'Gleam', 'Halo'],
      Nature: ['Bloom', 'Fern', 'Sprout', 'Thorn', 'Moss', 'Leaf'],
      Ice: ['Frost', 'Cryo', 'Glace', 'Chill', 'Sleet', 'Rime'],
      Psychic: ['Mind', 'Psi', 'Mystic', 'Enigma', 'Oracle', 'Aura']
    };

    const suffixes = ['on', 'ix', 'us', 'ara', 'eon', 'ite', 'ox', 'yn', 'or', 'ax'];

    const element = analysis.primaryElement || 'Psychic';
    const prefixList = prefixes[element] || prefixes.Psychic;
    const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return prefix + suffix;
  }

  /**
   * Generate evolution chain
   */
  generateEvolutions(baseName, analysis) {
    const levels = [1, 16, 36];
    
    return levels.map((level, idx) => {
      const evoLevel = idx + 1;
      const evoName = this.generateEvolutionName(baseName, evoLevel);
      
      return {
        level: level,
        name: evoName,
        sprite: null, // Filled by Nano Banana generation
        stats: this.generateStats(evoLevel, analysis),
        abilities: this.generateAbilities(analysis.primaryElement, evoLevel, analysis.secondaryElement),
        lore: this.generateLore(evoName, analysis, evoLevel)
      };
    });
  }

  /**
   * Generate evolution variant names
   */
  generateEvolutionName(baseName, level) {
    if (level === 1) {
      const babySuffixes = ['let', 'ling', 'ito', 'ini', 'pup', 'kit'];
      return baseName.slice(0, -2) + babySuffixes[Math.floor(Math.random() * babySuffixes.length)];
    } else if (level === 3) {
      const powerPrefixes = ['Mega', 'Ultra', 'Supreme', 'Arch', 'Prime', 'Neo'];
      return powerPrefixes[Math.floor(Math.random() * powerPrefixes.length)] + baseName;
    }
    return baseName;
  }

  /**
   * Generate stats for an evolution level
   */
  generateStats(evolutionLevel, analysis) {
    const sizeMultiplier = {
      tiny: 0.7,
      small: 0.85,
      medium: 1.0,
      large: 1.15,
      massive: 1.3
    }[analysis.sizeClass] || 1.0;

    const typeBonus = {
      beast: { attack: 10, speed: 5 },
      dragon: { attack: 15, special: 10 },
      elemental: { special: 15, defense: 5 },
      spirit: { special: 10, speed: 10 },
      construct: { defense: 20, hp: 10 },
      plant: { defense: 10, hp: 15 },
      aquatic: { hp: 10, special: 10 },
      avian: { speed: 20, attack: 5 },
      insectoid: { speed: 15, defense: 10 },
      mythical: { special: 15, attack: 10 }
    }[analysis.creatureType] || {};

    const base = 25 + (evolutionLevel * 25);

    return {
      hp: Math.floor((base + (typeBonus.hp || 0) + this.randomRange(0, 20)) * sizeMultiplier),
      attack: Math.floor((base + (typeBonus.attack || 0) + this.randomRange(0, 20)) * sizeMultiplier),
      defense: Math.floor((base + (typeBonus.defense || 0) + this.randomRange(0, 20)) * sizeMultiplier),
      special: Math.floor((base + (typeBonus.special || 0) + this.randomRange(0, 20)) * sizeMultiplier),
      speed: Math.floor((base + (typeBonus.speed || 0) + this.randomRange(0, 20)) * sizeMultiplier)
    };
  }

  /**
   * Generate abilities for an evolution level
   */
  generateAbilities(primaryElement, evolutionLevel, secondaryElement = null) {
    const abilities = [];
    const count = evolutionLevel === 1 ? 2 : evolutionLevel === 2 ? 4 : 6;

    const primary = ABILITY_DATABASE[primaryElement] || ABILITY_DATABASE.Psychic;
    
    // Build ability pool based on evolution level
    const pool = [
      ...primary.basic,
      ...(evolutionLevel >= 2 ? primary.intermediate : []),
      ...(evolutionLevel >= 3 ? primary.advanced : [])
    ];

    // Select primary element abilities
    const primaryCount = Math.ceil(count * 0.7);
    for (let i = 0; i < primaryCount && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      const name = pool.splice(idx, 1)[0];
      abilities.push(this.createAbility(name, primaryElement, evolutionLevel));
    }

    // Add secondary element abilities if present
    if (secondaryElement) {
      const secondary = ABILITY_DATABASE[secondaryElement];
      if (secondary) {
        const secondaryPool = [
          ...secondary.basic,
          ...(evolutionLevel >= 2 ? secondary.intermediate : [])
        ];
        
        const secondaryCount = count - abilities.length;
        for (let i = 0; i < secondaryCount && secondaryPool.length > 0; i++) {
          const idx = Math.floor(Math.random() * secondaryPool.length);
          const name = secondaryPool.splice(idx, 1)[0];
          abilities.push(this.createAbility(name, secondaryElement, evolutionLevel));
        }
      }
    }

    return abilities.slice(0, count);
  }

  /**
   * Create ability object with stats
   */
  createAbility(name, element, evolutionLevel) {
    const effects = [
      null,
      'May cause burn',
      'May cause paralysis',
      'May cause freeze',
      'May cause confusion',
      'May lower target defense',
      'May lower target speed',
      'May raise user attack',
      'Heals user slightly',
      'High critical hit ratio'
    ];

    return {
      name: name,
      type: element,
      power: 30 + (evolutionLevel * 20) + this.randomRange(0, 30),
      accuracy: 70 + this.randomRange(0, 30),
      pp: 5 + this.randomRange(0, 20),
      priority: Math.random() > 0.9 ? 1 : 0,
      effect: Math.random() > 0.6 ? effects[Math.floor(Math.random() * effects.length)] : null
    };
  }

  /**
   * Generate lore entry
   */
  generateLore(name, analysis, evolutionLevel) {
    const habitats = {
      Fire: 'volcanic regions and sun-scorched deserts',
      Water: 'deep ocean trenches and crystal-clear lakes',
      Earth: 'ancient mountain caves and underground caverns',
      Air: 'high mountain peaks and endless skies',
      Electric: 'storm-wracked highlands and power plants',
      Shadow: 'forgotten ruins and the space between dimensions',
      Light: 'sacred temples and sun-drenched meadows',
      Nature: 'ancient forests and overgrown ruins',
      Ice: 'frozen tundras and glacial caves',
      Psychic: 'places of great mental energy'
    };

    const stageDescriptions = {
      1: 'In its juvenile form, it is curious and playful.',
      2: 'It is loyal and determined, fiercely protective of allies.',
      3: 'In its final evolution, it commands respect from all who encounter it.'
    };

    const habitat = habitats[analysis.primaryElement] || 'mysterious lands';
    const stage = stageDescriptions[evolutionLevel];

    return `${name} is a ${analysis.sizeClass || 'medium'}-sized ${analysis.creatureType || 'creature'} found in ${habitat}. ${stage} ${analysis.visualDescription || ''}`;
  }

  /**
   * Generate pose placeholders
   */
  generatePosePlaceholders(baseSprite) {
    return {
      front: { sprite: baseSprite, generated: false },
      back: { sprite: baseSprite, generated: false },
      left: { sprite: baseSprite, generated: false },
      right: { sprite: baseSprite, generated: false }
    };
  }

  /**
   * Generate animation placeholders
   */
  generateAnimationPlaceholders(baseSprite) {
    return {
      idle: { frames: [baseSprite, baseSprite], fps: 2, generated: false },
      walk: { frames: [baseSprite, baseSprite, baseSprite, baseSprite], fps: 4, generated: false },
      attack: { frames: [baseSprite, baseSprite, baseSprite], fps: 6, generated: false },
      hurt: { frames: [baseSprite, baseSprite], fps: 4, generated: false },
      faint: { frames: [baseSprite, baseSprite, baseSprite], fps: 3, generated: false }
    };
  }

  /**
   * Generate gender ratio (some monsters are genderless)
   */
  generateGenderRatio() {
    const roll = Math.random();
    if (roll < 0.1) return { male: 0, female: 0 }; // Genderless
    if (roll < 0.3) return { male: 0.875, female: 0.125 }; // Mostly male
    if (roll < 0.5) return { male: 0.125, female: 0.875 }; // Mostly female
    return { male: 0.5, female: 0.5 }; // Equal
  }

  /**
   * Utility: random number in range
   */
  randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export default new DataGenerator();
