import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { RiExpandHeightLine } from "react-icons/ri";
import { LiaWeightHangingSolid } from "react-icons/lia";

// Import metadata for NFT starters
import bulbasaurMetadata from '../assets/metadata/bulbasaur.json';
import charmanderMetadata from '../assets/metadata/charmander.json';
import squirtleMetadata from '../assets/metadata/squirtle.json';

const typeColors = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

// Constants for Pokemon IDs
const BULBASAUR_ID = 1;
const CHARMANDER_ID = 4;
const SQUIRTLE_ID = 7;
const STARTER_IDS = [BULBASAUR_ID, CHARMANDER_ID, SQUIRTLE_ID];

function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const MAX_POKEMONS = 151;
  const pokemonId = parseInt(id, 10);

  const [pokemon, setPokemon] = useState(null);
  const [pokemonSpecies, setPokemonSpecies] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStarter, setIsStarter] = useState(false);
  const [localMetadata, setLocalMetadata] = useState(null);

  // Check if the Pokemon is a starter (NFT) or regular Pokemon
  useEffect(() => {
    if (isNaN(pokemonId)) {
      setError("Invalid Pokemon ID");
      setIsLoading(false);
      return;
    }

    // Check if this is one of our starter NFTs
    if (STARTER_IDS.includes(pokemonId)) {
      setIsStarter(true);
      // Use local metadata for starters
      switch (pokemonId) {
        case BULBASAUR_ID:
          setLocalMetadata(bulbasaurMetadata);
          break;
        case CHARMANDER_ID:
          setLocalMetadata(charmanderMetadata);
          break;
        case SQUIRTLE_ID:
          setLocalMetadata(squirtleMetadata);
          break;
        default:
          break;
      }
    }
    
    // Continue with regular Pokemon data loading
    if (pokemonId < 1 || pokemonId > MAX_POKEMONS) {
      navigate("/");
      return;
    }

    setIsLoading(true);
    loadPokemon(pokemonId);
  }, [pokemonId, navigate]);

  const loadPokemon = async (id) => {
    try {
      const [pokemonData, speciesData] = await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((res) => {
          if (!res.ok) throw new Error(`Pokemon API error: ${res.status}`);
          return res.json();
        }),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then((res) => {
          if (!res.ok) throw new Error(`Species API error: ${res.status}`);
          return res.json();
        }),
      ]);

      setPokemon(pokemonData);
      setPokemonSpecies(speciesData);
      setIsLoading(false);
    } catch (error) {
      console.error("An error occurred while fetching Pokemon data:", error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const navigateToPokemon = (newId) => {
    navigate(`/detail/${newId}`);
  };

  const getEnglishFlavorText = (species) => {
    if (!species) return "";
    for (let entry of species.flavor_text_entries) {
      if (entry.language.name === "en") {
        let flavor = entry.flavor_text.replace(/\f/g, " ");
        return flavor;
      }
    }
    return "";
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const getStatNameMapping = {
    hp: "HP",
    attack: "ATK",
    defense: "DEF",
    "special-attack": "SATK",
    "special-defense": "SDEF",
    speed: "SPD",
  };

  const rgbaFromHex = (hexColor) => {
    return [
      parseInt(hexColor.slice(1, 3), 16),
      parseInt(hexColor.slice(3, 5), 16),
      parseInt(hexColor.slice(5, 7), 16),
    ].join(", ");
  };

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  if (!pokemon || !pokemonSpecies) {
    return <div className="not-found-container">Pokemon not found</div>;
  }

  // Get the main type color
  const mainType = pokemon.types[0].type.name;
  const color = typeColors[mainType] || "#A8A878"; // Default to normal if type not found
  const rgbaColor = rgbaFromHex(color);

  // Custom image URL for starters (NFTs)
  const getImageUrl = () => {
    if (isStarter && localMetadata) {
      return localMetadata.image;
    }
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${pokemonId}.svg`;
  };

  return (
    <main
      className="detail-main main"
      style={{ backgroundColor: color, borderColor: color }}
    >
      <header className="header">
        <div className="header-wrapper">
          <div className="header-wrap">
            <Link to="/" className="back-btn-wrap">
              <IoIosArrowBack className="text-3xl" />
            </Link>
            <div className="name-wrap">
              <h1 className="name">{capitalizeFirstLetter(pokemon.name)}</h1>
              {isStarter && <span className="nft-badge">NFT</span>}
            </div>
          </div>
          <div className="pokemon-id-wrap">
            <p className="body2-fonts text-3xl">
              #{String(pokemon.id).padStart(3, "0")}
            </p>
          </div>
        </div>
      </header>
      <div className="featured-img">
        {pokemonId > 1 && (
          <button
            className="arrow left-arrow"
            onClick={() => navigateToPokemon(pokemonId - 1)}
          >
            <IoIosArrowBack className="text-3xl" />
          </button>
        )}
        <div className="detail-img-wrapper">
          <img
            src={getImageUrl()}
            alt={pokemon.name}
            onError={(e) => {
              // Fallback image if the main one fails to load
              e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
            }}
          />
        </div>
        {pokemonId < MAX_POKEMONS && (
          <button
            className="arrow right-arrow"
            onClick={() => navigateToPokemon(pokemonId + 1)}
          >
            <IoIosArrowForward className="text-3xl" />
          </button>
        )}
      </div>
      <div className="detail-card-detail-wrapper">
        <div className="power-wrapper">
          {pokemon.types.map((typeInfo) => (
            <p
              key={typeInfo.type.name}
              className={`body3-fonts type ${typeInfo.type.name}`}
              style={{ backgroundColor: color }}
            >
              {typeInfo.type.name}
            </p>
          ))}
        </div>
        <p className="body2-fonts about-text">About</p>
        <div className="pokemon-detail-wrapper text-2xl">
          <div className="pokemon-detail-wrap">
            <div className="pokemon-detail text-4xl">
              <LiaWeightHangingSolid />
              <p className="body3-fonts weight text-4xl">{pokemon.weight / 10}kg</p>
            </div>
            <p className="caption-fonts">Weight</p>
          </div>
          <div className="pokemon-detail-wrap">
            <div className="pokemon-detail">
              <RiExpandHeightLine />
              <p className="body3-fonts height">{pokemon.height / 10}m</p>
            </div>
            <p className="caption-fonts">Height</p>
          </div>
          <div className="pokemon-detail-wrap">
            <div className="pokemon-detail move">
              {pokemon.abilities.map((abilityInfo) => (
                <p key={abilityInfo.ability.name} className="body3-fonts">
                  {capitalizeFirstLetter(abilityInfo.ability.name)}
                </p>
              ))}
            </div>
            <p className="caption-fonts">Move</p>
          </div>
        </div>
        <p className="body3-fonts pokemon-description">
          {isStarter && localMetadata ? localMetadata.description : getEnglishFlavorText(pokemonSpecies)}
        </p>
        <p className="body2-fonts about-text">Base Stats</p>
        <div className="stats-wrapper">
          {pokemon.stats.map((statInfo) => (
            <div
              key={statInfo.stat.name}
              className="stats-wrap"
              data-stat={statInfo.stat.name}
            >
              <p className="body3-fonts stats" style={{ color: color }}>
                {getStatNameMapping[statInfo.stat.name]}
              </p>
              <p className="body3-fonts">
                {String(statInfo.base_stat).padStart(3, "0")}
              </p>
              <progress
                value={statInfo.base_stat}
                max="100"
                className="progress-bar"
                style={{ 
                  "--progress-color": color,
                  "--progress-bg-color": `rgba(${rgbaColor}, 0.5)`
                }}
              />
            </div>
          ))}
        </div>
      </div>
      <img src="/assets/pokedex.svg" alt="pokedex" className="detail-bg" />
    </main>
  );
}

export default DetailPage;