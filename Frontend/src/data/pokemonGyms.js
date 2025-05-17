// pokemonGyms.js - Contains data for Kanto region gyms

export const kantoGyms = [
  {
    name: "Pewter Gym",
    leader: "Brock",
    badge: "Boulder Badge",
    pokemon: [ "Geodude", "Onix"],
    type: "rock",
    difficulty: 1,
  },
  {
    name: "Cerulean Gym",
    leader: "Misty",
    badge: "Cascade Badge",
    pokemon: ["Staryu", "Goldeen", "Starmie"],
    type: "water",
    difficulty: 2,
  },
  {
    name: "Vermilion Gym",
    leader: "Lt. Surge",
    badge: "Thunder Badge",
    pokemon: ["Pikachu", "Voltorb", "Raichu"],
    type: "electric",
    difficulty: 3,
  },
  {
    name: "Celadon Gym",
    leader: "Erika",
    badge: "Rainbow Badge",
    pokemon: ["Oddish", "Tangela", "Vileplume"],
    type: "grass",
    difficulty: 4,
  },
  {
    name: "Fuchsia Gym",
    leader: "Koga",
    badge: "Soul Badge",
    pokemon: ["Koffing", "Muk", "Weezing", "Venomoth"],
    type: "poison",
    difficulty: 5,
  },
  {
    name: "Saffron Gym",
    leader: "Sabrina",
    badge: "Marsh Badge",
    pokemon: ["Abra", "Kadabra", "Mr. Mime", "Alakazam"],
    type: "psychic",
    difficulty: 6,
  },
  {
    name: "Cinnabar Gym",
    leader: "Blaine",
    badge: "Volcano Badge",
    pokemon: ["Growlithe", "Ponyta", "Rapidash", "Arcanine"],
    type: "fire",
    difficulty: 7,
  },
  {
    name: "Viridian Gym",
    leader: "Giovanni",
    badge: "Earth Badge",
    pokemon: ["Dugtrio", "Nidoking", "Nidoqueen", "Rhydon", "Persian"],
    type: "ground",
    difficulty: 8,
  },
];

// Export a function to get a gym by index
export const getGymByIndex = (index) => {
  if (index >= 0 && index < kantoGyms.length) {
    return kantoGyms[index];
  }
  return null;
};

// Export default for convenience
export default kantoGyms;