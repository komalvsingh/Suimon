// Pokemon data for the RPG battle game

export const pokemonData = {
  // Player Pokemon (Pikachu) is defined in the main component
  
  // Enemy Pokemon lineup
  enemies: [
    // Level 1 - Squirtle (Water)
    {
      name: 'Squirtle',
      type: 'Water',
      maxHP: 2000,
      attacks: [
        { name: 'Water Gun', damage: 350, cooldown: 0, currentCooldown: 0 },
        { name: 'Aqua Tail', damage: 450, cooldown: 1, currentCooldown: 0 }
      ],
      sprite: 'squirtle-sprite'
    },
    
    // Level 2 - Onix (Rock/Ground)
    {
      name: 'Onix',
      type: 'Rock/Ground',
      maxHP: 2200,
      attacks: [
        { name: 'Rock Throw', damage: 350, cooldown: 0, currentCooldown: 0 },
        { name: 'Iron Tail', damage: 450, cooldown: 1, currentCooldown: 0 }
      ],
      sprite: 'onix-sprite'
    },
    
    // Level 3 - Pidgeot (Flying)
    {
      name: 'Pidgeot',
      type: 'Flying',
      maxHP: 2400,
      attacks: [
        { name: 'Gust', damage: 350, cooldown: 0, currentCooldown: 0 },
        { name: 'Air Slash', damage: 450, cooldown: 1, currentCooldown: 0 }
      ],
      sprite: 'pidgeot-sprite'
    },
    
    // Level 4 - Lucario (Fighting/Steel)
    {
      name: 'Lucario',
      type: 'Fighting/Steel',
      maxHP: 2650,
      attacks: [
        { name: 'Force Palm', damage: 350, cooldown: 0, currentCooldown: 0 },
        { name: 'Aura Sphere', damage: 450, cooldown: 1, currentCooldown: 0 }
      ],
      sprite: 'lucario-sprite'
    },
    
    // Level 5 - Garchomp (Dragon/Ground)
    {
      name: 'Garchomp',
      type: 'Dragon/Ground',
      maxHP: 3000,
      attacks: [
        { name: 'Dragon Claw', damage: 350, cooldown: 0, currentCooldown: 0 },
        { name: 'Earthquake', damage: 450, cooldown: 1, currentCooldown: 0 },
        { name: 'Dragon Rush', damage: 600, cooldown: 2, currentCooldown: 0 },
        { name: 'Giga Impact', damage: 700, cooldown: 3, currentCooldown: 0 }
      ],
      sprite: 'garchomp-sprite'
    }
  ]
};

// Function to fetch Pokemon data from PokeAPI
export const fetchPokemonData = async (pokemonName) => {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${pokemonName}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Pokemon data:', error);
    return null;
  }
};