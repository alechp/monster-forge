/**
 * Ability Database
 * 
 * Contains all abilities organized by element type and tier.
 * Used by the DataGenerator to assign abilities to monsters.
 */

export const ABILITY_DATABASE = {
  Fire: {
    basic: ['Ember Strike', 'Heat Wave', 'Flame Lick', 'Warm Aura'],
    intermediate: ['Fire Blast', 'Inferno Spin', 'Molten Shield', 'Combustion'],
    advanced: ['Solar Flare', 'Volcanic Eruption', 'Phoenix Rising', 'Supernova']
  },
  Water: {
    basic: ['Water Gun', 'Bubble Spray', 'Splash', 'Mist Veil'],
    intermediate: ['Hydro Pump', 'Tidal Wave', 'Whirlpool', 'Aqua Shield'],
    advanced: ['Tsunami', 'Abyssal Crush', 'Maelstrom', "Ocean's Wrath"]
  },
  Earth: {
    basic: ['Rock Throw', 'Sand Attack', 'Mud Slap', 'Stone Skin'],
    intermediate: ['Earthquake', 'Boulder Smash', 'Stalagmite', 'Iron Defense'],
    advanced: ['Tectonic Slam', 'Continental Crush', 'Meteor Impact', 'Mountain Rage']
  },
  Air: {
    basic: ['Gust', 'Wind Slash', 'Breeze', 'Feather Dance'],
    intermediate: ['Tornado', 'Cyclone Spin', 'Air Cutter', 'Tailwind'],
    advanced: ['Hurricane', 'Storm Front', 'Vacuum Wave', 'Sky Sovereign']
  },
  Electric: {
    basic: ['Spark', 'Static Shock', 'Thunder Jolt', 'Charge'],
    intermediate: ['Thunderbolt', 'Electro Ball', 'Discharge', 'Magnet Rise'],
    advanced: ['Thunder Storm', 'Plasma Cannon', 'Lightning Strike', 'Gigavolt Havoc']
  },
  Shadow: {
    basic: ['Shadow Sneak', 'Dark Pulse', 'Night Shade', 'Phantom Touch'],
    intermediate: ['Shadow Ball', 'Dark Void', 'Nightmare', 'Umbral Blade'],
    advanced: ['Abyssal Void', 'Eclipse', 'Soul Rend', 'Eternal Darkness']
  },
  Light: {
    basic: ['Flash', 'Light Beam', 'Gleam', 'Holy Shield'],
    intermediate: ['Solar Beam', 'Radiant Burst', 'Prism Ray', 'Sanctuary'],
    advanced: ['Divine Light', 'Celestial Flare', 'Aurora Borealis', 'Judgment']
  },
  Nature: {
    basic: ['Vine Whip', 'Leaf Blade', 'Pollen Puff', 'Growth'],
    intermediate: ['Solar Bloom', 'Thorn Storm', 'Petal Dance', 'Forest Fury'],
    advanced: ['World Tree', 'Jungle Wrath', 'Gaia Force', 'Bloom Doom']
  },
  Ice: {
    basic: ['Ice Shard', 'Frost Breath', 'Icy Wind', 'Hail'],
    intermediate: ['Ice Beam', 'Blizzard', 'Freeze Dry', 'Frost Armor'],
    advanced: ['Absolute Zero', 'Glacial Crush', 'Sheer Cold', 'Arctic Annihilation']
  },
  Psychic: {
    basic: ['Confusion', 'Psywave', 'Mind Reader', 'Calm Mind'],
    intermediate: ['Psychic', 'Mind Blast', 'Telekinesis', 'Barrier'],
    advanced: ['Psycho Boost', 'Dream Eater', 'Mind Control', 'Cosmic Power']
  }
};

/**
 * Status effects that abilities can inflict
 */
export const STATUS_EFFECTS = [
  { name: 'burn', description: 'Takes damage each turn, attack reduced' },
  { name: 'paralysis', description: 'May fail to move, speed reduced' },
  { name: 'freeze', description: 'Cannot move until thawed' },
  { name: 'confusion', description: 'May hurt itself instead of attacking' },
  { name: 'poison', description: 'Takes increasing damage each turn' },
  { name: 'sleep', description: 'Cannot move for several turns' }
];

/**
 * Ability effects pool for random assignment
 */
export const ABILITY_EFFECTS = [
  null,
  'May cause burn',
  'May cause paralysis',
  'May cause freeze',
  'May cause confusion',
  'May lower target defense',
  'May lower target speed',
  'May raise user attack',
  'Heals user slightly',
  'High critical hit ratio',
  'Always strikes first',
  'Ignores target defense',
  'Hits multiple targets',
  'May cause flinching'
];

export default ABILITY_DATABASE;
