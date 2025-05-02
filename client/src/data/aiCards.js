const aiCards = [
  {
    id: "025",
    name: "Raichu",
    type: "Electric",
    hp: 80,
    stage: "Stage 1",
    attacks: [
      {
        name: "Thunderbolt",
        damage: 40,
        cost: ["Electric", "Colorless"],
      },
      {
        name: "Quick Attack",
        damage: 30,
        cost: ["Colorless"],
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Fighting"],
    resistances: ["Steel"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/26.png",
  },
  {
    id: "001",
    name: "Bulbasaur",
    type: "Grass",
    hp: 60,
    stage: "Basic",
    attacks: [
      {
        name: "Tackle",
        damage: 10,
        cost: ["Colorless"],
      },
      {
        name: "Vine Whip",
        damage: 40,
        cost: ["Grass", "Colorless"],
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Fire"],
    resistances: ["Water"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
  },
  {
    id: "002",
    name: "Ivysaur",
    type: "Grass",
    hp: 80,
    stage: "Stage 1",
    attacks: [
      {
        name: "Tackle",
        damage: 10,
        cost: ["Colorless"],
      },
      {
        name: "Razor Leaf",
        damage: 50,
        cost: ["Grass", "Colorless"],
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Fire"],
    resistances: ["Water"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/2.png",
  },
  {
    id: "059",
    name: "Arcanine",
    type: "Fire",
    hp: 100,
    stage: "Stage 1",
    attacks: [
      {
        name: "Flamethrower",
        damage: 60,
        cost: ["Fire", "Fire", "Colorless"],
        effect: "Discard a Fire energy attached to Arcanine.",
      },
      {
        name: "Bite",
        damage: 30,
        cost: ["Colorless", "Colorless"],
      },
    ],
    retreatCost: ["Colorless", "Colorless"],
    weaknesses: ["Water"],
    resistances: [],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/59.png",
  },
  {
    id: "067",
    name: "Machoke",
    type: "Fighting",
    hp: 90,
    stage: "Stage 1",
    attacks: [
      {
        name: "Karate Chop",
        damage: 50,
        cost: ["Fighting", "Colorless"],
      },
      {
        name: "Submission",
        damage: 70,
        cost: ["Fighting", "Fighting", "Colorless"],
        effect: "Machoke does 10 damage to itself.",
      },
    ],
    retreatCost: ["Colorless", "Colorless"],
    weaknesses: ["Psychic"],
    resistances: [],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/67.png",
  },
  {
    id: "006",
    name: "Charizard",
    type: "Fire",
    hp: 120,
    stage: "Stage 2",
    attacks: [
      {
        name: "Fire Spin",
        damage: 100,
        cost: ["Fire", "Fire", "Colorless", "Colorless"],
        effect: "Discard 2 Fire Energy attached to Charizard.",
      },
      {
        name: "Flame Tail",
        damage: 60,
        cost: ["Fire", "Colorless", "Colorless"],
      },
    ],
    retreatCost: ["Colorless", "Colorless", "Colorless"],
    weaknesses: ["Water"],
    resistances: ["Grass"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
  },
  {
    id: "112",
    name: "Rhydon",
    type: "Fighting",
    hp: 100,
    stage: "Stage 1",
    attacks: [
      {
        name: "Horn Attack",
        damage: 30,
        cost: ["Colorless", "Colorless"],
      },
      {
        name: "Rock Tumble",
        damage: 60,
        cost: ["Fighting", "Fighting", "Colorless"],
      },
    ],
    retreatCost: ["Colorless", "Colorless"],
    weaknesses: ["Grass", "Water"],
    resistances: ["Electric"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/112.png",
  },
  {
    id: "045",
    name: "Vileplume",
    type: "Grass",
    hp: 90,
    stage: "Stage 2",
    attacks: [
      {
        name: "Petal Dance",
        damage: 50,
        cost: ["Grass", "Colorless"],
        effect:
          "Flip 3 coins. This attack does 50 damage for each heads. Vileplume is now confused.",
      },
      {
        name: "Aromatherapy",
        damage: 0,
        cost: ["Grass"],
        effect: "Heal 30 damage from each of your Pokémon.",
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Fire"],
    resistances: ["Water"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/45.png",
  },
  {
    id: "143",
    name: "Snorlax",
    type: "Colorless",
    hp: 130,
    stage: "Basic",
    attacks: [
      {
        name: "Body Slam",
        damage: 50,
        cost: ["Colorless", "Colorless"],
        effect:
          "Flip a coin. If heads, the opponent's Active Pokémon is now Paralyzed.",
      },
      {
        name: "Heavy Impact",
        damage: 90,
        cost: ["Colorless", "Colorless", "Colorless"],
      },
    ],
    retreatCost: ["Colorless", "Colorless", "Colorless", "Colorless"],
    weaknesses: ["Fighting"],
    resistances: [],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png",
  },
  {
    id: "121",
    name: "Starmie",
    type: "Water",
    hp: 80,
    stage: "Stage 1",
    attacks: [
      {
        name: "Rapid Spin",
        damage: 30,
        cost: ["Water"],
        effect:
          "Your opponent switches their Active Pokémon with one of their Benched Pokémon.",
      },
      {
        name: "Hydro Splash",
        damage: 50,
        cost: ["Water", "Colorless"],
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Electric"],
    resistances: [],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/121.png",
  },
  {
    id: "094",
    name: "Gengar",
    type: "Psychic",
    hp: 110,
    stage: "Stage 2",
    attacks: [
      {
        name: "Shadow Punch",
        damage: 40,
        cost: ["Psychic", "Colorless"],
      },
      {
        name: "Nightmare",
        damage: 70,
        cost: ["Psychic", "Psychic", "Colorless"],
        effect: "The Defending Pokémon is now Asleep.",
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Dark"],
    resistances: ["Fighting", "Normal"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png",
  },
  {
    id: "123",
    name: "Scyther",
    type: "Grass",
    hp: 70,
    stage: "Basic",
    attacks: [
      {
        name: "Agility",
        damage: 20,
        cost: ["Colorless"],
        effect:
          "Flip a coin. If heads, prevent all effects of attacks, including damage, done to Scyther during your opponent’s next turn.",
      },
      {
        name: "Slash",
        damage: 50,
        cost: ["Grass", "Colorless"],
      },
    ],
    retreatCost: ["Colorless"],
    weaknesses: ["Fire"],
    resistances: ["Fighting"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/123.png",
  },
];

export default aiCards;
