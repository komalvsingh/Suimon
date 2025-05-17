import React, { useState, useEffect } from "react";
import BattleSystem from "./BattleSystem";
import BattleUI from "./BattleUI";
import { kantoGyms } from "../data/pokemonGyms";
import { 
  attacks, 
  evolutions, 
  expForLevel, 
  pokemonChoicesByGym, 
  baseExpGain,
  getType 
} from "../data/pokemonGameData";

const PokemonGymBrawler = () => {
  // playerPokemon represents the active Pokemon and is used by BattleSystem
  const [playerPokemon, setPlayerPokemon] = useState(null);
  const [playerTeam, setPlayerTeam] = useState([]);
  const [activeTeamMember, setActiveTeamMember] = useState(0);
  const [opponent, setOpponent] = useState(null);
  const [gymPokemonIndex, setGymPokemonIndex] = useState(0);
  const [currentGymPokemon, setCurrentGymPokemon] = useState([]);
  const [battleLog, setBattleLog] = useState([]);
  const [currentGymIndex, setCurrentGymIndex] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [pokemonImages, setPokemonImages] = useState({});
  const [loadingImages, setLoadingImages] = useState(false);
  const [showPokemonChoice, setShowPokemonChoice] = useState(false);
  const [pokemonChoices, setPokemonChoices] = useState([]);
  const [battleInProgress, setBattleInProgress] = useState(false);
  const [expGained, setExpGained] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showStarterSelection, setShowStarterSelection] = useState(false);

  // Wild encounter states
  const [wildEncounterActive, setWildEncounterActive] = useState(false);
  const [wildPokemon, setWildPokemon] = useState(null);

  const handleReset = () => {
    localStorage.removeItem("gymBadges");
    localStorage.removeItem("currentGymIndex");
    localStorage.removeItem("pokemonTeam");
    localStorage.removeItem("pokemonWins");
    localStorage.removeItem("pokemonEvolved");

    // Reset state
    setBadgeCount(0);
    setCurrentGymIndex(0);
    setPlayerTeam([]);
    setShowPokemonChoice(false);
    setBattleLog(["Game progress has been reset!"]);
    setShowResetConfirm(false);
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
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  };

  // Load saved state from localStorage
  useEffect(() => {
    const savedBadges = localStorage.getItem("gymBadges");
    const savedGymIndex = localStorage.getItem("currentGymIndex");
    const savedTeam = localStorage.getItem("pokemonTeam");

    if (savedBadges) setBadgeCount(parseInt(savedBadges));
    if (savedGymIndex) setCurrentGymIndex(parseInt(savedGymIndex));

    const checkPokemonChoices = (team) => {
      const currentBadgeCount = savedBadges ? parseInt(savedBadges) : 0;
      const choiceOffer = pokemonChoicesByGym.find(
        (choice) =>
          choice.gym === currentBadgeCount &&
          !team.some((pokemon) => choice.choices.includes(pokemon.name))
      );

      if (choiceOffer) {
        setPokemonChoices(choiceOffer.choices);
        setShowPokemonChoice(true);
      }
    };

    const initializeGame = () => {
      if (playerPokemon) return;
      
      // Check if we have a saved team
      if (savedTeam) {
        const team = JSON.parse(savedTeam);
        setPlayerTeam(team);
        
        // Set the active Pokemon
        const activeIndex = team.findIndex(p => p.isActive);
        if (activeIndex !== -1) {
          setPlayerPokemon(team[activeIndex]);
          setActiveTeamMember(activeIndex);
        } else if (team.length > 0) {
          // If no active Pokemon, set the first one as active
          const updatedTeam = team.map((pokemon, index) => ({
            ...pokemon,
            isActive: index === 0
          }));
          setPlayerTeam(updatedTeam);
          setPlayerPokemon(updatedTeam[0]);
          localStorage.setItem("pokemonTeam", JSON.stringify(updatedTeam));
        }
        
        // Check if player should be offered a Pokemon choice
        checkPokemonChoices(team);
        
        // Fetch images for all Pokemon
        team.forEach(pokemon => {
          fetchPokemonImage(pokemon.baseForm);
        });
      } else {
        // No saved team, show starter selection
        setShowStarterSelection(true);
        setBattleLog(["Welcome to the Pokemon Gym Brawler! Choose your starter Pokemon."]);
      }
    };

    initializeGame();
  }, [playerPokemon, badgeCount]);

  const fetchPokemonImage = async (name) => {
    if (!name) return null;
    
    const normalizedName = name.toLowerCase().trim();
    
    try {
      if (pokemonImages[normalizedName]) {
        return pokemonImages[normalizedName];
      }

      setLoadingImages(true);
      let pokemonId;

      if (normalizedName.includes("char")) {
        pokemonId = normalizedName === "charmander" ? 4 : normalizedName === "charmeleon" ? 5 : 6;
      } else if (normalizedName.includes("squirt") || normalizedName.includes("blast")) {
        pokemonId = normalizedName === "squirtle" ? 7 : normalizedName === "wartortle" ? 8 : 9;
      } else if (
        normalizedName.includes("bulb") ||
        normalizedName.includes("ivy") ||
        normalizedName.includes("venu")
      ) {
        pokemonId = normalizedName === "bulbasaur" ? 1 : normalizedName === "ivysaur" ? 2 : 3;
      } else {
        try {
          const response = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${normalizedName}`
          );
          if (response.ok) {
            const data = await response.json();
            pokemonId = data.id;
          }
        } catch (err) {
          console.error(`Could not find Pokemon ID for ${normalizedName}:`, err);
        }
      }

      if (pokemonId) {
        const dreamWorldUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${pokemonId}.svg`;

        const imageExists = await fetch(dreamWorldUrl, { method: "HEAD" })
          .then((res) => res.ok)
          .catch(() => false);

        let imageUrl;
        if (imageExists) {
          imageUrl = dreamWorldUrl;
        } else {
          imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
          
          const officialArtExists = await fetch(imageUrl, { method: "HEAD" })
            .then((res) => res.ok)
            .catch(() => false);
            
          if (!officialArtExists) {
            imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
          }
        }
        
        if (imageUrl) {
          setPokemonImages((prev) => {
            if (prev[normalizedName] !== imageUrl) {
              return {
                ...prev,
                [normalizedName]: imageUrl,
              };
            }
            return prev;
          });
          
          return imageUrl;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching Pokemon image:", error);
      return null;
    } finally {
      setLoadingImages(false);
    }
  };

  const createNewPokemon = (name, baseForm) => {
    const type = getType(name.toLowerCase());
    const newPokemon = {
      name: name,
      baseForm: baseForm || name.toLowerCase(),
      level: 1,
      exp: 0,
      type,
      attacks: attacks[type] || attacks.normal,
      energy: 0,
      currentHP: 100,
      maxHP: 100,
      isActive: false,
      id: `pokemon-${Date.now()}`,
    };

    fetchPokemonImage(name.toLowerCase());
    return newPokemon;
  };
  
  const handleStarterSelection = (starter) => {
    // Create the starter Pokemon
    const starterPokemon = {
      name: starter,
      baseForm: starter.toLowerCase(),
      level: 1,
      exp: 0,
      type: getType(starter.toLowerCase()),
      attacks: attacks[getType(starter.toLowerCase())],
      energy: 0,
      currentHP: 100,
      maxHP: 100,
      isActive: true,
      id: `pokemon-${Date.now()}`,
    };
    
    // Set as player's Pokemon
    setPlayerPokemon(starterPokemon);
    
    // Add to team
    const newTeam = [starterPokemon];
    setPlayerTeam(newTeam);
    localStorage.setItem("pokemonTeam", JSON.stringify(newTeam));
    
    // Hide starter selection
    setShowStarterSelection(false);
    
    // Fetch image
    fetchPokemonImage(starter.toLowerCase());
    
    // Update battle log
    setBattleLog([`You chose ${starter} as your starter Pokemon!`, "Your journey begins now!"]);  
  };

  const handlePokemonChoice = (choice) => {
    const newPokemon = createNewPokemon(choice);
    const updatedTeam = [...playerTeam, newPokemon];

    setPlayerTeam(updatedTeam);
    setShowPokemonChoice(false);
    localStorage.setItem("pokemonTeam", JSON.stringify(updatedTeam));
    setBattleLog((prev) => [...prev, `${choice} joined your team!`]);
  };

  // Initialize battle system
  const battleSystem = BattleSystem({
    playerPokemon,
    setPlayerPokemon,
    playerTeam,
    setPlayerTeam,
    activeTeamMember,
    setActiveTeamMember,
    opponent,
    setOpponent,
    gymPokemonIndex,
    setGymPokemonIndex,
    currentGymPokemon,
    setCurrentGymPokemon,
    battleLog,
    setBattleLog,
    currentGymIndex,
    setCurrentGymIndex,
    badgeCount,
    setBadgeCount,
    battleInProgress,
    setBattleInProgress,
    expGained,
    setExpGained,
    showSwitchModal,
    setShowSwitchModal,
    wildEncounterActive,
    setWildEncounterActive,
    wildPokemon,
    setWildPokemon,
    kantoGyms,
    attacks,
    evolutions,
    expForLevel,
    baseExpGain,
    fetchPokemonImage,
    pokemonChoicesByGym,
    setPokemonChoices,
    setShowPokemonChoice
  });
  
  const { 
    updatePokemonState, 
    updateGymPokemonState, 
    checkEvolution, 
    addExperience, 
    healAllPokemon,
    handleWin,
    attack: attackFromSystem,
    switchPokemon 
  } = battleSystem;

  const attack = (index) => {
    attackFromSystem(index);
  };

  const startBattle = async () => {
    if (playerTeam.length === 0) {
      setBattleLog(["You need at least one Pokémon to battle!"]);
      return;
    }

    const gym = kantoGyms[currentGymIndex];
    setBattleInProgress(true);
    setGymPokemonIndex(0);

    const gymPokemonTeam = [];

    for (const pokemonName of gym.pokemon) {
      const type = getType(pokemonName.toLowerCase()) || gym.type || "normal";
      const difficultyMultiplier = 1 + gym.difficulty * 0.1 + badgeCount * 0.05;
      const gymPokemonHP = Math.floor(100 * difficultyMultiplier);
      const startingEnergy = Math.min(3, Math.floor(gym.difficulty / 3));

      const gymPokemon = {
        name: pokemonName,
        type,
        currentHP: gymPokemonHP,
        maxHP: gymPokemonHP,
        attacks: attacks[type],
        energy: startingEnergy, // Initialize with calculated energy based on difficulty
        difficulty: gym.difficulty,
        isGymLeader: true,
        level: 5 + gym.difficulty * 3,
      };

      await fetchPokemonImage(pokemonName.toLowerCase());
      gymPokemonTeam.push(gymPokemon);
    }
    
    setCurrentGymPokemon(gymPokemonTeam);
    
    if (gymPokemonTeam.length > 0) {
      setOpponent(gymPokemonTeam[0]);
    }
    
    if (playerTeam.length > 0 && activeTeamMember >= 0 && activeTeamMember < playerTeam.length) {
      const activePokemon = playerTeam[activeTeamMember];
      const startEnergy = Math.max(1, activePokemon.energy);
      updatePokemonState(activePokemon, { energy: startEnergy }, activeTeamMember);
    }
    
    setBattleLog([`You challenge ${gym.leader} at the ${gym.name}!`, `${gym.leader} sends out ${gymPokemonTeam[0].name}!`]);

    setCurrentGymPokemon(gymPokemonTeam);
    setOpponent(gymPokemonTeam[0]);

    const activeIndex = playerTeam.findIndex((p) => p.isActive);
    let activePlayerIndex = activeIndex;

    if (activeIndex === -1) {
      activePlayerIndex = 0;
      switchPokemon(0);
    } else {
      const currentPokemon = playerTeam[activeIndex];
      updatePokemonState(
        currentPokemon,
        { energy: 0 }, // Start with 0 energy
        activeIndex
      );
      setActiveTeamMember(activeIndex);
    }

    setBattleLog([
      `You challenge ${gym.leader} at ${gym.name}!`,
      `${gym.leader} sends out ${gymPokemonTeam[0].name}!`,
      `${gymPokemonTeam[0].name} looks tough with ${gymPokemonTeam[0].currentHP} HP!`,
      `Go, ${playerTeam[activePlayerIndex].name}!`,
    ]);
  };

  useEffect(() => {
    if (playerTeam && playerTeam.length > 0) {
      localStorage.setItem("pokemonTeam", JSON.stringify(playerTeam));
      
      const activeIndex = playerTeam.findIndex(p => p.isActive);
      if (activeIndex !== -1 && activeIndex !== activeTeamMember) {
        setActiveTeamMember(activeIndex);
        setPlayerPokemon(playerTeam[activeIndex]);
      }
    }
  }, [playerTeam, activeTeamMember]);

  const handleLoss = () => {
    setBattleInProgress(false);
    setOpponent(null);
    setCurrentGymPokemon([]);
    setGymPokemonIndex(0);

    if (wildEncounterActive) {
      setBattleLog((prev) => [
        ...prev,
        `You were defeated by the wild ${wildPokemon.name}! Try again when your Pokémon are stronger.`,
        `Battle complete! Your team has been partially healed.`,
      ]);
      setWildEncounterActive(false);
      setWildPokemon(null);
    } else {
      setBattleLog((prev) => [
        ...prev,
        `You were defeated by ${kantoGyms[currentGymIndex].leader}! Try again when your Pokémon are stronger.`,
        `Battle complete! Your team has been partially healed.`,
      ]);
    }

    playerTeam.forEach((pokemon, index) => {
      updatePokemonState(
        pokemon,
        { 
          currentHP: Math.floor(pokemon.maxHP / 2),
          energy: 0 
        },
        index
      );
    });
  };

  const wildPokemonList = [
    { name: "Rattata", type: "normal", level: 3, difficulty: 1 },
    { name: "Pidgey", type: "normal", level: 4, difficulty: 1 },
    { name: "Spearow", type: "normal", level: 5, difficulty: 2 },
    { name: "Ekans", type: "poison", level: 6, difficulty: 2 },
    { name: "Sandshrew", type: "ground", level: 8, difficulty: 3 },
    { name: "Nidoran", type: "poison", level: 9, difficulty: 3 },
    { name: "Jigglypuff", type: "normal", level: 10, difficulty: 3 },
    { name: "Zubat", type: "poison", level: 12, difficulty: 4 },
    { name: "Oddish", type: "grass", level: 13, difficulty: 4 },
    { name: "Paras", type: "bug", level: 14, difficulty: 4 },
    { name: "Venonat", type: "bug", level: 15, difficulty: 5 },
    { name: "Diglett", type: "ground", level: 16, difficulty: 5 },
    { name: "Meowth", type: "normal", level: 17, difficulty: 5 },
    { name: "Psyduck", type: "water", level: 18, difficulty: 6 },
    { name: "Mankey", type: "fighting", level: 19, difficulty: 6 },
    { name: "Growlithe", type: "fire", level: 20, difficulty: 6 },
    { name: "Poliwag", type: "water", level: 21, difficulty: 7 },
    { name: "Abra", type: "psychic", level: 22, difficulty: 7 },
    { name: "Machop", type: "fighting", level: 23, difficulty: 7 },
    { name: "Tentacool", type: "water", level: 24, difficulty: 8 },
    { name: "Ponyta", type: "fire", level: 25, difficulty: 8 },
  ];

  const startWildEncounter = () => {
    if (battleInProgress || playerTeam.length === 0) {
      return;
    }

    const maxDifficulty = Math.min(8, badgeCount + 3);
    const eligiblePokemon = wildPokemonList.filter(
      (p) => p.difficulty <= maxDifficulty
    );
    const randomPokemon =
      eligiblePokemon[Math.floor(Math.random() * eligiblePokemon.length)];

    const pokemonLevel = Math.max(
      1,
      Math.min(25, randomPokemon.level + Math.floor(badgeCount * 1.5))
    );
    const pokemonHP = 80 + pokemonLevel * 4;
    const pokemonType = randomPokemon.type || "normal";

    // Calculate starting energy based on difficulty
    const startingEnergy = Math.min(2, Math.floor(randomPokemon.difficulty / 3));
    
    const wildPokemonObj = {
      name: randomPokemon.name,
      type: pokemonType,
      level: pokemonLevel,
      currentHP: pokemonHP,
      maxHP: pokemonHP,
      attacks: attacks[pokemonType] || attacks.normal,
      energy: startingEnergy, // Initialize with calculated energy based on difficulty
      isWild: true,
      difficulty: randomPokemon.difficulty || 1,
    };

    fetchPokemonImage(randomPokemon.name.toLowerCase());

    setWildPokemon(wildPokemonObj);
    setOpponent(wildPokemonObj);
    setWildEncounterActive(true);
    setBattleInProgress(true);

    const activeIndex = playerTeam.findIndex((p) => p.isActive);
    let activePlayerIndex = activeIndex;
    
    if (activeIndex === -1) {
      activePlayerIndex = 0;
      switchPokemon(0);
    } else {
      const currentPokemon = playerTeam[activeIndex];
      updatePokemonState(
        currentPokemon,
        { energy: 0 }, // Start with 0 energy
        activeIndex
      );
      setActiveTeamMember(activeIndex);
    }

    setBattleLog([
      `A wild ${randomPokemon.name} appeared!`,
      `The wild ${randomPokemon.name} looks ready for battle with ${pokemonHP} HP!`,
      `Go, ${playerTeam[activeIndex !== -1 ? activeIndex : 0].name}!`,
    ]);
  };

  // Wallet connection has been removed, so we don't need to check for it anymore
  // If we need to add it back in the future, we can define walletConnected state here

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg shadow-lg max-w-md mx-auto mt-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-700">Loading your Pokémon...</p>
      </div>
    );
  }

  return (
    <BattleUI
      playerPokemon={playerPokemon}
      playerTeam={playerTeam}
      activeTeamMember={activeTeamMember}
      opponent={opponent}
      battleLog={battleLog}
      currentGymIndex={currentGymIndex}
      badgeCount={badgeCount}
      pokemonImages={pokemonImages}
      loadingImages={loadingImages}
      showPokemonChoice={showPokemonChoice}
      pokemonChoices={pokemonChoices}
      battleInProgress={battleInProgress}
      expGained={expGained}
      showResetConfirm={showResetConfirm}
      showSwitchModal={showSwitchModal}
      wildEncounterActive={wildEncounterActive}
      wildPokemon={wildPokemon}
      kantoGyms={kantoGyms}
      showStarterSelection={showStarterSelection}
      
      // Connect all event handlers properly
      onStarterSelection={handleStarterSelection}
      onPokemonChoice={handlePokemonChoice}
      onReset={handleReset}
      onHealTeam={healAllPokemon}
      onStartBattle={startBattle}
      onAttack={attack}
      onSwitchPokemon={switchPokemon}
      setShowResetConfirm={setShowResetConfirm}
      setShowSwitchModal={setShowSwitchModal}
      onRunFromWild={() => {
        setBattleInProgress(false);
        setWildEncounterActive(false);
        setWildPokemon(null);
        setBattleLog(prev => [...prev, "You ran away safely!"]);
      }}
      onCatchWild={() => {
        // Catching wild Pokemon has been disabled
        setBattleLog(prev => [...prev, "Catching wild Pokemon is not available in this version."]);
        
        /*
        // Simple catch mechanic - 50% chance to catch
        const catchSuccess = Math.random() > 0.5;
        
        if (catchSuccess && wildPokemon) {
          // Create a new Pokemon for the player's team
          const caughtPokemon = {
            name: wildPokemon.name,
            baseForm: wildPokemon.name.toLowerCase(),
            level: wildPokemon.level || 1,
            exp: 0,
            type: wildPokemon.type,
            attacks: wildPokemon.attacks,
            energy: 0,
            currentHP: Math.floor(wildPokemon.maxHP * 0.5), // Caught Pokemon has half HP
            maxHP: wildPokemon.maxHP,
            isActive: false,
            id: `pokemon-${Date.now()}`
          };
          
          // Add to team
          const updatedTeam = [...playerTeam, caughtPokemon];
          setPlayerTeam(updatedTeam);
          localStorage.setItem("pokemonTeam", JSON.stringify(updatedTeam));
          
          // End battle
          setBattleInProgress(false);
          setWildEncounterActive(false);
          setWildPokemon(null);
          setBattleLog(prev => [...prev, `You caught ${wildPokemon.name}!`, `${wildPokemon.name} joined your team!`]);
          
          // Fetch image for the caught Pokemon
          fetchPokemonImage(wildPokemon.name.toLowerCase());
        } else {
          // Failed to catch
          setBattleLog(prev => [...prev, `You tried to catch ${wildPokemon.name}, but it broke free!`]);
          
          // Wild Pokemon attacks after failed catch attempt
          if (wildPokemon && activePokemon) {
            const wildAttack = wildPokemon.attacks[Math.floor(Math.random() * wildPokemon.attacks.length)];
            const damage = Math.max(1, Math.floor(wildAttack.damage * (1 + wildPokemon.level * 0.1)));
            
            // Update player Pokemon HP
            const updatedHP = Math.max(0, activePokemon.currentHP - damage);
            updatePokemonState(activePokemon, { currentHP: updatedHP }, activeTeamMember);
            
            setBattleLog(prev => [...prev, `${wildPokemon.name} used ${wildAttack.name}!`, `${activePokemon.name} took ${damage} damage!`]);
            
            // Check if player Pokemon fainted
            if (updatedHP <= 0) {
              setBattleLog(prev => [...prev, `${activePokemon.name} fainted!`]);
              
              // Check if player has any Pokemon left
              const hasRemainingPokemon = playerTeam.some((p, idx) => idx !== activeTeamMember && p.currentHP > 0);
              
              if (hasRemainingPokemon) {
                setShowSwitchModal(true);
              } else {
                handleLoss();
              }
            }
          }
        }
        */
      }}
      startWildEncounter={startWildEncounter}
    />
  );
};

export default PokemonGymBrawler;