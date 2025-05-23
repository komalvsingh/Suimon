// pokemonGameData.js - Contains game data for Pokemon Gym Brawler

// Pokemon attacks by type
export const attacks = {
  fire: [
    { name: "Scratch", damage: 10, energy: 0 },
    { name: "Ember", damage: 20, energy: 1 },
    { name: "Flamethrower", damage: 40, energy: 2 },
    { name: "Fire Blast", damage: 60, energy: 3 },
  ],
  water: [
    { name: "Tackle", damage: 10, energy: 0 },
    { name: "Water Gun", damage: 20, energy: 1 },
    { name: "Bubble Beam", damage: 40, energy: 2 },
    { name: "Hydro Pump", damage: 60, energy: 3 },
  ],
  grass: [
    { name: "Tackle", damage: 10, energy: 0 },
    { name: "Vine Whip", damage: 20, energy: 1 },
    { name: "Razor Leaf", damage: 40, energy: 2 },
    { name: "Solar Beam", damage: 60, energy: 3 },
  ],
  normal: [
    { name: "Tackle", damage: 10, energy: 0 },
    { name: "Quick Attack", damage: 20, energy: 1 },
    { name: "Body Slam", damage: 40, energy: 2 },
  ],
  rock: [
    { name: "Rock Throw", damage: 15, energy: 0 },
    { name: "Rock Slide", damage: 25, energy: 1 },
    { name: "Rock Blast", damage: 45, energy: 2 },
    { name: "Stone Edge", damage: 65, energy: 3 },
  ],
  electric: [
    { name: "Thunder Shock", damage: 15, energy: 0 },
    { name: "Spark", damage: 25, energy: 1 },
    { name: "Thunderbolt", damage: 45, energy: 2 },
    { name: "Thunder", damage: 70, energy: 3 },
  ],
  poison: [
    { name: "Poison Sting", damage: 15, energy: 0 },
    { name: "Acid", damage: 25, energy: 1 },
    { name: "Sludge Bomb", damage: 45, energy: 2 },
    { name: "Gunk Shot", damage: 65, energy: 3 },
  ],
  psychic: [
    { name: "Confusion", damage: 15, energy: 0 },
    { name: "Psybeam", damage: 25, energy: 1 },
    { name: "Psychic", damage: 50, energy: 2 },
    { name: "Future Sight", damage: 70, energy: 3 },
  ],
  ground: [
    { name: "Mud Slap", damage: 15, energy: 0 },
    { name: "Mud Bomb", damage: 25, energy: 1 },
    { name: "Earthquake", damage: 50, energy: 2 },
    { name: "Fissure", damage: 75, energy: 3 },
  ],
};

// Pokemon evolution data
export const evolutions = {
  charmander: { stage1: "charmeleon", stage2: "charizard", levelNeeded: [10, 20] },
  charmeleon: { stage1: null, stage2: "charizard", levelNeeded: [null, 20] },
  squirtle: { stage1: "wartortle", stage2: "blastoise", levelNeeded: [10, 20] },
  wartortle: { stage1: null, stage2: "blastoise", levelNeeded: [null, 20] },
  bulbasaur: { stage1: "ivysaur", stage2: "venusaur", levelNeeded: [10, 20] },
  ivysaur: { stage1: null, stage2: "venusaur", levelNeeded: [null, 20] },
  caterpie: { stage1: "metapod", stage2: "butterfree", levelNeeded: [7, 15] },
  metapod: { stage1: null, stage2: "butterfree", levelNeeded: [null, 15] },
  weedle: { stage1: "kakuna", stage2: "beedrill", levelNeeded: [7, 15] },
  kakuna: { stage1: null, stage2: "beedrill", levelNeeded: [null, 15] },
  pidgey: { stage1: "pidgeotto", stage2: "pidgeot", levelNeeded: [10, 20] },
  pidgeotto: { stage1: null, stage2: "pidgeot", levelNeeded: [null, 20] },
  spearow: { stage1: "fearow", stage2: null, levelNeeded: [15, null] },
  gastly: { stage1: "haunter", stage2: "gengar", levelNeeded: [12, 25] },
  haunter: { stage1: null, stage2: "gengar", levelNeeded: [null, 25] },
  machop: { stage1: "machoke", stage2: "machamp", levelNeeded: [12, 25] },
  machoke: { stage1: null, stage2: "machamp", levelNeeded: [null, 25] },
  psyduck: { stage1: "golduck", stage2: null, levelNeeded: [15, null] },
  dratini: { stage1: "dragonair", stage2: "dragonite", levelNeeded: [15, 28] },
  dragonair: { stage1: null, stage2: "dragonite", levelNeeded: [null, 28] }
};


// Experience points needed for each level (1-30)
export const expForLevel = [
  0,
  100,
  220,
  360,
  520,
  700,
  900,
  1120,
  1360,
  1620, // Levels 1-10
  1900,
  2200,
  2520,
  2860,
  3220,
  3600,
  4000,
  4420,
  4860,
  5320, // Levels 11-20
  5800,
  6300,
  6820,
  7360,
  7920,
  8500,
  9100,
  9720,
  10360,
  11020, // Levels 21-30
];

// Available Pokemon choices at different gym milestones
export const pokemonChoicesByGym = [
  {
    gym: 1,
    choices: ["Caterpie", "Weedle"],
    description: "Choose your second team member!",
  },
  {
    gym: 2,
    choices: ["Pidgey", "Spearow"],
    description: "Choose your third team member!",
  },
  {
    gym: 4,
    choices: ["Hitmonlee", "Hitmonchan"],
    description: "Choose your fourth team member!",
  },
  { gym: 5, choices: ["Dratini"], description: "Dratini joins your team!" },
  {
    gym: 7,
    choices: ["Gastly", "Machop", "Psyduck"],
    description: "Choose your final team member!",
  },
];

// Base experience gained from defeating Pokemon based on gym difficulty
export const baseExpGain = 50;

// Helper function to get Pokemon type based on name
export const getType = (name) => {
  // Starter Pokemon types
  if (name.includes("char")) return "fire";
  if (name.includes("squirtle") || name.includes("blastoise")) return "water";
  if (name.includes("bulb") || name.includes("ivy") || name.includes("venu"))
    return "grass";

  // Gym Pokemon types
  if (
    name.toLowerCase().includes("geodude") ||
    name.toLowerCase().includes("onix")
  )
    return "rock";
  if (
    name.toLowerCase().includes("staryu") ||
    name.toLowerCase().includes("starmie")
  )
    return "water";
  if (
    name.toLowerCase().includes("voltorb") ||
    name.toLowerCase().includes("raichu")
  )
    return "electric";
  if (
    name.toLowerCase().includes("tangela") ||
    name.toLowerCase().includes("vileplume")
  )
    return "grass";
  if (
    name.toLowerCase().includes("muk") ||
    name.toLowerCase().includes("weezing")
  )
    return "poison";
  if (
    name.toLowerCase().includes("kadabra") ||
    name.toLowerCase().includes("alakazam")
  )
    return "psychic";
  if (
    name.toLowerCase().includes("ponyta") ||
    name.toLowerCase().includes("arcanine")
  )
    return "fire";
  if (
    name.toLowerCase().includes("nidoqueen") ||
    name.toLowerCase().includes("rhydon")
  )
    return "ground";

  return "normal";
};

// Export all game data as a default object
export default {
  attacks,
  evolutions,
  expForLevel,
  pokemonChoicesByGym,
  baseExpGain,
  getType
};