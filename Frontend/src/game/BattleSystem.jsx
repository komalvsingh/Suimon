import React, { useState, useEffect } from "react";

// BattleSystem component to handle all battle logic
const BattleSystem = ({
  // State props
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
  setShowPokemonChoice,
}) => {
  // Function to heal all Pokemon to full health
  const healAllPokemon = () => {
    if (playerTeam.length === 0) return;

    // Create a healed version of the team with full HP and reset energy
    const healedTeam = playerTeam.map((pokemon) => ({
      ...pokemon,
      currentHP: pokemon.maxHP,
      energy: 0, // Reset energy to 0 when healing
    }));

    // Update the active Pokemon if there is one
    if (
      playerPokemon &&
      activeTeamMember >= 0 &&
      activeTeamMember < healedTeam.length
    ) {
      const healedPokemon = healedTeam[activeTeamMember];
      setPlayerPokemon(healedPokemon);
    }

    // Update the team state
    setPlayerTeam(healedTeam);

    // Save to localStorage for persistence
    localStorage.setItem("pokemonTeam", JSON.stringify(healedTeam));

    // Update battle log
    setBattleLog((prev) => [...prev, "All Pokémon have been fully healed!"]);
  };

  // Function to update Pokemon state consistently across all locations
  const updatePokemonState = (pokemon, updates, teamIndex) => {
    // Create a copy of updates to avoid modifying the original object
    const updatesClone = { ...updates };

    // Add this check to ensure both health and energy are preserved
    if ("currentHP" in updatesClone && !("energy" in updatesClone)) {
      updatesClone.energy = pokemon.energy || 0;
    }
    if ("energy" in updatesClone && !("currentHP" in updatesClone)) {
      updatesClone.currentHP = pokemon.currentHP || 0;
    }
    const updatedPokemon = { ...pokemon, ...updatesClone };

    // Update the player's team with the updated Pokemon
    const updatedTeam = playerTeam.map((p, idx) =>
      idx === teamIndex ? updatedPokemon : p
    );

    // Update all state at once
    setPlayerTeam(updatedTeam);

    // If this is the active Pokemon, update playerPokemon state too
    if (teamIndex === activeTeamMember) {
      setPlayerPokemon(updatedPokemon);
    }

    // Only save complete team to localStorage when battle is not in progress
    // This prevents unnecessary localStorage operations during battle
    if (!battleInProgress) {
      localStorage.setItem("pokemonTeam", JSON.stringify(updatedTeam));
    }

    return updatedPokemon;
  };

  // Function to update gym Pokemon state
  const updateGymPokemonState = (pokemon, updates, index) => {
    // Create a copy of updates to avoid modifying the original object
    const updatesClone = { ...updates };

    // Always ensure both health and energy are preserved
    // If energy is not in updates, preserve the current energy
    if (!("energy" in updatesClone)) {
      updatesClone.energy = pokemon.energy !== undefined ? pokemon.energy : 0;
    }

    // If currentHP is not in updates, preserve the current HP
    if (!("currentHP" in updatesClone)) {
      updatesClone.currentHP =
        pokemon.currentHP !== undefined
          ? pokemon.currentHP
          : pokemon.maxHP || 100;
    }

    // Create updated Pokemon with new values
    const updatedPokemon = { ...pokemon, ...updatesClone };

    // Update the gym Pokemon array
    const updatedGymPokemon = [...currentGymPokemon];
    updatedGymPokemon[index] = updatedPokemon;

    // Update state
    setCurrentGymPokemon(updatedGymPokemon);

    // Directly update the opponent state to ensure UI reflects changes immediately
    setOpponent(updatedPokemon);

    return updatedPokemon;
  };

  // Function to check if a Pokemon can evolve
  const checkEvolution = (pokemon) => {
    const evo = evolutions[pokemon.baseForm];
    if (!evo) return pokemon.name;

    if (evo.levelNeeded[1] && pokemon.level >= evo.levelNeeded[1]) {
      return evo.stage2;
    } else if (evo.levelNeeded[0] && pokemon.level >= evo.levelNeeded[0]) {
      return evo.stage1;
    }

    return pokemon.name;
  };

  // Function to add experience to a Pokemon and handle level ups
  const addExperience = (pokemon, expAmount) => {
    // Add experience
    let newExp = pokemon.exp + expAmount;
    let newLevel = pokemon.level;
    let evolved = false;
    let evolutionName = null;

    // Check for level up
    while (newLevel < 30 && newExp >= expForLevel[newLevel]) {
      newLevel++;
      setBattleLog((prev) => [
        ...prev,
        `${pokemon.name} grew to level ${newLevel}!`,
      ]);

      // Check for evolution at new level
      const possibleEvolution = checkEvolution({
        ...pokemon,
        level: newLevel,
      });

      if (
        possibleEvolution.toLowerCase() !== pokemon.name.toLowerCase() &&
        !evolved
      ) {
        evolved = true;
        evolutionName = possibleEvolution;

        // Mark this Pokemon as evolved in localStorage
        const evolvedPokemon = JSON.parse(
          localStorage.getItem("pokemonEvolved") || "[]"
        );
        if (!evolvedPokemon.includes(pokemon.tokenId)) {
          evolvedPokemon.push(pokemon.tokenId);
          localStorage.setItem(
            "pokemonEvolved",
            JSON.stringify(evolvedPokemon)
          );
        }
        setBattleLog((prev) => [
          ...prev,
          `Congratulations! ${pokemon.name} evolved into ${possibleEvolution}!`,
        ]);
        // Fetch the image for the evolved Pokemon and update state
        fetchPokemonImage(possibleEvolution.toLowerCase());
      }
    }

    // Return updated Pokemon data
    return {
      ...pokemon,
      exp: newExp,
      level: newLevel,
      name: evolved ? evolutionName : pokemon.name,
      baseForm: evolved ? evolutionName.toLowerCase() : pokemon.baseForm, // Update baseForm when evolved
      maxHP: 100 + newLevel * 5, // Increase max HP with level
      currentHP: pokemon.currentHP, // Keep current HP the same
    };
  };

  // Function to handle battle win
  const handleWin = () => {
    setBattleInProgress(false);
    setOpponent(null);
    setGymPokemonIndex(0);

    // Update badge count and save to localStorage
    const newBadgeCount = badgeCount + 1;
    setBadgeCount(newBadgeCount);
    localStorage.setItem("gymBadges", newBadgeCount);

    // Update current gym index and save to localStorage
    const newGymIndex = currentGymIndex + 1;
    setCurrentGymIndex(newGymIndex);
    localStorage.setItem("currentGymIndex", newGymIndex);

    // Save the current team state to localStorage now that battle is over
    localStorage.setItem("pokemonTeam", JSON.stringify(playerTeam));

    // Add victory messages to battle log
    setBattleLog((prev) => [
      ...prev,
      `Congratulations! You've defeated ${kantoGyms[currentGymIndex].leader}!`,
      `You've earned the ${kantoGyms[currentGymIndex].badge}!`,
    ]);
    
    // Check if there's a Pokemon choice available for this gym badge
    const choiceOffer = pokemonChoicesByGym.find(choice => choice.gym === newBadgeCount);
    if (choiceOffer) {
      // Check if player already has these Pokemon
      const alreadyHasPokemon = playerTeam.some(pokemon => 
        choiceOffer.choices.includes(pokemon.name)
      );
      
      if (!alreadyHasPokemon) {
        // Set Pokemon choices and show the choice modal immediately
        setPokemonChoices(choiceOffer.choices);
        setShowPokemonChoice(true);
        setBattleLog(prev => [...prev, choiceOffer.description]);
      }
    }
  };

  // Function to handle player attacks
  const attack = (index) => {
    if (!playerPokemon || !opponent) {
      console.error("Missing player Pokemon or opponent data");
      return;
    }
  
    const atk = playerPokemon.attacks[index];
    
    // Player stats with fallbacks
    let playerCurrentHP = playerPokemon.currentHP !== undefined ? playerPokemon.currentHP : playerPokemon.maxHP || 100;
    let playerCurrentEnergy = playerPokemon.energy !== undefined ? playerPokemon.energy : 0;
    
    // Opponent stats with fallbacks
    let opponentCurrentHP = opponent.currentHP !== undefined ? opponent.currentHP : opponent.maxHP || 100;
    let opponentCurrentEnergy = opponent.energy !== undefined ? opponent.energy : 0;
  
    // Check energy for attack
    if (playerCurrentEnergy >= atk.energy) {
      // Calculate damage
      const levelBonus = 1 + (playerPokemon.level || 1) * 0.05;
      const damageMultiplier = (0.9 + Math.random() * 0.2) * levelBonus;
      const damageDealt = Math.floor(atk.damage * damageMultiplier);
      
      // Update opponent HP
      opponentCurrentHP = Math.max(0, opponentCurrentHP - damageDealt);
      
      // Update player energy (consume then gain 1)
      playerCurrentEnergy = Math.max(0, playerCurrentEnergy - atk.energy);
      playerCurrentEnergy = Math.min(3, playerCurrentEnergy + 1);
      
      // Opponent does not gain energy from being attacked
      
      // Update player state
      const updatedPlayer = updatePokemonState(
        playerPokemon,
        {
          currentHP: playerCurrentHP,  // Preserve player HP (not changed in attack)
          energy: playerCurrentEnergy
        },
        activeTeamMember
      );
      
      // Update battle log
      setBattleLog((prev) => [
        ...prev,
        `${playerPokemon.name} used ${atk.name} for ${damageDealt} damage!`
      ]);
      
      // Create updated opponent
      const updatedOpponent = {
        ...opponent,
        currentHP: opponentCurrentHP,
        energy: opponentCurrentEnergy
      };
      
      // Update opponent based on battle type
      if (opponent.isGymLeader) {
        updateGymPokemonState(
          opponent,
          { currentHP: opponentCurrentHP, energy: opponentCurrentEnergy },
          gymPokemonIndex
        );
      } else if (wildEncounterActive) {
        setOpponent(updatedOpponent);
        setWildPokemon(updatedOpponent);
      }
      
      // Check for opponent faint
      if (opponentCurrentHP <= 0) {
        setBattleLog((prev) => [...prev, `${opponent.name} fainted!`]);
        if (opponent.isGymLeader) {
          // Check if there are more Pokémon in the gym leader's team
          const nextGymPokemonIndex = gymPokemonIndex + 1;
          if (nextGymPokemonIndex < currentGymPokemon.length) {
            // Move to the next Pokémon in the gym leader's team
            setBattleLog((prev) => [
              ...prev,
              `${kantoGyms[currentGymIndex].leader} sends out ${currentGymPokemon[nextGymPokemonIndex].name}!`
            ]);
            setGymPokemonIndex(nextGymPokemonIndex);
            setOpponent(currentGymPokemon[nextGymPokemonIndex]);
          } else {
            // All gym Pokémon have been defeated, now we can declare victory
            handleWin();
          }
        } else if (wildEncounterActive) {
          setWildEncounterActive(false);
          setBattleInProgress(false);
          
          // Add experience
          const expEarned = baseExpGain * opponent.level;
          setExpGained(expEarned);
          const updatedPokemon = addExperience(updatedPlayer, expEarned);
          updatePokemonState(updatedPokemon, {}, activeTeamMember);
          
          setBattleLog((prev) => [
            ...prev,
            `${playerPokemon.name} gained ${expEarned} experience!`
          ]);
        }
      } else {
        // Opponent's counter-attack
        setTimeout(() => {
          // Select a random attack for the opponent
          const opponentAttacks = opponent.attacks || [];
          if (opponentAttacks.length === 0) return;

          // Filter attacks that opponent has energy for
          const availableAttacks = opponentAttacks.filter(
            (a) => a.energy === 0 || opponentCurrentEnergy >= a.energy
          );
          const randomAttack =
            availableAttacks.length > 0
              ? availableAttacks[
                  Math.floor(Math.random() * availableAttacks.length)
                ]
              : opponentAttacks[0];

          // Calculate opponent's damage
          const oppLevelBonus = 1 + (opponent.level || 1) * 0.05;
          const oppDamageMultiplier = (0.9 + Math.random() * 0.2) * oppLevelBonus;
          const oppDamageDealt = Math.floor(randomAttack.damage * oppDamageMultiplier);

          // Update player HP
          const newPlayerHP = Math.max(0, playerCurrentHP - oppDamageDealt);

          // Update opponent energy
          if (randomAttack.energy > 0) {
            opponentCurrentEnergy = Math.max(0, opponentCurrentEnergy - randomAttack.energy);
          }
          opponentCurrentEnergy = Math.min(3, opponentCurrentEnergy + 1);

          // Update battle log for opponent's attack
          setBattleLog((prev) => [
            ...prev,
            `${opponent.name} used ${randomAttack.name} for ${oppDamageDealt} damage!`
          ]);

          // Update player state with new HP
          const finalPlayerUpdate = updatePokemonState(
            updatedPlayer,
            { currentHP: newPlayerHP },
            activeTeamMember
          );

          // Update opponent energy state
          if (opponent.isGymLeader) {
            updateGymPokemonState(
              updatedOpponent,
              { energy: opponentCurrentEnergy },
              gymPokemonIndex
            );
          } else if (wildEncounterActive) {
            setOpponent({ ...updatedOpponent, energy: opponentCurrentEnergy });
            setWildPokemon({ ...updatedOpponent, energy: opponentCurrentEnergy });
          }

          // Check if player Pokemon fainted
          if (newPlayerHP <= 0) {
            setBattleLog((prev) => [
              ...prev,
              `${playerPokemon.name} fainted!`
            ]);
            const alivePokemon = playerTeam.filter(
              (p, idx) => idx !== activeTeamMember && p.currentHP > 0
            );
            if (alivePokemon.length > 0) {
              setShowSwitchModal(true);
            } else {
              setBattleInProgress(false);
              setOpponent(null);
              setGymPokemonIndex(0);
              setBattleLog((prev) => [
                ...prev,
                "All your Pokemon have fainted! You lost the battle.",
                "Visit the Pokemon Center to heal your team."
              ]);
            }
          }
        }, 1000);
      }
    } else {
      setBattleLog((prev) => [
        ...prev,
        `${playerPokemon.name} doesn't have enough energy for ${atk.name}!`
      ]);
    }
  };  
  // Function to switch active Pokemon
  const switchPokemon = (newIndex) => {
    if (newIndex === activeTeamMember || playerTeam[newIndex].currentHP <= 0) return;
    // Always create a new array and update only the intended index
    setPlayerTeam(prevTeam => {
      const updatedTeam = prevTeam.map((pokemon, idx) => ({
        ...pokemon,
        isActive: idx === newIndex
      }));
      // Update playerPokemon to the new active one
      setPlayerPokemon(updatedTeam[newIndex]);
      // Save to localStorage
      localStorage.setItem("pokemonTeam", JSON.stringify(updatedTeam));
      return updatedTeam;
    });
    setActiveTeamMember(newIndex);
    setShowSwitchModal(false);
    setBattleLog(prev => [...prev, `Switched to ${playerTeam[newIndex].name}!`]);
  };

  // Return all battle-related functions and state
  return {
    healAllPokemon,
    updatePokemonState,
    updateGymPokemonState,
    checkEvolution,
    addExperience,
    handleWin,
    attack,
    switchPokemon,
  };
};

export default BattleSystem;