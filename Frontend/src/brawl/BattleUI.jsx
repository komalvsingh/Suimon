import React, { useState, useEffect } from 'react';
import './PokemonBrawl.css';

// Import card images
import chargeCard from './brawlcard/charge.png';
import megaChargeCard from './brawlcard/megacharge.png';
import ultraChargeCard from './brawlcard/ultracharge.png';
import focusEnergyCard from './brawlcard/focusenergy.png';
import allOutAttackCard from './brawlcard/alloutattack.png';
import detectCard from './brawlcard/detect.png';
import recoverCard from './brawlcard/recover.png';
import fullRestoreCard from './brawlcard/fullrestore.png';
import doubleShockCard from './brawlcard/doubleshock.png';
import focusBandCard from './brawlcard/focusband.png';
import scaryFaceCard from './brawlcard/scaryface.png';
import lightScreenCard from './brawlcard/lightscreen.png';

const BattleUI = ({
  playerPokemon,
  enemyPokemon,
  battleActive,
  playerTurn,
  battleLog = [],
  availableCards = [],
  currentLevel = 1,
  gameOver = false,
  onAttack = () => {},
  onDefend = () => {},
  onCardSelect = () => {},
  onStartBattle = () => {},
  onReset = () => {},
  selectedCard = null
}) => {
  // State for Pokemon images
  const [pokemonImages, setPokemonImages] = useState({});
  const [loadingImages, setLoadingImages] = useState(false);
  const [showAttackDropdown, setShowAttackDropdown] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  
  // Map card names to their image files
  const cardImageMap = {
    'Charge': chargeCard,
    'Mega Charge': megaChargeCard,
    'Ultra Charge': ultraChargeCard,
    'Focus Energy': focusEnergyCard,
    'All-Out Attack': allOutAttackCard,
    'Detect': detectCard,
    'Recover': recoverCard,
    'Full Restore': fullRestoreCard,
    'Double Shock': doubleShockCard,
    'Focus Band': focusBandCard,
    'Scary Face': scaryFaceCard,
    'Light Screen': lightScreenCard
  };
  
  // Fetch Pokemon images when component mounts or when enemy/player Pokemon changes
  useEffect(() => {
    if (playerPokemon) {
      fetchPokemonImage(playerPokemon.name);
    }
    if (enemyPokemon) {
      fetchPokemonImage(enemyPokemon.name);
    }
  }, [playerPokemon, enemyPokemon]);
  
  // Fetch Pokemon image from PokeAPI
  const fetchPokemonImage = async (name) => { 
    if (!name) return null; 
     
    const normalizedName = name.toLowerCase().trim(); 
     
    try { 
      if (pokemonImages[normalizedName]) { 
        return pokemonImages[normalizedName]; 
      } 
 
      setLoadingImages(true); 
      let pokemonId; 
 
      // Handle special cases for starter Pokemon
      if (normalizedName.includes("pikachu")) {
        pokemonId = 25;
      } else if (normalizedName.includes("char")) { 
        pokemonId = normalizedName === "charmander" ? 4 : normalizedName === "charmeleon" ? 5 : 6; 
      } else if (normalizedName.includes("squirt") || normalizedName.includes("blast")) { 
        pokemonId = normalizedName === "squirtle" ? 7 : normalizedName === "wartortle" ? 8 : 9; 
      } else if ( 
        normalizedName.includes("bulb") || 
        normalizedName.includes("ivy") || 
        normalizedName.includes("venu") 
      ) { 
        pokemonId = normalizedName === "bulbasaur" ? 1 : normalizedName === "ivysaur" ? 2 : 3; 
      } else if (normalizedName.includes("onix")) {
        pokemonId = 95;
      } else if (normalizedName.includes("pidgeot")) {
        pokemonId = 18;
      } else if (normalizedName.includes("lucario")) {
        pokemonId = 448;
      } else if (normalizedName.includes("garchomp")) {
        pokemonId = 445;
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
        // Use official artwork for better quality
        const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
        
        // Update state with the new image URL
        setPokemonImages(prev => ({ 
          ...prev, 
          [normalizedName]: imageUrl 
        })); 
        
        setLoadingImages(false); 
        return imageUrl; 
      } 
      
      setLoadingImages(false); 
      return null; 
    } catch (error) { 
      console.error("Error fetching Pokemon image:", error); 
      setLoadingImages(false); 
      return null; 
    } 
  };

  // Helper function to render HP bar
  const renderHPBar = (current, max) => {
    const percentage = Math.max(0, Math.min(100, (current / max) * 100));
    let barColor = '#ffcc00';
    
    if (percentage < 50) barColor = 'orange';
    if (percentage < 25) barColor = 'red';
    
    return (
      <div className="health-bar-container">
        <div 
          className="health-bar" 
          style={{ width: `${percentage}%`, backgroundColor: barColor }}
        ></div>
        <div className="health-text">{current} / {max}</div>
      </div>
    );
  };

  // Helper function to render cooldown indicators
  const renderCooldown = (attack) => {
    if (!attack || attack.currentCooldown === 0) return null;
    
    return (
      <div className="cooldown-indicator">
        Cooldown: {attack.currentCooldown}
      </div>
    );
  };

  // Render battle area with Pokemon sprites
  const renderBattleArea = () => {
    if (!enemyPokemon) return null;
    
    return (
      <div className="bakugan-battle-area">
        {/* Player Pokemon */}
        <div className="player-pokemon-container">
          <div className="pokemon-platform player-platform">
            {pokemonImages[playerPokemon.name.toLowerCase()] ? (
              <img 
                src={pokemonImages[playerPokemon.name.toLowerCase()]} 
                alt={playerPokemon.name}
                className="pokemon-sprite-large"
              />
            ) : (
              <div className="pikachu-sprite-large"></div>
            )}
          </div>
          <div className="pokemon-info-box">
            <div className="pokemon-name">{playerPokemon.name}</div>
            {renderHPBar(playerPokemon.currentHP, playerPokemon.maxHP)}
          </div>
        </div>
        
        {/* Selected Card Display */}
        {selectedCard && (
          <div className="selected-card-display">
            <div className="card-effect-name">{selectedCard.name}</div>
            <img 
              src={cardImageMap[selectedCard.name]} 
              alt={selectedCard.name} 
              className="selected-card-large"
            />
            <div className="card-effect-description">{selectedCard.description}</div>
          </div>
        )}
        
        {/* Center area with battle effects */}
        <div className="battle-center">
          {playerTurn ? (
            <div className="player-turn-indicator">YOUR TURN</div>
          ) : (
            <div className="enemy-turn-indicator">ENEMY TURN</div>
          )}
        </div>
        
        {/* Enemy Pokemon */}
        <div className="enemy-pokemon-container">
          <div className="pokemon-platform enemy-platform">
            {pokemonImages[enemyPokemon.name.toLowerCase()] ? (
              <img 
                src={pokemonImages[enemyPokemon.name.toLowerCase()]} 
                alt={enemyPokemon.name}
                className="pokemon-sprite-large"
              />
            ) : (
              <div className={`enemy-sprite-large enemy-${currentLevel}`}></div>
            )}
          </div>
          <div className="pokemon-info-box">
            <div className="pokemon-name">{enemyPokemon.name}</div>
            {renderHPBar(enemyPokemon.currentHP, enemyPokemon.maxHP)}
          </div>
        </div>
      </div>
    );
  };

  // Render card selection area
  const renderCardSelection = () => {
    if (!battleActive || !playerTurn || gameOver || !availableCards.length) return null;
    
    return (
      <div className="card-selection-area">
        <h3 className="card-selection-title">Select a Card</h3>
        <div className="card-grid">
          {availableCards.map((card, index) => (
            <div 
              key={index} 
              className={`card ${selectedCard && selectedCard.name === card.name ? 'selected' : ''}`}
              onClick={() => onCardSelect(index)}
              onMouseEnter={() => setHoveredCard(card)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <img 
                src={cardImageMap[card.name]} 
                alt={card.name} 
                className="card-image"
              />
              <div className="card-name">{card.name}</div>
            </div>
          ))}
        </div>
        
        {/* Card hover detail */}
        {hoveredCard && (
          <div className="card-detail-popup">
            <h4>{hoveredCard.name}</h4>
            <p>{hoveredCard.description}</p>
          </div>
        )}
      </div>
    );
  };

  // Render attack/defend buttons
  const renderActionButtons = () => {
    if (!battleActive || !playerTurn || gameOver) return null;
    
    return (
      <div className="action-buttons">
        <div className="attack-button-container">
          <button 
            className="action-button attack-button"
            onClick={() => setShowAttackDropdown(!showAttackDropdown)}
            disabled={!selectedCard}
          >
            ATTACK
          </button>
          
          {/* Attack dropdown */}
          {showAttackDropdown && (
            <div className="attack-dropdown">
              {playerPokemon.attacks.map((attack, index) => (
                <div 
                  key={index} 
                  className={`attack-option ${attack.currentCooldown > 0 ? 'on-cooldown' : ''}`}
                  onClick={() => {
                    if (attack.currentCooldown === 0) {
                      onAttack(index);
                      setShowAttackDropdown(false);
                    }
                  }}
                >
                  <div className="attack-name">{attack.name}</div>
                  <div className="attack-damage">DMG: {attack.damage}</div>
                  {attack.currentCooldown > 0 && (
                    <div className="attack-cooldown">CD: {attack.currentCooldown}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button 
          className="action-button defend-button"
          onClick={onDefend}
          disabled={!selectedCard}
        >
          DEFEND
        </button>
      </div>
    );
  };

  // Render battle log
  const renderBattleLog = () => {
    return (
      <div className="battle-log-container">
        <h3 className="battle-log-title">Battle Log</h3>
        <div className="battle-log">
          {battleLog.map((entry, index) => (
            <div key={index} className="log-entry">
              {entry}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render game controls (start battle, reset)
  const renderGameControls = () => {
    if (gameOver) {
      return (
        <div className="game-controls">
          <button className="reset-button" onClick={onReset}>
            Play Again
          </button>
        </div>
      );
    }
    
    if (!battleActive && enemyPokemon) {
      return (
        <div className="game-controls">
          <button className="start-battle-button" onClick={onStartBattle}>
            Start Battle vs {enemyPokemon.name}
          </button>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="battle-ui-container">
      {/* Level indicator */}
      <div className="level-indicator">
        <h2>Level {currentLevel}</h2>
      </div>
      
      {/* Main battle area */}
      {renderBattleArea()}
      
      {/* Card and action area */}
      <div className="card-and-action-area">
        {renderCardSelection()}
        {renderActionButtons()}
      </div>
      
      {/* Battle log */}
      {renderBattleLog()}
      
      {/* Game controls */}
      {renderGameControls()}
    </div>
  );
};

export default BattleUI;