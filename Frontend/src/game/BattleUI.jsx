import React from "react";
import "../style/PokemonGymBrawler.css";
import { expForLevel } from "../data/pokemonGameData";

// Import badge images
import pewterBadge from "../assets/gym badges/pewter.png";
import cascadeBadge from "../assets/gym badges/cascade.png";
import thunderBadge from "../assets/gym badges/thunder.png";
import rainbowBadge from "../assets/gym badges/rainbow.png";
import soulBadge from "../assets/gym badges/soul.png";
import marshBadge from "../assets/gym badges/marsh.png";
import volcanoBadge from "../assets/gym badges/volcano.png";
import earthBadge from "../assets/gym badges/earth.png";

const BattleUI = ({
  playerPokemon,
  playerTeam,
  opponent,
  battleLog,
  battleInProgress,
  onAttack,
  onStartBattle,
  onSwitchPokemon,
  onHealTeam,
  showPokemonChoice,
  pokemonChoices,
  onPokemonChoice,
  expGained,
  onReset,
  showResetConfirm,
  setShowResetConfirm,
  showSwitchModal,
  setShowSwitchModal,
  isLoading,
  wildEncounterActive,
  wildPokemon,
  onRunFromWild,
  onCatchWild,
  showStarterSelection,
  onStarterSelection,
  startWildEncounter,
  activeTeamMember,
  kantoGyms,
  currentGymIndex,
  badgeCount,
  pokemonImages
}) => {
  // Get the active Pokemon from the player's team or use playerPokemon directly
  // Using playerPokemon directly ensures we always have the most up-to-date state
  const activePokemon = playerPokemon || playerTeam[activeTeamMember];
  
  // Get the current gym information
  const currentGym = kantoGyms[currentGymIndex];
  
  // Handle starter Pokemon selection
  const handleStarterSelection = (starter) => {
    if (onStarterSelection) {
      onStarterSelection(starter);
    }
  };
  
  // Helper function to render HP bar
  const renderHPBar = (current, max) => {
    const percentage = Math.max(0, Math.min(100, (current / max) * 100));
    return (
      <div className="hp-bar-container">
        <div className="hp-bar-background">
          <div 
            className="hp-bar-fill" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="hp-text">{current} / {max}</div>
      </div>
    );
  };

  // Helper function to render energy bar
  const renderEnergyBar = (energy) => {
    return (
      <div className="energy-bar-container">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className={`energy-pip ${i < energy ? "energy-pip-filled" : ""}`}
          ></div>
        ))}
      </div>
    );
  };

  // Render Pokemon choice modal
  const renderPokemonChoiceModal = () => {
    if (!showPokemonChoice) return null;
    
    return (
      <div className="pokemon-choice-modal">
        <h3>New Pokémon Available!</h3>
        <div className="pokemon-choice-options">
          {pokemonChoices.map((choice) => (
            <button
              key={choice}
              onClick={() => handlePokemonChoice(choice)}
              className="pokemon-choice-button"
            >
              {choice}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render reset confirmation modal
  const renderResetConfirmModal = () => {
    if (!showResetConfirm) return null;
    
    return (
      <div className="reset-confirm-modal">
        <h3>Reset Game Progress?</h3>
        <p>This will delete all your Pokémon and badges. This cannot be undone!</p>
        <div className="reset-confirm-buttons">
          <button onClick={handleReset} className="reset-confirm-yes">Yes, Reset</button>
          <button onClick={() => setShowResetConfirm(false)} className="reset-confirm-no">Cancel</button>
        </div>
      </div>
    );
  };

  // Render switch Pokemon modal
  const renderSwitchModal = () => {
    if (!showSwitchModal) return null;
    
    return (
      <div className="switch-modal">
        <h3>Switch Pokémon</h3>
        <div className="switch-options">
          {playerTeam.map((pokemon, index) => (
            <button
              key={index}
              onClick={() => onSwitchPokemon(index)}
              disabled={pokemon.currentHP <= 0 || index === activeTeamMember}
              className={`switch-button ${index === activeTeamMember ? "active" : ""} ${pokemon.currentHP <= 0 ? "fainted" : ""}`}
            >
              {pokemon.name} ({pokemon.currentHP}/{pokemon.maxHP} HP)
            </button>
          ))}
        </div>
        <button onClick={() => setShowSwitchModal(false)} className="switch-cancel">Cancel</button>
      </div>
    );
  };

  // Render battle log
  const renderBattleLog = () => {
    return (
      <div className="battle-log">
        {battleLog.map((entry, index) => (
          <div key={index} className="log-entry">
            {entry}
          </div>
        ))}
      </div>
    );
  };

  // Render gym information
  const renderGymInfo = () => {
    return (
      <div className="gym-info">
        <h2>{currentGym.name} - {currentGym.leader}</h2>
        <p>Badge: {currentGym.badge}</p>
        <p>Type: {currentGym.type}</p>
        <div className="gym-progress">
          <p>Gym Progress: {badgeCount}/8</p>
          <div className="gym-progress-bar">
            <div 
              className="gym-progress-fill" 
              style={{ width: `${(badgeCount / 8) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Render Pokemon battle area
  const renderBattleArea = () => {
    if (!battleInProgress || !opponent) return null;
    
    return (
      <div className="battle-area">
        {/* Opponent Pokemon */}
        <div className="opponent-pokemon">
          <h3>{opponent.name} Lv.{opponent.level || "?"}</h3>
          {renderHPBar(opponent.currentHP, opponent.maxHP)}
          {renderEnergyBar(opponent.energy)}
          {pokemonImages[opponent.baseForm || opponent.name.toLowerCase()] && (
            <img 
              src={pokemonImages[opponent.baseForm || opponent.name.toLowerCase()]} 
              alt={opponent.name} 
              className="pokemon-image opponent-image"
            />
          )}
        </div>
        
        {/* Player Pokemon */}
        <div className="player-pokemon">
          <h3>{activePokemon.name} Lv.{activePokemon.level}</h3>
          {renderHPBar(activePokemon.currentHP, activePokemon.maxHP)}
          {renderEnergyBar(activePokemon.energy)}
          {pokemonImages[activePokemon.baseForm] && (
            <img 
              src={pokemonImages[activePokemon.baseForm]} 
              alt={activePokemon.name} 
              className="pokemon-image player-image"
            />
          )}
        </div>
          
        {/* Attack buttons */}
        <div className="attack-buttons">
          {activePokemon.attacks.map((attackMove, index) => (
            <button
              key={index}
              onClick={() => attack(index)}
              disabled={attackMove.energy > activePokemon.energy || activePokemon.currentHP <= 0}
              className="attack-button"
            >
              <span className="attack-name">{attackMove.name}</span>
              <span className="attack-damage">{attackMove.damage} dmg</span>
              <span className="attack-energy">{attackMove.energy} energy</span>
            </button>
          ))}
        </div>
        
        {/* Battle controls */}
        <div className="battle-controls">
          <button onClick={() => setShowSwitchModal(true)} className="switch-pokemon-button">
            Switch Pokémon
          </button>
        </div>
      </div>
    );
  };

  // Render team display
  const renderTeamDisplay = () => {
    return (
      <div className="team-display">
        <h3>Your Team</h3>
        <div className="team-pokemon-list">
          {playerTeam.map((pokemon, index) => (
            <div 
              key={index} 
              className={`team-pokemon ${index === activeTeamMember ? "active" : ""} ${pokemon.currentHP <= 0 ? "fainted" : ""}`}
            >
              <div className="team-pokemon-name">{pokemon.name} Lv.{pokemon.level}</div>
              {renderHPBar(pokemon.currentHP, pokemon.maxHP)}
              {pokemonImages[pokemon.baseForm] && (
                <img 
                  src={pokemonImages[pokemon.baseForm]} 
                  alt={pokemon.name} 
                  className="team-pokemon-image"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render gym badges display
  const renderGymBadges = () => {
    // Array of all gym badges in order with their corresponding images
    const allBadges = [
      { name: "Boulder Badge", image: pewterBadge },
      { name: "Cascade Badge", image: cascadeBadge },
      { name: "Thunder Badge", image: thunderBadge },
      { name: "Rainbow Badge", image: rainbowBadge },
      { name: "Soul Badge", image: soulBadge },
      { name: "Marsh Badge", image: marshBadge },
      { name: "Volcano Badge", image: volcanoBadge },
      { name: "Earth Badge", image: earthBadge }
    ];

    return (
      <div className="gym-badges-display">
        <h3>Gym Badges</h3>
        <div className="badges-container">
          {allBadges.map((badge, index) => (
            <div 
              key={index} 
              className={`badge-item ${index < badgeCount ? "earned" : "unearned"}`}
              title={badge.name}
            >
              <img 
                src={badge.image} 
                alt={badge.name} 
                className="badge-image"
              />
              <span className="badge-name">{badge.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render game controls
  const renderGameControls = () => {
    return (
      <div className="game-controls">
        {!battleInProgress && (
          <button onClick={startBattle} className="start-battle-button">
            Challenge {currentGym.leader}
          </button>
        )}
        {!battleInProgress && (
          <button 
            onClick={startWildEncounter} 
            disabled={battleInProgress || playerTeam.length === 0}
            className="wild-encounter-button"
          >
            Find Wild Pokémon
          </button>
        )}
        <button onClick={healAllPokemon} className="heal-button">
          Heal All Pokémon
        </button>
        <button onClick={() => setShowResetConfirm(true)} className="reset-button">
          Reset Game
        </button>
      </div>
    );
  };

  return (
    <div className="battle-ui">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {showStarterSelection && (
        <div className="modal starter-modal">
          <div className="modal-content">
            <h2>Welcome to Pokémon Gym Brawler!</h2>
            <h3>Choose Your Starter Pokémon</h3>
            <p>Select one of the following Pokémon to begin your journey:</p>
            <div className="starter-selection">
              <div className="starter-option">
                <div className="starter-image-container">
                  <img 
                    src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png" 
                    alt="Bulbasaur" 
                  />
                </div >
                <div className="starter-info">
                <h4>Bulbasaur</h4>
                <div className="starter-type type-grass">Grass Type</div>
                <div className="starter-stats">
                  <div>HP: 45</div>
                  <div>Attack: 49</div>
                  <div>Defense: 49</div>
                </div>
                <button className="starter-select-button" onClick={() => handleStarterSelection("Bulbasaur")}>Select</button>
</div>
              </div>
              <div className="starter-option">
                <div className="starter-image-container">
                  <img 
                    src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png" 
                    alt="Charmander" 
                  />
                </div>
                <div className="starter-info">
                <h4>Charmander</h4>
                <div className="starter-type type-fire">Fire Type</div>
                <div className="starter-stats">
                  <div>HP: 39</div>
                  <div>Attack: 52</div>
                  <div>Defense: 43</div>
                </div>
                <button className="starter-select-button" onClick={() => handleStarterSelection("Charmander")}>Select</button>
                </div>
              </div>
              <div className="starter-option">
                <div className="starter-image-container">
                  <img 
                    src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png" 
                    alt="Squirtle" 
                  />
                </div>
                <div className="starter-info">
                <h4>Squirtle</h4>
                <div className="starter-type type-water">Water Type</div>
                <div className="starter-stats">
                  <div>HP: 44</div>
                  <div>Attack: 48</div>
                  <div>Defense: 65</div>
                </div>
                <button className="starter-select-button" onClick={() => handleStarterSelection("Squirtle")}>Select</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Reset Game Progress?</h3>
            <p>This will reset all your badges and progress. Your Pokemon team will be lost.</p>
            <div className="modal-buttons">
              <button onClick={onReset}>Yes, Reset</button>
              <button onClick={() => setShowResetConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showSwitchModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Switch Pokemon</h3>
            <div className="team-selection">
              {playerTeam.map((pokemon, index) => (
                <div 
                  key={index} 
                  className={`team-pokemon ${pokemon.isActive ? 'active' : ''}`}
                  onClick={() => {
                    onSwitchPokemon(index);
                    setShowSwitchModal(false);
                  }}
                >
                  <img 
                    src={pokemon.image || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${extractPokemonIdFromName(pokemon.name) || index + 1}.png`} 
                    alt={pokemon.name} 
                  />
                  <div>
                    <h4>{pokemon.name}</h4>
                    <p>HP: {pokemon.currentHP}/{pokemon.maxHP}</p>
                    <p>Level: {pokemon.level}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSwitchModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showPokemonChoice && (
        <div className="modal">
          <div className="modal-content">
            <h3>New Pokemon Available!</h3>
            <p>Choose a new Pokemon to add to your team:</p>
            <div className="pokemon-choices">
              {pokemonChoices.map((choice, index) => (
                <div 
                  key={index} 
                  className="pokemon-choice"
                  onClick={() => onPokemonChoice(choice)}
                >
                  <img 
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${extractPokemonIdFromName(choice) || (index + 10)}.png`} 
                    alt={choice} 
                  />
                  <h4>{choice}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="game-container">
        {battleInProgress && (
          <div className="battle-container">
            <div className="battle-area">
              {activePokemon && (
                <div className="player-pokemon">
                  <div className="pokemon-header">
                    <h3>{activePokemon.name}</h3>
                    <span className="pokemon-level">Lv.{activePokemon.level}</span>
                  </div>
                  <div className="pokemon-image-container">
                    <img 
                      src={pokemonImages[activePokemon.baseForm] || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${extractPokemonIdFromName(activePokemon.name) || 1}.png`} 
                      alt={activePokemon.name} 
                      className="pokemon-image"
                    />
                  </div>
                  <div className="health-bar-container">
                    <div 
                      className="health-bar" 
                      style={{ width: `${(activePokemon.currentHP / activePokemon.maxHP) * 100}%` }}
                    ></div>
                  </div>
                  <p className="health-text">HP: {activePokemon.currentHP}/{activePokemon.maxHP}</p>
                  <div className="energy-display">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`energy-pip ${i < activePokemon.energy ? "filled" : ""}`}></div>
                    ))}
                  </div>
                  <p className="exp-text">XP: {activePokemon.exp}/{expForLevel[activePokemon.level]}</p>
                  {expGained > 0 && <p className="exp-gained">+{expGained} XP</p>}
                </div>
              )}

              {opponent && (
                <div className="opponent-pokemon">
                  <div className="pokemon-header">
                    <h3>{opponent.name}</h3>
                    <span className="pokemon-level">Lv.{opponent.level || "?"}</span>
                  </div>
                  <div className="pokemon-image-container">
                    <img 
                      src={pokemonImages[opponent.name.toLowerCase()] || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${extractPokemonIdFromName(opponent.name) || 1}.png`} 
                      alt={opponent.name} 
                      className="pokemon-image"
                    />
                  </div>
                  <div className="health-bar-container">
                    <div 
                      className="health-bar" 
                      style={{ width: `${(opponent.currentHP / opponent.maxHP) * 100}%` }}
                    ></div>
                  </div>
                  <p className="health-text">HP: {opponent.currentHP}/{opponent.maxHP}</p>
                  <div className="energy-display">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`energy-pip ${i < (opponent.energy || 0) ? "filled" : ""}`}></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Attack buttons */}
            <div className="battle-controls">
              <div className="attack-buttons">
                {activePokemon && activePokemon.attacks.map((attackMove, index) => (
                  <button
                    key={index}
                    onClick={() => onAttack(index)}
                    disabled={attackMove.energy > activePokemon.energy || activePokemon.currentHP <= 0}
                    className={`attack-button ${attackMove.energy > activePokemon.energy ? 'disabled' : ''} type-${activePokemon.type.toLowerCase()}`}
                  >
                    <span className="attack-name">{attackMove.name}</span>
                    <span className="attack-damage">{attackMove.damage} dmg</span>
                    <span className="attack-energy">{attackMove.energy} energy</span>
                  </button>
                ))}
              </div>
              
              <div className="battle-actions">
                <button onClick={() => setShowSwitchModal(true)} className="switch-button">
                  Switch Pokémon
                </button>
                {wildEncounterActive && (
                  <>
                    {/* Catch button commented out as this feature is disabled */}
                    {/* <button onClick={onCatchWild} className="catch-button">Catch {wildPokemon?.name}</button> */}
                    <button onClick={onRunFromWild} className="run-button">Run Away</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        </div>

        <div className="battle-log">
          <h3>Battle Log</h3>
          <div className="log-entries">
            {battleLog.map((entry, index) => (
              <p key={index}>{entry}</p>
            ))}
          </div>
        </div>

        {!battleInProgress && (
          <div className="game-controls">
            <button onClick={onStartBattle} className="start-battle-button">Start Gym Battle</button>
            <button onClick={startWildEncounter} className="wild-encounter-button">Find Wild Pokémon</button>
            <button onClick={onHealTeam} className="heal-button">Heal Team</button>
            <button onClick={() => setShowResetConfirm(true)} className="reset-button">Reset Game</button>
          </div>
        )}

        <div className="team-display">
          <h3>Your Team</h3>
          <div className="team-pokemon-list">
            {playerTeam.map((pokemon, index) => (
              <div 
                key={index} 
                className={`team-pokemon ${index === activeTeamMember ? "active" : ""} ${pokemon.currentHP <= 0 ? "fainted" : ""}`}
                onClick={() => !battleInProgress && onSwitchPokemon(index)}
              >
                <div className="team-pokemon-image-container">
                  <img 
                    src={pokemonImages[pokemon.baseForm] || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${extractPokemonIdFromName(pokemon.name) || index + 1}.png`}
                    alt={pokemon.name}
                    className="team-pokemon-image"
                  />
                </div>
                <div>
                  <h4>{pokemon.name}</h4>
                  <p>HP: {pokemon.currentHP}/{pokemon.maxHP}</p>
                  <p>Level: {pokemon.level}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Render Gym Badges */}
        {renderGymBadges()}
      </div>
  );

  function extractPokemonIdFromName(name) {
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
    if (lowercaseName.includes('caterpie')) return 10;
    if (lowercaseName.includes('metapod')) return 11;
    if (lowercaseName.includes('butterfree')) return 12;
    if (lowercaseName.includes('weedle')) return 13;
    if (lowercaseName.includes('kakuna')) return 14;
    if (lowercaseName.includes('beedrill')) return 15;
    if (lowercaseName.includes('pidgey')) return 16;
    if (lowercaseName.includes('pidgeotto')) return 17;
    if (lowercaseName.includes('pidgeot')) return 18;
    if (lowercaseName.includes('spearow')) return 21;
    
    return null;
  }
};

export default BattleUI;