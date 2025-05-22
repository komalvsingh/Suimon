// Export components from the brawl folder

import PokemonBattle from './PokemonBattle';
import BattleUI from './BattleUI';
import { pokemonData, fetchPokemonData } from '../data/pokemonBrawlData';
import { specialCards } from '../data/specialCards';

export {
  PokemonBattle,
  BattleUI,
  pokemonData,
  fetchPokemonData,
  specialCards
};

// Default export for easy importing
export default PokemonBattle;