import React, { useState, useEffect } from 'react';
import BattleUI from './BattleUI';
import { pokemonData } from './pokemonBrawlData';
import { specialCards } from './specialCards';
import './PokemonBrawl.css';

const PokemonBattle = () => {
  // Game state
  const [playerPokemon, setPlayerPokemon] = useState({
    name: 'Pikachu',
    type: 'Electric',
    level: 1,
    maxHP: 2000,
    currentHP: 2000,
    attacks: [
      { name: 'Thunder Shock', damage: 350, cooldown: 0, currentCooldown: 0 },
      { name: 'Electro Ball', damage: 450, cooldown: 1, currentCooldown: 0 },
    ],
    unlocked: {
      voltTackle: false,
      gigavoltHavoc: false
    }
  });

  const [enemyPokemon, setEnemyPokemon] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [battleActive, setBattleActive] = useState(false);
  const [battleLog, setBattleLog] = useState([]);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [availableCards, setAvailableCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  
  // Initialize enemy based on current level
  useEffect(() => {
    if (currentLevel > 0 && currentLevel <= pokemonData.enemies.length) {
      const enemy = pokemonData.enemies[currentLevel - 1];
      setEnemyPokemon({
        ...enemy,
        currentHP: enemy.maxHP,
        attacks: enemy.attacks.map(attack => ({
          ...attack,
          currentCooldown: 0
        }))
      });
    }
  }, [currentLevel]);

  // Generate random cards at the start of each turn
  useEffect(() => {
    if (battleActive && playerTurn) {
      if (availableCards.length === 0) {
        generateRandomCards();
      }
      // We no longer call updateCardsAfterSelection here
      // as it's now handled directly in handleAttack and handleDefend
    }
  }, [battleActive, playerTurn]);

  // Generate 3 random cards from the available special cards
  const generateRandomCards = () => {
    const cards = [];
    const allCards = [...specialCards];
    
    for (let i = 0; i < 3; i++) {
      if (allCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * allCards.length);
        cards.push(allCards[randomIndex]);
        allCards.splice(randomIndex, 1);
      }
    }
    
    setAvailableCards(cards);
  };

  // Update cards after selection, keeping 2 existing cards and drawing a new one
  const updateCardsAfterSelection = () => {
    if (selectedCard) {
      // Remove the selected card from available cards
      const remainingCards = availableCards.filter(card => card.name !== selectedCard.name);
      
      // Get all possible cards excluding the ones currently in hand
      const allCards = [...specialCards];
      const availableNewCards = allCards.filter(card => 
        !remainingCards.some(rc => rc.name === card.name)
      );
      
      // Add a new random card if possible
      if (availableNewCards.length > 0 && remainingCards.length < 3) {
        const randomIndex = Math.floor(Math.random() * availableNewCards.length);
        const newCard = availableNewCards[randomIndex];
        setAvailableCards([...remainingCards, newCard]);
        addToBattleLog(`Drew a new ${newCard.name} card!`);
      } else {
        // If no new cards available, just keep the remaining cards
        setAvailableCards(remainingCards);
        if (remainingCards.length < 3) {
          addToBattleLog('No more cards available to draw!');
        }
      }
    }
  };

  // Start a new battle
  const startBattle = () => {
    setBattleActive(true);
    setPlayerTurn(true);
    setBattleLog(['Battle started! Pikachu vs ' + enemyPokemon.name]);
    generateRandomCards();
  };

  // Handle player attack
  const handleAttack = (attackIndex) => {
    if (!battleActive || !playerTurn || gameOver) return;

    // Check if a card has been selected first
    if (!selectedCard) {
      addToBattleLog('You must select a special card first!');
      return;
    }

    const attack = playerPokemon.attacks[attackIndex];
    
    // Check if attack is on cooldown
    if (attack.currentCooldown > 0) {
      addToBattleLog(`${attack.name} is on cooldown for ${attack.currentCooldown} more turn(s)!`);
      return;
    }

    // Calculate damage with any active card effects
    let damage = attack.damage;
    let effectText = '';
    
    // Apply the selected card effect
    const effect = applyCardEffect(selectedCard, damage);
    damage = effect.damage;
    effectText = effect.text;
    
    // Store the selected card before clearing it
    const usedCard = selectedCard;
    setSelectedCard(null);

    // Apply damage to enemy
    const updatedEnemyHP = Math.max(0, enemyPokemon.currentHP - damage);
    setEnemyPokemon(prev => ({
      ...prev,
      currentHP: updatedEnemyHP
    }));

    // Set cooldown for the used attack
    const updatedAttacks = playerPokemon.attacks.map((a, idx) => {
      if (idx === attackIndex) {
        return { ...a, currentCooldown: a.cooldown };
      }
      return a;
    });

    setPlayerPokemon(prev => ({
      ...prev,
      attacks: updatedAttacks
    }));

    // Add to battle log
    addToBattleLog(`Pikachu used ${attack.name} for ${damage} damage!${effectText ? ' ' + effectText : ''}`);

    // Remove the used card and draw a new one
    const remainingCards = availableCards.filter(card => card.name !== usedCard.name);
    
    // Get all possible cards excluding the ones currently in hand
    const allCards = [...specialCards];
    const availableNewCards = allCards.filter(card => 
      !remainingCards.some(rc => rc.name === card.name)
    );
    
    // Add a new random card if possible
    if (availableNewCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableNewCards.length);
      const newCard = availableNewCards[randomIndex];
      setAvailableCards([...remainingCards, newCard]);
      addToBattleLog(`Drew a new ${newCard.name} card!`);
    } else {
      // If no new cards available, just keep the remaining cards
      setAvailableCards(remainingCards);
      addToBattleLog('No more cards available to draw!');
    }

    // Check if enemy is defeated
    if (updatedEnemyHP <= 0) {
      handleEnemyDefeated();
    } else {
      // End player turn
      setPlayerTurn(false);
      // Schedule enemy turn
      setTimeout(enemyTurn, 1500);
    }
  };

  // Handle defend action
  const handleDefend = () => {
    if (!battleActive || !playerTurn || gameOver) return;

    // Check if a card has been selected first
    if (!selectedCard) {
      addToBattleLog('You must select a special card first!');
      return;
    }

    // Store the selected card before clearing it
    const usedCard = selectedCard;
    
    // Apply the selected card effect first
    const effect = applyCardEffect(selectedCard, 0);
    if (effect.text) {
      addToBattleLog(effect.text);
    }
    setSelectedCard(null);

    // Set defend status
    setPlayerPokemon(prev => ({
      ...prev,
      defending: true
    }));

    addToBattleLog('Pikachu is defending! Damage reduced by 50% next turn.');
    
    // Remove the used card and draw a new one
    const remainingCards = availableCards.filter(card => card.name !== usedCard.name);
    
    // Get all possible cards excluding the ones currently in hand
    const allCards = [...specialCards];
    const availableNewCards = allCards.filter(card => 
      !remainingCards.some(rc => rc.name === card.name)
    );
    
    // Add a new random card if possible
    if (availableNewCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableNewCards.length);
      const newCard = availableNewCards[randomIndex];
      setAvailableCards([...remainingCards, newCard]);
      addToBattleLog(`Drew a new ${newCard.name} card!`);
    } else {
      // If no new cards available, just keep the remaining cards
      setAvailableCards(remainingCards);
      addToBattleLog('No more cards available to draw!');
    }
    
    // End player turn
    setPlayerTurn(false);
    // Schedule enemy turn
    setTimeout(enemyTurn, 1500);
  };

  // Handle card selection
  const handleCardSelect = (cardIndex) => {
    if (!battleActive || !playerTurn || gameOver) return;

    const card = availableCards[cardIndex];
    setSelectedCard(card);
    addToBattleLog(`Pikachu selected ${card.name} card!`);

    // Some cards have immediate effects
    if (card.immediateEffect) {
      const effect = applyCardEffect(card);
      if (effect.text) {
        addToBattleLog(effect.text);
      }
    }
    
    // Always prompt player to choose attack or defend after selecting a card
    addToBattleLog('Now choose to Attack or Defend to complete your turn.');
  };

  // Apply card effect and return modified damage and effect text
  const applyCardEffect = (card, baseDamage = 0) => {
    let damage = baseDamage;
    let text = '';

    switch (card.name) {
      case 'Charge':
        damage += 50;
        text = '(+50 damage)';
        break;
      case 'Mega Charge':
        damage += 100;
        text = '(+100 damage)';
        break;
      case 'Ultra Charge':
        damage += 150;
        text = '(+150 damage)';
        break;
      case 'Focus Energy':
        setPlayerPokemon(prev => ({
          ...prev,
          focusEnergy: 3 // Lasts for 3 turns
        }));
        text = 'Pikachu is focusing energy! Attacks boosted by 50% for 3 turns.';
        break;
      case 'All-Out Attack':
        damage += 200;
        setPlayerPokemon(prev => ({
          ...prev,
          vulnerable: true // Takes +25% damage next turn
        }));
        text = '(+200 damage, but will take +25% damage next turn)';
        break;
      case 'Detect':
        setPlayerPokemon(prev => ({
          ...prev,
          detect: true // Nullifies all damage next turn
        }));
        text = 'Pikachu will detect and avoid all damage next turn!';
        break;
      case 'Recover':
        const healAmount = Math.floor(playerPokemon.maxHP * 0.25);
        const newHP = Math.min(playerPokemon.maxHP, playerPokemon.currentHP + healAmount);
        setPlayerPokemon(prev => ({
          ...prev,
          currentHP: newHP
        }));
        text = `Pikachu recovered ${healAmount} HP!`;
        break;
      case 'Full Restore':
        const fullHealAmount = Math.floor(playerPokemon.maxHP * 0.5);
        const fullNewHP = Math.min(playerPokemon.maxHP, playerPokemon.currentHP + fullHealAmount);
        setPlayerPokemon(prev => ({
          ...prev,
          currentHP: fullNewHP
        }));
        text = `Pikachu recovered ${fullHealAmount} HP!`;
        break;
      case 'Double Shock':
        damage *= 2;
        text = '(Damage doubled!)';
        break;
      case 'Focus Band':
        // Remove all cooldowns
        setPlayerPokemon(prev => ({
          ...prev,
          attacks: prev.attacks.map(attack => ({
            ...attack,
            currentCooldown: 0
          }))
        }));
        text = 'All attack cooldowns removed!';
        break;
      case 'Scary Face':
        setEnemyPokemon(prev => ({
          ...prev,
          scaryFace: true // Reduces next attack damage by 150
        }));
        text = `${enemyPokemon.name}'s next attack will be weakened!`;
        break;
      case 'Light Screen':
        setPlayerPokemon(prev => ({
          ...prev,
          lightScreen: true // Reduces all damage by 25% next turn
        }));
        text = 'Light Screen will reduce damage by 25% next turn!';
        break;
      default:
        break;
    }

    return { damage, text };
  };

  // Enemy turn logic
  const enemyTurn = () => {
    if (!battleActive || gameOver || !enemyPokemon) return;

    // Find available attacks (not on cooldown)
    const availableAttacks = enemyPokemon.attacks.filter(attack => attack.currentCooldown === 0);
    
    if (availableAttacks.length === 0) {
      addToBattleLog(`${enemyPokemon.name} has no available attacks! Skipping turn.`);
      endEnemyTurn();
      return;
    }

    // Select random attack from available attacks
    const attackIndex = Math.floor(Math.random() * availableAttacks.length);
    const attack = availableAttacks[attackIndex];
    
    // Calculate damage
    let damage = attack.damage;
    
    // Apply player defense if active
    if (playerPokemon.defending) {
      damage = Math.floor(damage * 0.5);
    }
    
    // Apply detect if active
    if (playerPokemon.detect) {
      damage = 0;
      addToBattleLog(`Pikachu detected ${enemyPokemon.name}'s attack and avoided all damage!`);
    }
    
    // Apply light screen if active
    if (playerPokemon.lightScreen) {
      damage = Math.floor(damage * 0.75);
    }
    
    // Apply scary face if active
    if (enemyPokemon.scaryFace) {
      damage = Math.max(0, damage - 150);
    }
    
    // Apply vulnerable status if active
    if (playerPokemon.vulnerable) {
      damage = Math.floor(damage * 1.25);
    }

    // Apply damage to player
    const updatedPlayerHP = Math.max(0, playerPokemon.currentHP - damage);
    setPlayerPokemon(prev => ({
      ...prev,
      currentHP: updatedPlayerHP,
      defending: false, // Reset defending status
      detect: false, // Reset detect status
      lightScreen: false, // Reset light screen status
      vulnerable: false, // Reset vulnerable status
      scaryFace: false // Reset scary face status
    }));

    // Set cooldown for the used attack
    const attackOriginalIndex = enemyPokemon.attacks.findIndex(a => a.name === attack.name);
    const updatedEnemyAttacks = enemyPokemon.attacks.map((a, idx) => {
      if (idx === attackOriginalIndex) {
        return { ...a, currentCooldown: a.cooldown };
      }
      return a;
    });

    setEnemyPokemon(prev => ({
      ...prev,
      attacks: updatedEnemyAttacks,
      scaryFace: false // Reset scary face status
    }));

    // Add to battle log
    addToBattleLog(`${enemyPokemon.name} used ${attack.name} for ${damage} damage!`);

    // Check if player is defeated
    if (updatedPlayerHP <= 0) {
      handlePlayerDefeated();
    } else {
      // Reduce cooldowns for player attacks
      const updatedPlayerAttacks = playerPokemon.attacks.map(attack => ({
        ...attack,
        currentCooldown: Math.max(0, attack.currentCooldown - 1)
      }));

      setPlayerPokemon(prev => ({
        ...prev,
        attacks: updatedPlayerAttacks,
        focusEnergy: prev.focusEnergy > 0 ? prev.focusEnergy - 1 : 0 // Reduce focus energy counter
      }));

      // End enemy turn
      endEnemyTurn();
    }
  };

  // End enemy turn and start player turn
  const endEnemyTurn = () => {
    // Reduce cooldowns for enemy attacks
    const updatedEnemyAttacks = enemyPokemon.attacks.map(attack => ({
      ...attack,
      currentCooldown: Math.max(0, attack.currentCooldown - 1)
    }));

    setEnemyPokemon(prev => ({
      ...prev,
      attacks: updatedEnemyAttacks
    }));

    // Start player turn
    setPlayerTurn(true);
  };

  // Handle player defeated
  const handlePlayerDefeated = () => {
    addToBattleLog('Pikachu fainted! You lost the battle.');
    setGameOver(true);
    setBattleActive(false);
  };

  // Handle enemy defeated
  const handleEnemyDefeated = () => {
    addToBattleLog(`${enemyPokemon.name} fainted! You won the battle!`);
    
    // Check for unlocks based on current level
    if (currentLevel === 4) { // Defeated Lucario
      setPlayerPokemon(prev => ({
        ...prev,
        unlocked: { ...prev.unlocked, voltTackle: true },
        attacks: [
          ...prev.attacks,
          { name: 'Volt Tackle', damage: 600, cooldown: 2, currentCooldown: 0 }
        ]
      }));
      addToBattleLog('Pikachu learned Volt Tackle!');
    } else if (currentLevel === 5) { // Defeated Garchomp
      setPlayerPokemon(prev => ({
        ...prev,
        unlocked: { ...prev.unlocked, gigavoltHavoc: true },
        attacks: [
          ...prev.attacks,
          { name: 'Gigavolt Havoc', damage: 700, cooldown: 3, currentCooldown: 0 }
        ]
      }));
      addToBattleLog('Pikachu learned Gigavolt Havoc!');
      setGameWon(true);
    }

    // Increase player max HP
    setPlayerPokemon(prev => ({
      ...prev,
      maxHP: prev.maxHP + 250,
      currentHP: prev.maxHP + 250 // Fully heal for next battle
    }));
    
    // Move to next level if not at max level
    if (currentLevel < pokemonData.enemies.length) {
      setCurrentLevel(prev => prev + 1);
      setBattleActive(false);
    } else {
      addToBattleLog('Congratulations! You have defeated all opponents!');
      setGameWon(true);
      setBattleActive(false);
    }
  };

  // Add message to battle log
  const addToBattleLog = (message) => {
    setBattleLog(prev => [...prev, message]);
  };

  // Reset game
  const resetGame = () => {
    setPlayerPokemon({
      name: 'Pikachu',
      type: 'Electric',
      level: 1,
      maxHP: 2000,
      currentHP: 2000,
      attacks: [
        { name: 'Thunder Shock', damage: 350, cooldown: 0, currentCooldown: 0 },
        { name: 'Electro Ball', damage: 450, cooldown: 1, currentCooldown: 0 },
      ],
      unlocked: {
        voltTackle: false,
        gigavoltHavoc: false
      }
    });
    
    // Reset enemy Pokemon to ensure HP is refreshed
    if (currentLevel > 0 && currentLevel <= pokemonData.enemies.length) {
      const enemy = pokemonData.enemies[currentLevel - 1];
      setEnemyPokemon({
        ...enemy,
        currentHP: enemy.maxHP,
        attacks: enemy.attacks.map(attack => ({
          ...attack,
          currentCooldown: 0
        }))
      });
    }
    
    setCurrentLevel(1);
    setBattleActive(false);
    setBattleLog([]);
    setGameOver(false);
    setGameWon(false);
  };

  return (
    <div className="pokemon-battle-container">
      <h1 className="battle-title">Pokémon RPG Battle</h1>
      
      {gameWon && (
        <div className="game-won-message">
          <h2>Congratulations! You've completed the game!</h2>
          <button className="reset-button" onClick={resetGame}>Play Again</button>
        </div>
      )}
      
      {!gameWon && (
        <BattleUI
          playerPokemon={playerPokemon}
          enemyPokemon={enemyPokemon}
          battleActive={battleActive}
          playerTurn={playerTurn}
          battleLog={battleLog}
          availableCards={availableCards}
          currentLevel={currentLevel}
          gameOver={gameOver}
          onAttack={handleAttack}
          onDefend={handleDefend}
          onCardSelect={handleCardSelect}
          onStartBattle={startBattle}
          onReset={resetGame}
          selectedCard={selectedCard}
        />
      )}
    </div>
  );
};

export default PokemonBattle;