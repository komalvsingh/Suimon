const playerCards = [
  {
    id: "001",
    name: "Pikachu",
    type: "Electric",
    hp: 60,
    stage: "Basic",
    attacks: [
      {
        name: "Thunder Shock",
        damage: 20,
        cost: ["Electric"],
        effect: "Flip a coin. If heads, the opponent's Pokémon is paralyzed.",
      },
      {
        name: "Electro Ball",
        damage: 50,
        cost: ["Electric", "Colorless"],
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Fighting"],
    resistances: ["Steel"],
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkLCnbztAIm1x1bYAwcxW1Gn9bUxRCmA_PxQ&s",
  },
  {
    id: "004",
    name: "Charmander",
    type: "Fire",
    hp: 50,
    stage: "Basic",
    attacks: [
      {
        name: "Scratch",
        damage: 10,
        cost: ["Colorless"],
      },
      {
        name: "Ember",
        damage: 30,
        cost: ["Fire", "Colorless"],
        effect: "Discard a Fire energy attached to Charmander.",
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Water"],
    resistances: [],
    image:
      "https://i.pinimg.com/736x/b2/f2/d2/b2f2d2a9d9680e5bb02d605dec67b505.jpg",
  },
  {
    id: "007",
    name: "Squirtle",
    type: "Water",
    hp: 50,
    stage: "Basic",
    attacks: [
      {
        name: "Tackle",
        damage: 10,
        cost: ["Colorless"],
      },
      {
        name: "Water Gun",
        damage: 30,
        cost: ["Water", "Colorless"],
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Electric"],
    resistances: [],
    image:
      "https://www.pngplay.com/wp-content/uploads/12/Squirtle-Pokemon-Background-PNG-Clip-Art.png",
  },
  {
    id: "134",
    name: "Vaporeon",
    type: "Water",
    hp: 90,
    stage: "Stage 1",
    attacks: [
      {
        name: "Aqua Ring",
        damage: 40,
        cost: ["Water", "Colorless"],
      },
      {
        name: "Hydro Pump",
        damage: 60,
        cost: ["Water", "Water", "Colorless"],
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Electric"],
    resistances: ["Fire"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/134.png",
  },
  {
    id: "065",
    name: "Alakazam",
    type: "Psychic",
    hp: 100,
    stage: "Stage 2",
    attacks: [
      {
        name: "Psybeam",
        damage: 40,
        cost: ["Psychic", "Colorless"],
        effect:
          "Flip a coin. If heads, the opponent’s Pokémon is now Confused.",
      },
      {
        name: "Psychic",
        damage: 60,
        cost: ["Psychic", "Psychic", "Colorless"],
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Dark"],
    resistances: ["Fighting"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/65.png",
  },
  {
    id: "149",
    name: "Dragonite",
    type: "Dragon",
    hp: 130,
    stage: "Stage 2",
    attacks: [
      {
        name: "Dragon Claw",
        damage: 70,
        cost: ["Colorless", "Colorless", "Colorless"],
      },
      {
        name: "Hyper Beam",
        damage: 90,
        cost: ["Colorless", "Colorless", "Colorless", "Colorless"],
        effect: "Discard an Energy from your opponent's Active Pokémon.",
      },
    ],
    retreatCost: ["Colorless", "Colorless", "Colorless"],
    weaknesses: ["Fairy"],
    resistances: ["Grass", "Water"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png",
  },
  {
    id: "026",
    name: "Raichu",
    type: "Electric",
    hp: 90,
    stage: "Stage 1",
    attacks: [
      {
        name: "Volt Tackle",
        damage: 70,
        cost: ["Electric", "Electric", "Colorless"],
        effect: "Raichu does 10 damage to itself.",
      },
      {
        name: "Thunder",
        damage: 90,
        cost: ["Electric", "Electric", "Colorless"],
        effect: "Flip a coin. If tails, Raichu does 30 damage to itself.",
      },
    ],
    retreatCost: ["Colorless", "Colorless"],
    weaknesses: ["Fighting"],
    resistances: ["Steel"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/26.png",
  },
  {
    id: "036",
    name: "Clefable",
    type: "Fairy",
    hp: 90,
    stage: "Stage 1",
    attacks: [
      {
        name: "Moonblast",
        damage: 30,
        cost: ["Fairy"],
        effect:
          "During your opponent's next turn, the Defending Pokémon's attacks do 30 less damage.",
      },
      {
        name: "Metronome",
        damage: 0,
        cost: ["Colorless", "Colorless"],
        effect:
          "Choose 1 of the Defending Pokémon’s attacks and use it as this attack.",
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Steel"],
    resistances: ["Dragon", "Dark"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/36.png",
  },
  {
    id: "038",
    name: "Ninetales",
    type: "Fire",
    hp: 90,
    stage: "Stage 1",
    attacks: [
      {
        name: "Flare Blitz",
        damage: 60,
        cost: ["Fire", "Colorless"],
      },
      {
        name: "Will-O-Wisp",
        damage: 30,
        cost: ["Fire"],
        effect: "The opponent's Active Pokémon is now Burned.",
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Water"],
    resistances: [],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/38.png",
  },
  {
    id: "130",
    name: "Gyarados",
    type: "Water",
    hp: 120,
    stage: "Stage 1",
    attacks: [
      {
        name: "Aqua Tail",
        damage: 90,
        cost: ["Water", "Colorless", "Colorless"],
      },
      {
        name: "Dragon Rage",
        damage: 100,
        cost: ["Water", "Water", "Colorless", "Colorless"],
      },
    ],
    retreatCost: ["Colorless", "Colorless", "Colorless"],
    weaknesses: ["Electric"],
    resistances: [],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/130.png",
  },
  {
    id: "197",
    name: "Umbreon",
    type: "Dark",
    hp: 100,
    stage: "Stage 1",
    attacks: [
      {
        name: "Feint Attack",
        damage: 30,
        cost: ["Dark"],
        effect:
          "This attack's damage isn't affected by Weakness, Resistance, or any other effects on the Defending Pokémon.",
      },
      {
        name: "Dark Pulse",
        damage: 60,
        cost: ["Dark", "Colorless"],
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Fighting"],
    resistances: ["Psychic"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png",
  },
  {
    id: "126",
    name: "Magmar",
    type: "Fire",
    hp: 80,
    stage: "Basic",
    attacks: [
      {
        name: "Smokescreen",
        damage: 20,
        cost: ["Fire"],
        effect:
          "If the Defending Pokémon tries to attack during your opponent’s next turn, they must flip a coin. If tails, that attack does nothing.",
      },
      {
        name: "Flamethrower",
        damage: 60,
        cost: ["Fire", "Colorless", "Colorless"],
        effect: "Discard a Fire Energy attached to Magmar.",
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Water"],
    resistances: [],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/126.png",
  },
];

export default playerCards;
