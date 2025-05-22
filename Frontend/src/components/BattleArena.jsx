import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Droplets, Leaf, Mountain, Skull, Eye, Flame, Award, Star, Trophy, RotateCcw, Wallet } from 'lucide-react';
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";

// Contract address (same as GameBoard)
const CONTRACT_ADDRESS = "0x70217963607936caee034ce016fb2e9be0debc644d13a6ac40d955940e1066a7";

// Create a SuiClient instance for testnet
const TESTNET_CLIENT = new SuiClient({
  url: "https://fullnode.testnet.sui.io",
});

// Game configuration
const BOARD_SIZE = 8;
const ELEMENT_TYPES = {
  FIRE: { name: 'Fire', icon: Flame, color: 'text-red-400', bg: 'bg-red-900/30', border: 'border-red-500/50', glow: 'shadow-red-500/25' },
  WATER: { name: 'Water', icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-500/50', glow: 'shadow-blue-500/25' },
  GRASS: { name: 'Grass', icon: Leaf, color: 'text-green-400', bg: 'bg-green-900/30', border: 'border-green-500/50', glow: 'shadow-green-500/25' },
  ELECTRIC: { name: 'Electric', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-500/50', glow: 'shadow-yellow-500/25' },
  ROCK: { name: 'Rock', icon: Mountain, color: 'text-gray-400', bg: 'bg-gray-900/30', border: 'border-gray-500/50', glow: 'shadow-gray-500/25' },
  POISON: { name: 'Poison', icon: Skull, color: 'text-purple-400', bg: 'bg-purple-900/30', border: 'border-purple-500/50', glow: 'shadow-purple-500/25' },
  PSYCHIC: { name: 'Psychic', icon: Eye, color: 'text-pink-400', bg: 'bg-pink-900/30', border: 'border-pink-500/50', glow: 'shadow-pink-500/25' }
};

const ELEMENT_KEYS = Object.keys(ELEMENT_TYPES);

// XP System (same as GameBoard)
const XP_LEVELS = [
  { level: 1, xpRequired: 0, reward: "Basic Pokémon Pack" },
  { level: 2, xpRequired: 25, reward: "1 Rare Pokémon" },
  { level: 3, xpRequired: 75, reward: "Standard Pokémon Pack" },
  { level: 4, xpRequired: 150, reward: "2 Rare Pokémon" },
  { level: 5, xpRequired: 300, reward: "Elite Pokémon Pack" },
  { level: 6, xpRequired: 500, reward: "1 Ultra Rare Pokémon" },
  { level: 7, xpRequired: 750, reward: "Premium Pokémon Pack" },
  { level: 8, xpRequired: 1000, reward: "2 Ultra Rare Pokémon" },
  { level: 9, xpRequired: 1500, reward: "Master Pokémon Pack" },
  { level: 10, xpRequired: 2500, reward: "Legendary Pokémon" }
];

// Simplified Pokémon data
const POKEMON_DATA = {
  FIRE: [
    { id: 1, name: 'Charmander', level: 1, maxHP: 80, evolveLevel: 3, evolveTo: 'Charmeleon' },
    { id: 2, name: 'Charmeleon', level: 3, maxHP: 120, evolveLevel: 6, evolveTo: 'Charizard' },
    { id: 3, name: 'Charizard', level: 6, maxHP: 180, evolveLevel: null, evolveTo: null }
  ],
  WATER: [
    { id: 4, name: 'Squirtle', level: 1, maxHP: 80, evolveLevel: 3, evolveTo: 'Wartortle' },
    { id: 5, name: 'Wartortle', level: 3, maxHP: 120, evolveLevel: 6, evolveTo: 'Blastoise' },
    { id: 6, name: 'Blastoise', level: 6, maxHP: 180, evolveLevel: null, evolveTo: null }
  ],
  GRASS: [
    { id: 7, name: 'Bulbasaur', level: 1, maxHP: 80, evolveLevel: 3, evolveTo: 'Ivysaur' },
    { id: 8, name: 'Ivysaur', level: 3, maxHP: 120, evolveLevel: 6, evolveTo: 'Venusaur' },
    { id: 9, name: 'Venusaur', level: 6, maxHP: 180, evolveLevel: null, evolveTo: null }
  ]
};

// Boss Pokémon for each level
const BOSS_POKEMON = [
  { name: 'Wild Rattata', type: 'POISON', hp: 100, level: 1 },
  { name: 'Wild Pidgey', type: 'ROCK', hp: 150, level: 2 },
  { name: 'Gym Leader Brock', type: 'ROCK', hp: 200, level: 3 },
  { name: 'Wild Psyduck', type: 'WATER', hp: 180, level: 4 },
  { name: 'Gym Leader Misty', type: 'WATER', hp: 250, level: 5 }
];

const PokemonPuzzleRush = ({ wallet }) => {
  // Game state
  const [board, setBoard] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(30);
  const [level, setGameLevel] = useState(1);
  const [isGameActive, setIsGameActive] = useState(true);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [gameLog, setGameLog] = useState(['Welcome to Pokémon Puzzle Rush!']);

  // Simplified Pokémon team state
  const [playerPokemon, setPlayerPokemon] = useState({
    FIRE: { ...POKEMON_DATA.FIRE[0], currentHP: POKEMON_DATA.FIRE[0].maxHP, energy: 0 },
    WATER: { ...POKEMON_DATA.WATER[0], currentHP: POKEMON_DATA.WATER[0].maxHP, energy: 0 },
    GRASS: { ...POKEMON_DATA.GRASS[0], currentHP: POKEMON_DATA.GRASS[0].maxHP, energy: 0 }
  });

  // Boss state
  const [boss, setBoss] = useState({ ...BOSS_POKEMON[0], currentHP: BOSS_POKEMON[0].hp });

  // XP System state (same as GameBoard)
  const [xp, setXp] = useState(() => {
    try {
      return parseInt(localStorage.getItem("puzzleRushXP")) || 0;
    } catch {
      return 0;
    }
  });
  const [playerLevel, setPlayerLevel] = useState(1);
  const [xpToNextLevel, setXpToNextLevel] = useState(0);
  const [showLevelUpAlert, setShowLevelUpAlert] = useState(false);
  const [levelUpReward, setLevelUpReward] = useState("");

  // Training status (same as GameBoard)
  const [training, setTraining] = useState(false);

  // UI state
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  // Initialize board
  const createBoard = useCallback(() => {
    const newBoard = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      const boardRow = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        boardRow.push({
          id: `${row}-${col}`,
          type: ELEMENT_KEYS[Math.floor(Math.random() * ELEMENT_KEYS.length)],
          row,
          col,
          isMatched: false
        });
      }
      newBoard.push(boardRow);
    }
    return newBoard;
  }, []);

  // Calculate player level based on XP (same as GameBoard)
  const calculateLevel = useCallback((currentXp) => {
    let calculatedLevel = 1;
    let nextLevelXp = 0;
    let reward = "";

    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
      if (currentXp >= XP_LEVELS[i].xpRequired) {
        calculatedLevel = XP_LEVELS[i].level;
        nextLevelXp = i < XP_LEVELS.length - 1 ? XP_LEVELS[i + 1].xpRequired : null;
        reward = XP_LEVELS[i].reward;
        break;
      }
    }

    setPlayerLevel(calculatedLevel);
    setXpToNextLevel(nextLevelXp !== null ? nextLevelXp - currentXp : "MAX");
    return { playerLevel: calculatedLevel, nextLevelXp, reward };
  }, []);

  // Blockchain training function (same as GameBoard)
 // Blockchain training function (same as GameBoard)
 const trainCreature = async (xpAmount) => {
  console.log("trainCreature called with xpAmount:", xpAmount);
  console.log("Wallet status:", { connected: wallet?.connected, hasAccount: !!wallet?.account });
  
  if (!wallet || !wallet.connected || !wallet.account) {
    console.log("Wallet not connected, skipping blockchain XP gain");
    addToLog("Wallet not connected. Blockchain XP gain skipped.");
    return;
  }
  
  try {
    setTraining(true);
    addToLog(`🔄 Initiating blockchain training (${xpAmount} XP)...`);
    
    // Create a transaction block
    const txb = new TransactionBlock();
    console.log("Transaction block created");
    
    // Get the creature objects from wallet
    console.log("Fetching owned objects from wallet:", wallet.account.address);
    const nfts = await TESTNET_CLIENT.getOwnedObjects({
      owner: wallet.account.address,
      options: {
        showContent: true,
        showType: true,
      },
    });
    
    console.log("NFTs found in wallet:", nfts.data.length);
    
    // Find a valid creature to train - look for the correct module type
    const creature = nfts.data.find((obj) => {
      const type = obj.data?.type;
      const isTrainable = type && type.includes(`${CONTRACT_ADDRESS}::starter_nft::StarterNFT`);
      console.log("Checking NFT:", { objectId: obj.data?.objectId, type, isTrainable });
      return isTrainable;
    });
    
    if (!creature) {
      console.log("No trainable creatures found in wallet");
      addToLog("No trainable StarterNFT found in wallet.");
      return;
    }
    
    console.log("Found trainable creature:", creature.data.objectId);
    
    // Call the train function instead of gain_experience
    txb.moveCall({
      target: `${CONTRACT_ADDRESS}::starter_nft::gain_experience`,
      arguments: [
        txb.object(creature.data.objectId), // NFT object ID
        txb.pure.u64(xpAmount), // Experience amount as u64
      ],
    });
    
    console.log("Move call prepared, executing transaction...");
    
    // Execute the transaction
    const { response } = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: txb,
    });
    
    console.log("Transaction successful:", response);
    addToLog(`🎮 Blockchain training successful! Your creature gained ${xpAmount} XP on-chain.`);
  } catch (err) {
    console.error("Training transaction failed:", err);
    addToLog(`⚠️ Blockchain training failed: ${err.message}`);
  } finally {
    setTraining(false);
  }
};
  // Update XP and check for level ups (same as GameBoard)
  const updateXP = useCallback((amount) => {
    const oldXp = xp;
    const newXp = oldXp + amount;
    
    setXp(newXp);
    try {
      localStorage.setItem("puzzleRushXP", newXp.toString());
    } catch (error) {
      console.warn("Could not save XP to localStorage:", error);
    }
    
    // Check if player leveled up
    const oldLevel = calculateLevel(oldXp).playerLevel;
    const newLevelInfo = calculateLevel(newXp);
    
    if (newLevelInfo.playerLevel > oldLevel) {
      setLevelUpReward(newLevelInfo.reward);
      setShowLevelUpAlert(true);
      addToLog(`🎉 LEVEL UP! You are now level ${newLevelInfo.playerLevel}!`);
    }
    
    return newXp;
  }, [xp, calculateLevel]);

  // Initialize game
  useEffect(() => {
    setBoard(createBoard());
    calculateLevel(xp);
  }, [createBoard, calculateLevel, xp]);

  // Log when wallet changes to help debug (same as GameBoard)
  useEffect(() => {
    console.log("PuzzleRush: Wallet prop changed:", { 
      connected: wallet?.connected, 
      hasAccount: !!wallet?.account,
      address: wallet?.account?.address
    });
  }, [wallet]);

  // Add to game log
  const addToLog = (message) => {
    setGameLog(prev => [...prev.slice(-4), message]);
  };

  // Check for matches
  const checkMatches = useCallback((currentBoard = board) => {
    const matches = [];
    
    // Check horizontal matches
    for (let row = 0; row < BOARD_SIZE; row++) {
      let count = 1;
      let currentType = currentBoard[row][0].type;
      
      for (let col = 1; col < BOARD_SIZE; col++) {
        if (currentBoard[row][col].type === currentType) {
          count++;
        } else {
          if (count >= 3) {
            for (let i = col - count; i < col; i++) {
              matches.push({ row, col: i });
            }
          }
          count = 1;
          currentType = currentBoard[row][col].type;
        }
      }
      
      if (count >= 3) {
        for (let i = BOARD_SIZE - count; i < BOARD_SIZE; i++) {
          matches.push({ row, col: i });
        }
      }
    }
    
    // Check vertical matches
    for (let col = 0; col < BOARD_SIZE; col++) {
      let count = 1;
      let currentType = currentBoard[0][col].type;
      
      for (let row = 1; row < BOARD_SIZE; row++) {
        if (currentBoard[row][col].type === currentType) {
          count++;
        } else {
          if (count >= 3) {
            for (let i = row - count; i < row; i++) {
              matches.push({ row: i, col });
            }
          }
          count = 1;
          currentType = currentBoard[row][col].type;
        }
      }
      
      if (count >= 3) {
        for (let i = BOARD_SIZE - count; i < BOARD_SIZE; i++) {
          matches.push({ row: i, col });
        }
      }
    }
    
    return matches;
  }, [board]);

  // Remove matches and drop pieces
  const removeMatches = useCallback((matches) => {
    if (matches.length === 0) return board;
    
    const newBoard = board.map(row => [...row]);
    const matchesByType = {};
    
    // Mark matches and count by type
    matches.forEach(({ row, col }) => {
      const cell = newBoard[row][col];
      cell.isMatched = true;
      matchesByType[cell.type] = (matchesByType[cell.type] || 0) + 1;
    });
    
    // Award energy to Pokémon and calculate score
    let scoreGained = 0;
    Object.entries(matchesByType).forEach(([type, count]) => {
      scoreGained += count * 10 * (combo + 1);
      
      // Charge Pokémon energy
      setPlayerPokemon(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(pokemonType => {
          if (pokemonType === type) {
            updated[pokemonType] = {
              ...updated[pokemonType],
              energy: Math.min(10, updated[pokemonType].energy + count)
            };
          }
        });
        return updated;
      });
    });
    
    setScore(prev => prev + scoreGained);
    setCombo(prev => {
      const newCombo = prev + 1;
      setMaxCombo(current => Math.max(current, newCombo));
      return newCombo;
    });
    
    // Drop pieces
    for (let col = 0; col < BOARD_SIZE; col++) {
      let writeRow = BOARD_SIZE - 1;
      
      for (let row = BOARD_SIZE - 1; row >= 0; row--) {
        if (!newBoard[row][col].isMatched) {
          if (writeRow !== row) {
            newBoard[writeRow][col] = { ...newBoard[row][col], row: writeRow };
            newBoard[row][col] = {
              id: `${row}-${col}`,
              type: ELEMENT_KEYS[Math.floor(Math.random() * ELEMENT_KEYS.length)],
              row,
              col,
              isMatched: false
            };
          }
          writeRow--;
        }
      }
      
      // Fill empty spaces at top
      for (let row = writeRow; row >= 0; row--) {
        newBoard[row][col] = {
          id: `${row}-${col}`,
          type: ELEMENT_KEYS[Math.floor(Math.random() * ELEMENT_KEYS.length)],
          row,
          col,
          isMatched: false
        };
      }
    }
    
    return newBoard;
  }, [board, combo]);

  // Handle cell click
  const handleCellClick = (row, col) => {
    if (!isGameActive || moves <= 0) return;
    
    if (!selectedCell) {
      setSelectedCell({ row, col });
    } else {
      const { row: selectedRow, col: selectedCol } = selectedCell;
      
      // Check if cells are adjacent
      const isAdjacent = 
        (Math.abs(row - selectedRow) === 1 && col === selectedCol) ||
        (Math.abs(col - selectedCol) === 1 && row === selectedRow);
      
      if (isAdjacent) {
        // Swap cells
        const newBoard = board.map(r => [...r]);
        const temp = newBoard[row][col].type;
        newBoard[row][col].type = newBoard[selectedRow][selectedCol].type;
        newBoard[selectedRow][selectedCol].type = temp;
        
        // Check if swap creates matches
        const matches = checkMatches(newBoard);
        
        if (matches.length > 0) {
          setBoard(newBoard);
          setMoves(prev => prev - 1);
          
          // Process matches after a delay
          setTimeout(() => {
            const updatedBoard = removeMatches(matches);
            setBoard(updatedBoard);
            
            // Check for chain reactions
            setTimeout(() => {
              const newMatches = checkMatches(updatedBoard);
              if (newMatches.length === 0) {
                setCombo(0);
              }
            }, 300);
          }, 200);
        } else {
          // Revert swap if no matches
          addToLog("No matches found!");
        }
      }
      
      setSelectedCell(null);
    }
  };

  // Attack boss with charged Pokémon
  const attackBoss = async (pokemonType) => {
    const pokemon = playerPokemon[pokemonType];
    if (pokemon.energy < 3) {
      addToLog(`${pokemon.name} needs more energy to attack!`);
      return;
    }
    
    const damage = pokemon.level * 20 + Math.floor(Math.random() * 20);
    const newBossHP = Math.max(0, boss.currentHP - damage);
    
    setBoss(prev => ({ ...prev, currentHP: newBossHP }));
    setPlayerPokemon(prev => ({
      ...prev,
      [pokemonType]: { ...prev[pokemonType], energy: prev[pokemonType].energy - 3 }
    }));
    
    addToLog(`${pokemon.name} attacked for ${damage} damage!`);
    
    // Check if boss is defeated
    if (newBossHP <= 0) {
      const xpGained = Math.floor(Math.random() * 15) + 10;
      const newXp = updateXP(xpGained);
      addToLog(`Boss defeated! Gained ${xpGained} XP! (Total: ${newXp} XP)`);
      
      // 👇 Blockchain XP integration - same as GameBoard
      if (wallet && wallet.connected && wallet.account) {
        try {
          addToLog("🔄 Preparing blockchain XP transaction...");
          await trainCreature(xpGained);
        } catch (err) {
          console.error("Failed to train creature after boss defeat:", err);
          addToLog(`⚠️ Blockchain XP transaction failed: ${err.message}`);
        }
      } else {
        console.log("Wallet not connected, skipping trainCreature call");
        addToLog("💡 Connect your wallet to earn XP on the blockchain!");
      }
      
      if (level < BOSS_POKEMON.length) {
        setGameLevel(prev => prev + 1);
        setBoss({ ...BOSS_POKEMON[level], currentHP: BOSS_POKEMON[level].hp });
        addToLog(`Moving to level ${level + 1}!`);
      } else {
        setShowVictoryModal(true);
        setIsGameActive(false);
      }
    }
  };

  // Reset game
  const resetGame = () => {
    setBoard(createBoard());
    setScore(0);
    setMoves(30);
    setGameLevel(1);
    setCombo(0);
    setMaxCombo(0);
    setIsGameActive(true);
    setBoss({ ...BOSS_POKEMON[0], currentHP: BOSS_POKEMON[0].hp });
    setPlayerPokemon({
      FIRE: { ...POKEMON_DATA.FIRE[0], currentHP: POKEMON_DATA.FIRE[0].maxHP, energy: 0 },
      WATER: { ...POKEMON_DATA.WATER[0], currentHP: POKEMON_DATA.WATER[0].maxHP, energy: 0 },
      GRASS: { ...POKEMON_DATA.GRASS[0], currentHP: POKEMON_DATA.GRASS[0].maxHP, energy: 0 }
    });
    setGameLog(['Game reset! Good luck!']);
    setShowVictoryModal(false);
  };

  // Check game over conditions
  useEffect(() => {
    if (moves <= 0 && isGameActive) {
      setIsGameActive(false);
      addToLog("Out of moves! Game over!");
    }
  }, [moves, isGameActive]);

  // Get XP progress percentage (same as GameBoard)
  const getXpProgressPercentage = () => {
    if (xpToNextLevel === "MAX") return 100;
    
    const currentLevelObj = XP_LEVELS.find(l => l.level === playerLevel);
    const nextLevelObj = XP_LEVELS.find(l => l.level === playerLevel + 1);
    
    if (!nextLevelObj) return 100;
    
    const levelMinXp = currentLevelObj.xpRequired;
    const xpRange = nextLevelObj.xpRequired - levelMinXp;
    const playerProgress = xp - levelMinXp;
    
    return Math.min(100, Math.round((playerProgress / xpRange) * 100));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            ⚡ Pokémon Puzzle Rush ⚡
          </h1>
          <p className="text-gray-300">Match elements to charge your Pokémon and defeat the boss!</p>
        </div>

        {/* XP Bar and Level Display - same as GameBoard */}
        <div className="mb-6 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <div className="font-bold text-lg text-white">Level {playerLevel}</div>
            <div className="text-sm text-gray-300">
              {xpToNextLevel === "MAX" ? 
                "MAX LEVEL" : 
                `${xp} / ${xpToNextLevel + xp} XP to Level ${playerLevel + 1}`}
            </div>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500 shadow-lg shadow-blue-500/20"
              style={{ width: `${getXpProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2">
            <div className="text-sm font-semibold text-yellow-400">
              Rank: {
                playerLevel <= 3 ? "Rookie Trainer" :
                playerLevel <= 5 ? "Skilled Trainer" :
                playerLevel <= 7 ? "Expert Trainer" :
                playerLevel <= 9 ? "Master Trainer" : "Pokémon Champion"
              }
            </div>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-300">
                {wallet?.connected ? 
                  <span className="text-green-400">Connected</span> : 
                  <span className="text-gray-400">Not Connected</span>
                }
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Game Stats */}
          <div className="space-y-4">
            {/* Game Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-4">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-white">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Game Stats
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Score:</span>
                  <span className="font-bold text-blue-400">{score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Moves Left:</span>
                  <span className={`font-bold ${moves <= 5 ? 'text-red-400' : 'text-green-400'}`}>
                    {moves}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Level:</span>
                  <span className="font-bold text-purple-400">{level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Max Combo:</span>
                  <span className="font-bold text-orange-400">{maxCombo}</span>
                </div>
              </div>
            </div>

            {/* Boss Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-red-500/30 p-4">
              <h3 className="font-bold text-lg mb-3 text-red-400 flex items-center gap-2">
                👾 Boss Battle
              </h3>
              <div className="text-center">
                <h4 className="font-semibold text-white mb-2">{boss.name}</h4>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">HP:</span>
                    <span className="text-red-400">{boss.currentHP}/{boss.hp}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-300 shadow-lg shadow-red-500/20"
                      style={{ width: `${(boss.currentHP / boss.hp) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pokémon Team */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-4">
              <h3 className="font-bold text-lg mb-3 text-white">🎯 Your Team</h3>
              <div className="space-y-3">
                {Object.entries(playerPokemon).map(([type, pokemon]) => {
                  const elementType = ELEMENT_TYPES[type];
                  const Icon = elementType.icon;
                  
                  return (
                    <div key={type} className={`${elementType.bg} ${elementType.border} border-2 rounded-lg p-3 backdrop-blur-sm shadow-lg ${elementType.glow} shadow-lg transition-all duration-300 hover:scale-105`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${elementType.color}`} />
                          <span className="font-semibold text-sm text-white">{pokemon.name}</span>
                        </div>
                        <span className="text-xs bg-gray-700/80 text-gray-200 px-2 py-1 rounded">Lv.{pokemon.level}</span>
                      </div>
                      
                      {/* HP Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300">HP:</span>
                          <span className="text-green-400">{pokemon.currentHP}/{pokemon.maxHP}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300 shadow-sm shadow-green-500/20"
                            style={{ width: `${(pokemon.currentHP / pokemon.maxHP) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Energy Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300">Energy:</span>
                          <span className={elementType.color}>{pokemon.energy}/10</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 shadow-sm ${elementType.glow} ${elementType.color.replace('text-', 'bg-')}`}
                            style={{ width: `${(pokemon.energy / 10) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Attack Button */}
                      <button
                        onClick={() => attackBoss(type)}
                        disabled={pokemon.energy < 3 || !isGameActive}
                        className={`w-full text-xs py-2 px-3 rounded-md font-semibold transition-all duration-200 ${
                          pokemon.energy >= 3 && isGameActive
                            ? `${elementType.color.replace('text-', 'bg-')} text-white hover:opacity-80 shadow-lg ${elementType.glow}`
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Attack (3⚡)
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Panel - Game Board */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-4">
            <div className="text-center mb-4">
              <h3 className="font-bold text-lg mb-2 text-white">🎮 Puzzle Board</h3>
              <div className="flex justify-center items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-300">Combo:</span>
                  <span className="font-bold text-orange-400">{combo}x</span>
                </div>
                {training && (
                  <div className="flex items-center gap-1 text-blue-400 animate-pulse">
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs">Training on blockchain...</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-8 gap-1 max-w-md mx-auto">
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const elementType = ELEMENT_TYPES[cell.type];
                  const Icon = elementType.icon;
                  const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                  
                  return (
                    <button
                      key={cell.id}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                      disabled={!isGameActive}
                      className={`
                        aspect-square w-full p-2 rounded-lg border-2 transition-all duration-200 backdrop-blur-sm
                        ${elementType.bg} ${elementType.border}
                        ${isSelected ? 'ring-4 ring-yellow-400/50 scale-110 shadow-xl shadow-yellow-400/25' : 'hover:scale-105'}
                        ${!isGameActive ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
                        ${cell.isMatched ? 'animate-pulse' : ''}
                        ${elementType.glow} shadow-md
                      `}
                    >
                      <Icon className={`w-full h-full ${elementType.color} ${isSelected ? 'animate-pulse' : ''}`} />
                    </button>
                  );
                })
              )}
            </div>
            
            {/* Element Legend */}
            <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
              {Object.entries(ELEMENT_TYPES).slice(0, 4).map(([key, type]) => {
                const Icon = type.icon;
                return (
                  <div key={key} className="flex items-center gap-1 justify-center text-gray-300">
                    <Icon className={`w-3 h-3 ${type.color}`} />
                    <span>{type.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Game Log & Controls */}
          <div className="space-y-4">
            {/* Game Log */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-4">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-white">
                <Award className="w-5 h-5 text-green-400" />
                Game Log
              </h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {gameLog.map((log, index) => (
                  <div key={index} className="text-sm p-2 bg-gray-700/50 rounded text-gray-200 border border-gray-600/30">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-4">
              <h3 className="font-bold text-lg mb-3 text-white">⚙️ Controls</h3>
              <div className="space-y-3">
                <button
                  onClick={resetGame}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/25"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Game
                </button>
                
                <div className="text-xs text-gray-300 space-y-1 bg-gray-700/30 p-3 rounded-lg border border-gray-600/30">
                  <p>• Match 3+ elements to charge Pokémon</p>
                  <p>• Use 3⚡ energy to attack boss</p>
                  <p>• Create combos for bonus points</p>
                  <p>• Defeat bosses to level up!</p>
                  <p>• Connect wallet for blockchain XP!</p>
                </div>
              </div>
            </div>

            {/* Wallet Status */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-cyan-500/30 p-4">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-white">
                <Wallet className="w-5 h-5 text-cyan-400" />
                Blockchain Status
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Wallet:</span>
                  <span className={wallet?.connected ? 'text-green-400' : 'text-red-400'}>
                    {wallet?.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {wallet?.connected && (
                  <div className="text-xs text-gray-300 break-all">
                    {wallet.account?.address?.slice(0, 8)}...{wallet.account?.address?.slice(-6)}
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  {wallet?.connected ? 
                    "XP gains will be stored on-chain!" : 
                    "Connect wallet to store XP on blockchain"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Level Up Modal */}
        {showLevelUpAlert && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 text-center border border-yellow-400/50">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">Level Up!</h2>
              <p className="text-xl mb-2 text-white">
                Congratulations! You've reached <strong className="text-yellow-400">Level {playerLevel}</strong>!
              </p>
              <p className="mb-6 text-gray-300">
                You've unlocked: <strong className="text-blue-400">{levelUpReward}</strong>
              </p>
              <button
                onClick={() => setShowLevelUpAlert(false)}
                className="bg-yellow-500 text-gray-900 px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-bold shadow-lg"
              >
                Awesome!
              </button>
            </div>
          </div>
        )}

        {/* Victory Modal */}
        {showVictoryModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 text-center border border-green-400/50">
              <div className="text-6xl mb-4">👑</div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">Victory!</h2>
              <p className="text-lg mb-4 text-white">
                Congratulations! You've defeated all the bosses and become the Pokémon Champion!
              </p>
              <div className="mb-6 p-4 bg-green-900/30 rounded-lg border border-green-400/30">
                <p className="font-semibold text-green-400 mb-2">Final Stats:</p>
                <p className="text-gray-300">Score: {score.toLocaleString()}</p>
                <p className="text-gray-300">Max Combo: {maxCombo}x</p>
                <p className="text-gray-300">Level Reached: {level}</p>
                <p className="text-gray-300">Total XP: {xp}</p>
              </div>
              <button
                onClick={resetGame}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors font-bold shadow-lg"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokemonPuzzleRush;