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

  const loadPokemonDetails = async (name) => {
    try {
      const formattedName = name.toLowerCase().replace(/\s+/g, '-');
      const [pokemonData, speciesData] = await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${formattedName}`).then(res => {
          if (!res.ok) throw new Error(`Pokemon API error: ${res.status}`);
          return res.json();
        }),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${formattedName}`).then(res => {
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

  const fetchCreature = async () => {
    if (!wallet.connected || !wallet.account) {
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
        setCreature(null);
        return;
      }

      const creatureNfts = nfts.data.filter(obj => {
        const type = obj.data?.type;
        return type && (
          type.includes('starter_nft') ||
          type.includes('suimon') ||
          type.includes('pokemon') ||
          type.includes('poki') ||
          type.includes('nft')
        );
      });

      if (creatureNfts.length === 0) {
        setError(`Found ${nfts.data.length} NFTs, but none match creature types.`);
        setCreature(null);
        return;
      }

      // Get the first creature NFT (assuming only one exists)
      const nft = creatureNfts[0].data;
      const content = nft.content?.fields || {};
      const display = nft.display?.data?.fields || {};

      const creatureData = {
        id: nft.objectId,
        name: content.name || display.name || 'Unnamed Creature',
        type: content.type || content.pokemon_type || getPokemonType(content.pokemon_id) || 'Unknown',
        level: content.level || content.evolution_stage || 1,
        power: content.power || content.experience || 0,
        image: content.image || content.image_url || display.image_url || '',
      };

      setCreature(creatureData);
      
      // Load additional details from PokeAPI
      const details = await loadPokemonDetails(creatureData.name);
      setPokemonDetails(details);
    } catch (err) {
      setError(`Failed to load NFT: ${err.message}`);
      setCreature(null);
    } finally {
      setIsLoading(false);
    }
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
      fetchCreature();
    }
  }, [wallet]);

  return (
    <div className="max-w-3xl mx-auto p-4">
      {!wallet.account ? (
        <div className="bg-surface p-6 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="mb-4">Please connect your wallet to view your SuiMon creature.</p>
          <ConnectButton />
        </div>
      ) : isLoading ? (
        <div className="bg-surface p-6 rounded-lg shadow text-center">
          <p>Loading your creature...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg text-red-500 mb-4">
              <p>{error}</p>
              <button 
                onClick={fetchCreature}
                className="mt-2 text-sm underline hover:text-primary"
              >
                Try Again
              </button>
            </div>
          )}

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
                    {pokemonDetails?.genus || 'Unknown creature'}
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
                        {pokemonDetails?.description || 'No description available'}
                      </p>
                    </div>
                    <button
                      onClick={fetchCreature}
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
                              type === 'fire' ? 'bg-red-500/20 text-red-500' :
                              type === 'water' ? 'bg-blue-500/20 text-blue-500' :
                              type === 'grass' ? 'bg-green-500/20 text-green-500' :
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
                        {(pokemonDetails?.abilities || ['Unknown']).map((ability, i) => (
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
                        {pokemonDetails?.height ? `${pokemonDetails.height / 10}m` : '?'}
                      </p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                      <p className="text-xs text-gray-400">Weight</p>
                      <p className="font-bold">
                        {pokemonDetails?.weight ? `${pokemonDetails.weight / 10}kg` : '?'}
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

                  {pokemonDetails?.stats && (
                    <div className="mt-6">
                      <h4 className="font-bold mb-3">Stats</h4>
                      <div className="space-y-2">
                        {pokemonDetails.stats.map(stat => (
                          <div key={stat.stat.name} className="flex items-center">
                            <span className="w-24 text-sm text-gray-400 capitalize">
                              {stat.stat.name.replace('-', ' ')}
                            </span>
                            <div className="flex-1 bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${Math.min(100, (stat.base_stat / 255) * 100)}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-sm ml-2">
                              {stat.base_stat}
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

          {!creature && !error && (
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

export default CreatureCollection;