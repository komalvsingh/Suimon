import { useState, useEffect } from 'react';
import { ConnectButton } from '@suiet/wallet-kit';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { SuiClient } from '@mysten/sui.js/client';

const TESTNET_CLIENT = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

const CreatureCollection = ({ wallet }) => {
  const [creature, setCreature] = useState(null);
  const [pokemonDetails, setPokemonDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [allCreatures, setAllCreatures] = useState([]);
  const [selectedCreatureIndex, setSelectedCreatureIndex] = useState(0);

  const loadPokemonDetails = async (name, pokemonId) => {
    try {
      // First try with the exact name
      let formattedName = name.toLowerCase().replace(/\s+/g, '-');
      
      // If we have a pokemonId, use that as a fallback
      const fallbackId = pokemonId ? parseInt(pokemonId) : null;
      
      const [pokemonData, speciesData] = await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${formattedName}`)
          .then(res => {
            if (!res.ok && fallbackId) {
              return fetch(`https://pokeapi.co/api/v2/pokemon/${fallbackId}`).then(res => res.json());
            }
            if (!res.ok) throw new Error(`Pokemon API error: ${res.status}`);
            return res.json();
          }),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${formattedName}`)
          .then(res => {
            if (!res.ok && fallbackId) {
              return fetch(`https://pokeapi.co/api/v2/pokemon-species/${fallbackId}`).then(res => res.json());
            }
            if (!res.ok) throw new Error(`Species API error: ${res.status}`);
            return res.json();
          }),
      ]);

      return {
        types: pokemonData.types.map(t => t.type.name),
        abilities: pokemonData.abilities.map(a => a.ability.name),
        stats: pokemonData.stats,
        height: pokemonData.height,
        weight: pokemonData.weight,
        description: speciesData.flavor_text_entries
          .find(entry => entry.language.name === 'en')?.flavor_text || '',
        genus: speciesData.genera
          .find(g => g.language.name === 'en')?.genus || '',
      };
    } catch (err) {
      console.error('Error fetching Pokemon details:', err);
      return null;
    }
  };

  const fetchCreatures = async () => {
    if (!wallet.connected || !wallet.account) {
      setAllCreatures([]);
      setCreature(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    setPokemonDetails(null);

    try {
      const nfts = await TESTNET_CLIENT.getOwnedObjects({
        owner: wallet.account.address,
        options: { 
          showContent: true,
          showType: true,
          showDisplay: true 
        },
      });

      if (!nfts.data || nfts.data.length === 0) {
        setError('No NFTs found in your testnet wallet.');
        setAllCreatures([]);
        setCreature(null);
        return;
      }

      // Log all NFTs for debugging
      console.log('All NFTs:', nfts.data);

      const creatureNfts = nfts.data.filter(obj => {
        const type = obj.data?.type;
        // More inclusive filter to catch all potential creature NFTs
        return type && (
          type.includes('starter_nft') ||
          type.includes('suimon') ||
          type.includes('pokemon') ||
          type.includes('poki') ||
          type.includes('nft') ||
          type.includes('creature')
        );
      });

      console.log('Filtered creature NFTs:', creatureNfts);

      if (creatureNfts.length === 0) {
        setError(`Found ${nfts.data.length} NFTs, but none match creature types.`);
        setAllCreatures([]);
        setCreature(null);
        return;
      }

      // Process all creature NFTs
      const creatures = creatureNfts.map(nft => {
        const data = nft.data;
        const content = data.content?.fields || {};
        const display = data.display?.data?.fields || {};

        // Try to extract all possible identifiers
        const pokemonId = content.pokemon_id || content.id || extractPokemonIdFromName(content.name || display.name);

        return {
          id: data.objectId,
          name: content.name || display.name || getPokemonName(pokemonId) || 'Unnamed Creature',
          pokemonId: pokemonId,
          type: content.type || content.pokemon_type || getPokemonType(pokemonId) || 'Unknown',
          level: content.level || content.evolution_stage || 1,
          power: content.power || content.experience || 0,
          image: content.image || content.image_url || display.image_url || getDefaultImage(pokemonId),
        };
      });

      console.log('Processed creatures:', creatures);
      
      setAllCreatures(creatures);
      
      if (creatures.length > 0) {
        setCreature(creatures[0]);
        // Load additional details for the first creature
        const details = await loadPokemonDetails(creatures[0].name, creatures[0].pokemonId);
        setPokemonDetails(details);
      }
    } catch (err) {
      console.error('Error loading NFTs:', err);
      setError(`Failed to load NFTs: ${err.message}`);
      setAllCreatures([]);
      setCreature(null);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCreature = async (index) => {
    if (index >= 0 && index < allCreatures.length) {
      setSelectedCreatureIndex(index);
      setCreature(allCreatures[index]);
      setPokemonDetails(null); // Clear previous details
      setIsLoading(true);
      
      try {
        const selectedCreature = allCreatures[index];
        const details = await loadPokemonDetails(selectedCreature.name, selectedCreature.pokemonId);
        setPokemonDetails(details);
      } catch (err) {
        console.error('Error loading Pokemon details:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Extract Pokemon ID from name if possible
  const extractPokemonIdFromName = (name) => {
    if (!name) return null;
    
    const lowercaseName = name.toLowerCase();
    
    if (lowercaseName.includes('bulbasaur')) return 1;
    if (lowercaseName.includes('ivysaur')) return 2;
    if (lowercaseName.includes('venusaur')) return 3;
    if (lowercaseName.includes('charmander')) return 4;
    if (lowercaseName.includes('charmeleon')) return 5;
    if (lowercaseName.includes('charizard')) return 6;
    if (lowercaseName.includes('squirtle')) return 7;
    if (lowercaseName.includes('wartortle')) return 8;
    if (lowercaseName.includes('blastoise')) return 9;
    
    return null;
  };

  // Get Pokemon name from ID
  const getPokemonName = (id) => {
    if (!id) return null;
    switch(parseInt(id)) {
      case 1: return 'Bulbasaur';
      case 2: return 'Ivysaur';
      case 3: return 'Venusaur';
      case 4: return 'Charmander';
      case 5: return 'Charmeleon';
      case 6: return 'Charizard';
      case 7: return 'Squirtle';
      case 8: return 'Wartortle';
      case 9: return 'Blastoise';
      default: return null;
    }
  };

  // Default images for common Pokemon
  const getDefaultImage = (id) => {
    if (!id) return '';
    // You would replace these with actual image URLs in production
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  };

  const getPokemonType = (id) => {
    if (!id) return 'Unknown';
    switch(parseInt(id)) {
      case 1: case 2: case 3: return 'Grass';
      case 4: case 5: case 6: return 'Fire';
      case 7: case 8: case 9: return 'Water';
      default: return 'Unknown';
    }
  };

  useEffect(() => {
    if (wallet.account) {
      fetchCreatures();
    }
  }, [wallet]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      {!wallet.account ? (
        <div className="bg-surface p-6 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="mb-4">Please connect your wallet to view your SuiMon creatures.</p>
          <ConnectButton />
        </div>
      ) : isLoading && allCreatures.length === 0 ? (
        <div className="bg-surface p-6 rounded-lg shadow text-center">
          <p>Loading your creatures...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg text-red-500 mb-4">
              <p>{error}</p>
              <button 
                onClick={fetchCreatures}
                className="mt-2 text-sm underline hover:text-primary"
              >
                Try Again
              </button>
            </div>
          )}

          {allCreatures.length > 0 && (
            <>
              {/* Creature selector */}
              {allCreatures.length > 1 && (
                <div className="mb-4 bg-surface p-3 rounded-lg shadow">
                  <h3 className="text-lg font-bold mb-2">Your Creatures</h3>
                  <div className="flex overflow-x-auto gap-2 pb-2">
                    {allCreatures.map((c, index) => (
                      <button
                        key={c.id}
                        onClick={() => selectCreature(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden ${
                          index === selectedCreatureIndex ? 'ring-2 ring-primary' : 'opacity-70'
                        }`}
                      >
                        {c.image ? (
                          <img
                            src={c.image}
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <span className="text-xs">{c.name.substring(0, 3)}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected creature display */}
              {creature && (
                <div className="bg-surface rounded-lg shadow overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/3 p-4 bg-gray-800 flex flex-col items-center">
                      <div className="w-full aspect-square mb-4 rounded-lg overflow-hidden bg-gray-700">
                        {creature.image ? (
                          <LazyLoadImage
                            src={creature.image}
                            alt={creature.name}
                            className="w-full h-full object-contain"
                            placeholder={<div className="w-full h-full bg-gray-600 animate-pulse" />}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold mb-1">{creature.name}</h2>
                      <p className="text-gray-400 italic mb-3">
                        {pokemonDetails?.genus || getPokemonGenus(creature.pokemonId) || 'Unknown creature'}
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${Math.min(100, (creature.power / 300) * 100)}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 w-full">
                        <div className="bg-gray-700 p-2 rounded text-center">
                          <p className="text-xs text-gray-400">Level</p>
                          <p className="font-bold">{creature.level}</p>
                        </div>
                        <div className="bg-gray-700 p-2 rounded text-center">
                          <p className="text-xs text-gray-400">Power</p>
                          <p className="font-bold">{creature.power}</p>
                        </div>
                      </div>
                    </div>

                    <div className="md:w-2/3 p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-lg font-bold mb-2">Details</h3>
                          <p className="text-gray-400">
                            {pokemonDetails?.description || getPokemonDescription(creature.pokemonId) || 'No description available'}
                          </p>
                        </div>
                        <button
                          onClick={fetchCreatures}
                          className="bg-primary hover:bg-primary/80 px-3 py-1 rounded-md text-white text-sm"
                        >
                          Refresh
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <h4 className="font-bold mb-2">Type</h4>
                          <div className="flex flex-wrap gap-2">
                            {(pokemonDetails?.types || [creature.type]).map((type, i) => (
                              <span 
                                key={i}
                                className={`px-2 py-1 rounded text-xs ${
                                  type.toLowerCase() === 'fire' ? 'bg-red-500/20 text-red-500' :
                                  type.toLowerCase() === 'water' ? 'bg-blue-500/20 text-blue-500' :
                                  type.toLowerCase() === 'grass' ? 'bg-green-500/20 text-green-500' :
                                  'bg-gray-500/20 text-gray-500'
                                }`}
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold mb-2">Abilities</h4>
                          <div className="flex flex-wrap gap-2">
                            {(pokemonDetails?.abilities || getPokemonAbilities(creature.pokemonId) || ['Unknown']).map((ability, i) => (
                              <span 
                                key={i}
                                className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300"
                              >
                                {ability}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-800 p-3 rounded">
                          <p className="text-xs text-gray-400">Height</p>
                          <p className="font-bold">
                            {pokemonDetails?.height ? `${pokemonDetails.height / 10}m` : 
                            getPokemonHeight(creature.pokemonId) || '?'}
                          </p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded">
                          <p className="text-xs text-gray-400">Weight</p>
                          <p className="font-bold">
                            {pokemonDetails?.weight ? `${pokemonDetails.weight / 10}kg` : 
                            getPokemonWeight(creature.pokemonId) || '?'}
                          </p>
                        </div>
                        <div className="bg-gray-800 p-3 rounded">
                          <p className="text-xs text-gray-400">Stage</p>
                          <p className="font-bold">
                            {creature.level === 0 ? 'Basic' :
                            creature.level === 1 ? 'Stage 1' : 'Stage 2'}
                          </p>
                        </div>
                      </div>

                      {(pokemonDetails?.stats || getPokemonStats(creature.pokemonId)) && (
                        <div className="mt-6">
                          <h4 className="font-bold mb-3">Stats</h4>
                          <div className="space-y-2">
                            {(pokemonDetails?.stats || getPokemonStats(creature.pokemonId)).map(stat => (
                              <div key={stat.stat?.name || stat.name} className="flex items-center">
                                <span className="w-24 text-sm text-gray-400 capitalize">
                                  {(stat.stat?.name || stat.name).replace('-', ' ')}
                                </span>
                                <div className="flex-1 bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-primary h-2 rounded-full"
                                    style={{ width: `${Math.min(100, ((stat.base_stat || stat.value) / 255) * 100)}%` }}
                                  />
                                </div>
                                <span className="w-8 text-right text-sm ml-2">
                                  {stat.base_stat || stat.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {allCreatures.length === 0 && !error && !isLoading && (
            <div className="bg-surface p-6 rounded-lg shadow text-center">
              <p className="text-gray-400 mb-4">You don't have any creatures yet</p>
              <p className="text-sm">Go mint your first one in the Starter Picker!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Fallback data functions in case PokeAPI fails
const getPokemonGenus = (id) => {
  if (!id) return null;
  switch(parseInt(id)) {
    case 1: return 'Seed Pokémon';
    case 2: return 'Seed Pokémon';
    case 3: return 'Seed Pokémon';
    case 4: return 'Lizard Pokémon';
    case 5: return 'Flame Pokémon';
    case 6: return 'Flame Pokémon';
    case 7: return 'Tiny Turtle Pokémon';
    case 8: return 'Turtle Pokémon';
    case 9: return 'Shellfish Pokémon';
    default: return null;
  }
};

const getPokemonDescription = (id) => {
  if (!id) return null;
  switch(parseInt(id)) {
    case 1: return 'A strange seed was planted on its back at birth. The plant sprouts and grows with this Pokémon.';
    case 2: return 'When the bulb on its back grows large, it appears to lose the ability to stand on its hind legs.';
    case 3: return 'The plant blooms when it is absorbing solar energy. It stays on the move to seek sunlight.';
    case 4: return 'The flame at the tip of its tail makes a sound as it burns. You can only hear it in quiet places.';
    case 5: return 'When it swings its burning tail, it elevates the temperature to unbearably high levels.';
    case 6: return 'It spits fire that is hot enough to melt boulders. It may cause forest fires by blowing flames.';
    case 7: return 'When it retracts its long neck into its shell, it squirts out water with vigorous force.';
    case 8: return 'It is recognized as a symbol of longevity. If its shell has algae on it, that Wartortle is very old.';
    case 9: return 'It crushes its foe under its heavy body to cause fainting. In a pinch, it will withdraw inside its shell.';
    default: return null;
  }
};

const getPokemonAbilities = (id) => {
  if (!id) return null;
  switch(parseInt(id)) {
    case 1: case 2: case 3: return ['overgrow', 'chlorophyll'];
    case 4: case 5: case 6: return ['blaze', 'solar-power'];
    case 7: case 8: case 9: return ['torrent', 'rain-dish'];
    default: return null;
  }
};

const getPokemonHeight = (id) => {
  if (!id) return null;
  switch(parseInt(id)) {
    case 1: return '0.7m';
    case 2: return '1.0m';
    case 3: return '2.0m';
    case 4: return '0.6m';
    case 5: return '1.1m';
    case 6: return '1.7m';
    case 7: return '0.5m';
    case 8: return '1.0m';
    case 9: return '1.6m';
    default: return null;
  }
};

const getPokemonWeight = (id) => {
  if (!id) return null;
  switch(parseInt(id)) {
    case 1: return '6.9kg';
    case 2: return '13.0kg';
    case 3: return '100.0kg';
    case 4: return '8.5kg';
    case 5: return '19.0kg';
    case 6: return '90.5kg';
    case 7: return '9.0kg';
    case 8: return '22.5kg';
    case 9: return '85.5kg';
    default: return null;
  }
};

const getPokemonStats = (id) => {
  if (!id) return null;
  switch(parseInt(id)) {
    case 1: return [
      { name: 'hp', value: 45 },
      { name: 'attack', value: 49 },
      { name: 'defense', value: 49 },
      { name: 'special-attack', value: 65 },
      { name: 'special-defense', value: 65 },
      { name: 'speed', value: 45 }
    ];
    case 2: return [
      { name: 'hp', value: 60 },
      { name: 'attack', value: 62 },
      { name: 'defense', value: 63 },
      { name: 'special-attack', value: 80 },
      { name: 'special-defense', value: 80 },
      { name: 'speed', value: 60 }
    ];
    case 3: return [
      { name: 'hp', value: 80 },
      { name: 'attack', value: 82 },
      { name: 'defense', value: 83 },
      { name: 'special-attack', value: 100 },
      { name: 'special-defense', value: 100 },
      { name: 'speed', value: 80 }
    ];
    case 4: return [
      { name: 'hp', value: 39 },
      { name: 'attack', value: 52 },
      { name: 'defense', value: 43 },
      { name: 'special-attack', value: 60 },
      { name: 'special-defense', value: 50 },
      { name: 'speed', value: 65 }
    ];
    case 5: return [
      { name: 'hp', value: 58 },
      { name: 'attack', value: 64 },
      { name: 'defense', value: 58 },
      { name: 'special-attack', value: 80 },
      { name: 'special-defense', value: 65 },
      { name: 'speed', value: 80 }
    ];
    case 6: return [
      { name: 'hp', value: 78 },
      { name: 'attack', value: 84 },
      { name: 'defense', value: 78 },
      { name: 'special-attack', value: 109 },
      { name: 'special-defense', value: 85 },
      { name: 'speed', value: 100 }
    ];
    case 7: return [
      { name: 'hp', value: 44 },
      { name: 'attack', value: 48 },
      { name: 'defense', value: 65 },
      { name: 'special-attack', value: 50 },
      { name: 'special-defense', value: 64 },
      { name: 'speed', value: 43 }
    ];
    case 8: return [
      { name: 'hp', value: 59 },
      { name: 'attack', value: 63 },
      { name: 'defense', value: 80 },
      { name: 'special-attack', value: 65 },
      { name: 'special-defense', value: 80 },
      { name: 'speed', value: 58 }
    ];
    case 9: return [
      { name: 'hp', value: 79 },
      { name: 'attack', value: 83 },
      { name: 'defense', value: 100 },
      { name: 'special-attack', value: 85 },
      { name: 'special-defense', value: 105 },
      { name: 'speed', value: 78 }
    ];
    default: return null;
  }
};

export default CreatureCollection;