import React, { useState, useEffect } from "react";
import Card from "../components/Card";
import playerCards from "../data/playerCards"; // Import player cards
import aiCards from "../data/aiCards"; // Import AI cards
import { TransactionBlock } from "@mysten/sui.js/transactions"; // Import the TransactionBlock for Sui transactions
import { SuiClient } from "@mysten/sui.js/client"; // Import SuiClient for fetching NFTs

// Contract address from the BattleArena.js file
const CONTRACT_ADDRESS = "0x70217963607936caee034ce016fb2e9be0debc644d13a6ac40d955940e1066a7";

// Create a SuiClient instance for testnet
const TESTNET_CLIENT = new SuiClient({
  url: "https://fullnode.testnet.sui.io",
});

// XP Constants
const XP_LEVELS = [
  { level: 1, xpRequired: 0, reward: "Basic Card Pack" },
  { level: 2, xpRequired: 25, reward: "1 Rare Card" },
  { level: 3, xpRequired: 75, reward: "Standard Card Pack" },
  { level: 4, xpRequired: 150, reward: "2 Rare Cards" },
  { level: 5, xpRequired: 300, reward: "Elite Card Pack" },
  { level: 6, xpRequired: 500, reward: "1 Ultra Rare Card" },
  { level: 7, xpRequired: 750, reward: "Premium Card Pack" },
  { level: 8, xpRequired: 1000, reward: "2 Ultra Rare Cards" },
  { level: 9, xpRequired: 1500, reward: "Master Card Pack" },
  { level: 10, xpRequired: 2500, reward: "Legendary Card" }
];

const cloneCardWithHP = (card) => ({
  ...card,
  currentHP: card.hp,
});

const GameBoard = ({ wallet }) => {
  // State for player's bench (4 cards max)
  const [bench, setBench] = useState([]);
  // State for player's deck (remaining cards to draw)
  const [deck, setDeck] = useState([]);
  // State for player's active card in battle
  const [activeCard, setActiveCard] = useState(null);
  // State for AI's active card
  const [aiCard, setAiCard] = useState(null);
  // State for cards that have been played and can't be used again
  const [usedCards, setUsedCards] = useState([]);
  // State for knocked out cards (to display in UI)
  const [knockedOutCards, setKnockedOutCards] = useState([]);
  const [aiKnockedOutCards, setAiKnockedOutCards] = useState([]);
  // Game state
  const [turn, setTurn] = useState("player");
  const [log, setLog] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  // Stats tracking
  const [wins, setWins] = useState(
    () => parseInt(localStorage.getItem("wins")) || 0
  );
  const [losses, setLosses] = useState(
    () => parseInt(localStorage.getItem("losses")) || 0
  );
  
  // Match tracking (wins within current match)
  const [playerMatchWins, setPlayerMatchWins] = useState(0);
  const [aiMatchWins, setAiMatchWins] = useState(0);
  const [matchWinner, setMatchWinner] = useState(null);
  const [showMatchAlert, setShowMatchAlert] = useState(false);
  
  // XP System
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem("playerXP")) || 0);
  const [level, setLevel] = useState(1);
  const [xpToNextLevel, setXpToNextLevel] = useState(0);
  const [showLevelUpAlert, setShowLevelUpAlert] = useState(false);
  const [levelUpReward, setLevelUpReward] = useState("");
  
  // Training status
  const [training, setTraining] = useState(false);

  // Initialize the game - shuffle deck and set up bench
  useEffect(() => {
    initializeGame();
    
    // Initialize level information based on current XP
    calculateLevel(xp);
  }, []);
  
  // Log when wallet changes to help debug
  useEffect(() => {
    console.log("GameBoard: Wallet prop changed:", { 
      connected: wallet?.connected, 
      hasAccount: !!wallet?.account,
      address: wallet?.account?.address
    });
  }, [wallet]);

  // Calculate player level based on XP
  const calculateLevel = (currentXp) => {
    let playerLevel = 1;
    let nextLevelXp = 0;
    let reward = "";

    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
      if (currentXp >= XP_LEVELS[i].xpRequired) {
        playerLevel = XP_LEVELS[i].level;
        nextLevelXp = i < XP_LEVELS.length - 1 ? XP_LEVELS[i + 1].xpRequired : null;
        reward = XP_LEVELS[i].reward;
        break;
      }
    }

    setLevel(playerLevel);
    setXpToNextLevel(nextLevelXp !== null ? nextLevelXp - currentXp : "MAX");
    return { playerLevel, nextLevelXp, reward };
  };

  // Update XP and check for level ups
  const updateXP = (amount) => {
    const oldXp = xp;
    const newXp = oldXp + amount;
    
    setXp(newXp);
    localStorage.setItem("playerXP", newXp);
    
    // Check if player leveled up
    const oldLevel = calculateLevel(oldXp).playerLevel;
    const newLevelInfo = calculateLevel(newXp);
    
    if (newLevelInfo.playerLevel > oldLevel) {
      setLevelUpReward(newLevelInfo.reward);
      setShowLevelUpAlert(true);
      setLog((prev) => [...prev, `🎉 LEVEL UP! You are now level ${newLevelInfo.playerLevel}!`]);
    }
    
    return newXp;
  };

  // Function to train creature on blockchain (from BattleArena.js)
  const trainCreature = async (xpAmount) => {
    console.log("trainCreature called with xpAmount:", xpAmount);
    console.log("Wallet status:", { connected: wallet?.connected, hasAccount: !!wallet?.account });
    
    if (!wallet || !wallet.connected || !wallet.account) {
      console.log("Wallet not connected, skipping blockchain XP gain");
      setLog((prev) => [...prev, "Wallet not connected. Blockchain XP gain skipped."]);
      return;
    }
    
    // Get the first creature from wallet (simplification - in a real app you'd want to select)
    try {
      setTraining(true);
      setLog((prev) => [...prev, `🔄 Initiating blockchain training (${xpAmount} XP)...`]);
      
      // Create a transaction block
      const txb = new TransactionBlock();
      console.log("Transaction block created");
      
      // Get the creature objects from wallet using TESTNET_CLIENT instead of wallet.client
      console.log("Fetching owned objects from wallet:", wallet.account.address);
      const nfts = await TESTNET_CLIENT.getOwnedObjects({
        owner: wallet.account.address,
        options: {
          showContent: true,
          showType: true,
        },
      });
      
      console.log("NFTs found in wallet:", nfts.data.length);
      
      // Find a valid creature to train
      const creature = nfts.data.find((obj) => {
        const type = obj.data?.type;
        const isTrainable = type && (type.includes("starter_nft") || type.includes("suimon") || type.includes("creature"));
        console.log("Checking NFT:", { objectId: obj.data?.objectId, type, isTrainable });
        return isTrainable;
      });
      
      if (!creature) {
        console.log("No trainable creatures found in wallet");
        setLog((prev) => [...prev, "No trainable creatures found in wallet."]);
        return;
      }
      
      console.log("Found trainable creature:", creature.data.objectId);
      
      // Call the gain_experience function on the smart contract
      txb.moveCall({
        target: `${CONTRACT_ADDRESS}::starter_nft::gain_experience`,
        arguments: [
          txb.object(creature.data.objectId), // NFT object ID
          txb.pure(xpAmount), // Experience amount to gain
        ],
      });
      
      console.log("Move call prepared, executing transaction...");
      
      // Execute the transaction
      const { response } = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txb,
      });
      
      console.log("Transaction successful:", response);
      setLog((prev) => [...prev, `🎮 Blockchain training successful! Your creature gained ${xpAmount} XP on-chain.`]);
    } catch (err) {
      console.error("Training transaction failed:", err);
      setLog((prev) => [...prev, `⚠️ Blockchain training failed: ${err.message}`]);
    } finally {
      setTraining(false);
    }
  };

  const initializeGame = () => {
    // Shuffle the player cards
    const shuffledCards = [...playerCards].sort(() => 0.5 - Math.random());
    
    // Set the first 4 cards as the bench
    const initialBench = shuffledCards.slice(0, 4).map(card => ({...card}));
    
    // The rest go to the deck
    const initialDeck = shuffledCards.slice(4).map(card => ({...card}));
    
    setBench(initialBench);
    setDeck(initialDeck);
    setLog(["Game started! Select a card from your bench to play."]);
  };

  const updateWins = async () => {
    const newWins = wins + 1;
    setWins(newWins);
    localStorage.setItem("wins", newWins);
    
    // Award XP for winning (random between 5-10)
    const winXp = Math.floor(Math.random() * 6) + 5;
    const newXp = updateXP(winXp);
    setLog((prev) => [...prev, `You earned ${winXp} XP for winning! (Total: ${newXp} XP)`]);
    
    // Update match wins
    const newPlayerMatchWins = playerMatchWins + 1;
    setPlayerMatchWins(newPlayerMatchWins);
    setLog((prev) => [...prev, `You won this round! (${newPlayerMatchWins}/4 wins)`]);
    
    // Check if player has won the match
    if (newPlayerMatchWins >= 4) {
      // Award bonus XP for winning the match
      const matchXp =  Math.floor(Math.random() * 6) + 2;
      const updatedXp = updateXP(matchXp);
      setLog((prev) => [...prev, `You earned ${matchXp} bonus XP for winning the match! (Total: ${updatedXp} XP)`]);
      
      setMatchWinner("player");
      setShowMatchAlert(true);
      setLog((prev) => [...prev, "Congratulations! You won the match!"]);
      
      console.log("Match won, attempting to train creature with XP:", matchXp);
      console.log("Current wallet state:", { wallet, connected: wallet?.connected, hasAccount: !!wallet?.account });
      
      if (wallet && wallet.connected && wallet.account) {
        try {
          // 👇 Trigger on-chain XP gain transaction
          setLog((prev) => [...prev, "🔄 Preparing blockchain XP transaction..."]);
          await trainCreature(matchXp);
        } catch (err) {
          console.error("Failed to train creature after match win:", err);
          setLog((prev) => [...prev, `⚠️ Blockchain XP transaction failed: ${err.message}`]);
        }
      } else {
        console.log("Wallet not connected, skipping trainCreature call");
        setLog((prev) => [...prev, "💡 Connect your wallet to earn XP on the blockchain!"]);
      }
    }
  };

  const updateLosses = () => {
    const newLosses = losses + 1;
    setLosses(newLosses);
    localStorage.setItem("losses", newLosses);
    
    // Award consolation XP for losing (1 XP)
    const lossXp = 1;
    const newXp = updateXP(lossXp);
    setLog((prev) => [...prev, `You earned ${lossXp} XP for participating. (Total: ${newXp} XP)`]);
    
    // Update AI match wins
    const newAiMatchWins = aiMatchWins + 1;
    setAiMatchWins(newAiMatchWins);
    setLog((prev) => [...prev, `AI won this round! (${newAiMatchWins}/4 wins)`]);
    
    // Check if AI has won the match
    if (newAiMatchWins >= 4) {
      // Award consolation XP for completing a match
      const matchXp = 3;
      const updatedXp = updateXP(matchXp);
      setLog((prev) => [...prev, `You earned ${matchXp} consolation XP for completing the match. (Total: ${updatedXp} XP)`]);
      
      setMatchWinner("ai");
      setShowMatchAlert(true);
      setLog((prev) => [...prev, "AI won the match! Better luck next time."]);
    }
  };

  // Play a card from the bench
  const handlePlayCard = (card) => {
    if (turn !== "player" || activeCard || gameOver) return;
    
    // Set the selected card as active
    setActiveCard(cloneCardWithHP(card));
    
    // Remove the card from bench
    setBench(bench.filter((c) => c.id !== card.id));
    
    // Add to used cards
    setUsedCards((prev) => [...prev, card.id]);
    
    // Draw a new card from deck to bench if available
    if (deck.length > 0) {
      const newCard = deck[0];
      setBench(prevBench => [...prevBench, newCard]);
      setDeck(prevDeck => prevDeck.slice(1));
      setLog((prev) => [...prev, `You played ${card.name} and drew a new card to your bench.`]);
    } else {
      setLog((prev) => [...prev, `You played ${card.name}. No more cards in deck!`]);
    }
  };

  const handleAttack = (attack) => {
    if (turn !== "player" || !aiCard || !activeCard || gameOver) return;

    const newHP = aiCard.currentHP - attack.damage;
    setLog((prev) => [
      ...prev,
      `You used ${attack.name} for ${attack.damage} damage!`,
    ]);

    if (newHP <= 0) {
      setLog((prev) => [...prev, `AI's ${aiCard.name} was knocked out!`]);
      // Add knocked out card to AI's knocked out pile
      setAiKnockedOutCards(prev => [...prev, aiCard]);
      setAiCard(null);
      updateWins();
    } else {
      setAiCard({ ...aiCard, currentHP: newHP });
    }

    setTurn("ai");
  };

  const endTurn = () => {
    if (turn !== "player" || gameOver) return;
    setTurn("ai");
  };

  const checkGameOver = () => {
    const noBenchCards = bench.length === 0;
    const noDeckCards = deck.length === 0;
    const noActiveCard = !activeCard;
    const noAiCardOrCards = !aiCard && aiCards.filter(c => !usedCards.includes(c.id)).length === 0;
    
    if ((noBenchCards && noDeckCards && noActiveCard) || noAiCardOrCards) {
      setGameOver(true);
      setLog((prev) => [...prev, "Game Over! No more cards available."]);
    }
  };

  useEffect(() => {
    checkGameOver();

    if (turn === "ai" && !gameOver) {
      const timeout = setTimeout(() => {
        const remaining = aiCards.filter((c) => !usedCards.includes(c.id));

        if (!aiCard) {
          // Only set a new AI card if there's no current one
          if (remaining.length === 0) {
            setLog((prev) => [...prev, "AI has no cards left."]);
            setAiCard(null);
            setTurn("player");
            return;
          }

          const aiRandom =
            remaining[Math.floor(Math.random() * remaining.length)];
          const aiClone = cloneCardWithHP(aiRandom);
          setAiCard(aiClone);
          setUsedCards((prev) => [...prev, aiClone.id]);
          setLog((prev) => [...prev, `AI played ${aiClone.name}`]);
          setTurn("player");
          return;
        }

        // AI has an active card, so it attacks
        if (activeCard && aiCard.attacks.length > 0) {
          const atk =
            aiCard.attacks[Math.floor(Math.random() * aiCard.attacks.length)];
          const newHP = activeCard.currentHP - atk.damage;

          setLog((prev) => [
            ...prev,
            `AI used ${atk.name} for ${atk.damage} damage!`,
          ]);

          if (newHP <= 0) {
            setLog((prev) => [...prev, `Your ${activeCard.name} was knocked out!`]);
            setKnockedOutCards((prev) => [...prev, activeCard]);
            setActiveCard(null);
            updateLosses();
          } else {
            setActiveCard({ ...activeCard, currentHP: newHP });
          }
        }

        setTurn("player");
      }, 1200);

      return () => clearTimeout(timeout);
    }
  }, [turn]);

  const resetGame = () => {
    setActiveCard(null);
    setAiCard(null);
    setBench([]);
    setDeck([]);
    setUsedCards([]);
    setKnockedOutCards([]);
    setAiKnockedOutCards([]);
    setTurn("player");
    setGameOver(false);
    setLog([]);
    initializeGame();
  };

  const startNewMatch = () => {
    setPlayerMatchWins(0);
    setAiMatchWins(0);
    setMatchWinner(null);
    setShowMatchAlert(false);
    resetGame();
  };

  // Close the match winner alert
  const closeMatchAlert = () => {
    setShowMatchAlert(false);
  };

  // Close the level up alert
  const closeLevelUpAlert = () => {
    setShowLevelUpAlert(false);
  };

  // Reset XP and levels
  const resetXP = () => {
    const confirmed = window.confirm("Reset XP and level progress?");
    if (confirmed) {
      localStorage.removeItem("playerXP");
      setXp(0);
      calculateLevel(0);
      setLog((prev) => [...prev, "XP and level progress reset."]);
    }
  };

  // Calculate XP progress percentage for the progress bar
  const getXpProgressPercentage = () => {
    if (xpToNextLevel === "MAX") return 100;
    
    const currentLevelObj = XP_LEVELS.find(l => l.level === level);
    const nextLevelObj = XP_LEVELS.find(l => l.level === level + 1);
    
    if (!nextLevelObj) return 100;
    
    const levelMinXp = currentLevelObj.xpRequired;
    const xpRange = nextLevelObj.xpRequired - levelMinXp;
    const playerProgress = xp - levelMinXp;
    
    return Math.min(100, Math.round((playerProgress / xpRange) * 100));
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-4">Pokémon TCG</h1>

      {/* XP Bar and Level Display */}
      <div className="mb-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-1">
          <div className="font-bold">Level {level}</div>
          <div className="text-sm">
            {xpToNextLevel === "MAX" ? 
              "MAX LEVEL" : 
              `${xp} / ${xpToNextLevel + xp} XP to Level ${level + 1}`}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${getXpProgressPercentage()}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2">
          <div className="text-sm font-semibold">Rank: {
            level <= 3 ? "Rookie Trainer" :
            level <= 5 ? "Skilled Trainer" :
            level <= 7 ? "Expert Trainer" :
            level <= 9 ? "Master Trainer" : "Pokémon Champion"
          }</div>
          <button 
            onClick={resetXP}
            className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
          >
            Reset XP
          </button>
        </div>
      </div>

      <div className="flex justify-between px-8 mb-6">
        <p className="font-semibold">
          Turn:{" "}
          {gameOver ? "Game Over" : turn === "player" ? "Your Turn" : "AI Turn"}
        </p>
        {!gameOver && turn === "player" && (
          <button
            onClick={endTurn}
            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
          >
            End Turn
          </button>
        )}
        {gameOver && (
          <button
            onClick={resetGame}
            className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
          >
            New Game
          </button>
        )}
      </div>

      {/* Match Tracker */}
      <div className="flex justify-center gap-8 mb-4">
        <div className={`px-4 py-2 rounded-lg shadow ${playerMatchWins > aiMatchWins ? 'bg-green-100' : 'bg-gray-100'}`}>
          Your Match Wins: <strong>{playerMatchWins}/4</strong>
        </div>
        <div className={`px-4 py-2 rounded-lg shadow ${aiMatchWins > playerMatchWins ? 'bg-red-100' : 'bg-gray-100'}`}>
          AI Match Wins: <strong>{aiMatchWins}/4</strong>
        </div>
      </div>

      {/* Match Winner Alert */}
      {showMatchAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">
              {matchWinner === "player" ? "Congratulations!" : "Game Over"}
            </h2>
            <p className="text-xl mb-6">
              {matchWinner === "player"
                ? "You won the match by winning 4 rounds!"
                : "AI won the match by winning 4 rounds!"}
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={startNewMatch}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
              >
                Start New Match
              </button>
              <button
                onClick={closeMatchAlert}
                className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Up Alert */}
      {showLevelUpAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4 text-yellow-600">Level Up!</h2>
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-xl mb-2">
              Congratulations! You've reached <strong>Level {level}</strong>!
            </p>
            <p className="mb-6">
              You've unlocked: <strong className="text-blue-600">{levelUpReward}</strong>
            </p>
            <div className="flex justify-center">
              <button
                onClick={closeLevelUpAlert}
                className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600"
              >
                Awesome!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Game Layout */}
      <div className="grid grid-cols-7 gap-2">
        {/* Player's Knocked Out Cards - Left Side */}
        <div className="col-span-1">
          <h3 className="text-sm font-semibold mb-2 text-center">Knocked Out</h3>
          <div className="flex flex-col gap-2">
            {knockedOutCards.map((card, index) => (
              <div key={`ko-${index}`} className="opacity-60 scale-75 transform origin-top">
                <Card card={card} />
              </div>
            ))}
          </div>
        </div>

        {/* Main Battle Area - Center */}
        <div className="col-span-5">
          {/* AI's Side */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2 text-center">
              AI's Active Pokémon
            </h2>
            <div className="flex justify-center">
              {aiCard ? (
                <Card card={aiCard} isInBattle />
              ) : (
                <div className="w-40 h-56 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Waiting for AI...</p>
                </div>
              )}
            </div>
          </div>

          {/* Battle Field Center */}
          <div className="flex justify-center items-center h-16 my-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-black"></div>
            </div>
          </div>

          {/* Player's Active Card */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2 text-center">
              Your Active Pokémon
            </h2>
            <div className="flex justify-center">
              {activeCard ? (
                <Card card={activeCard} isInBattle onAttack={handleAttack} />
              ) : (
                <div className="w-40 h-56 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Select a card from your bench</p>
                </div>
              )}
            </div>
          </div>

          {/* Player's Bench */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-center">Your Bench</h2>
            <div className="flex justify-center flex-wrap gap-4 mt-2">
              {bench.map((card) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  onPlay={() => handlePlayCard(card)} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Player's Deck and AI's Knocked Out Cards - Right Side */}
        <div className="col-span-1 flex flex-col justify-between">
          {/* AI's Knocked Out Cards - Top Right */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-center">AI's Knocked Out</h3>
            <div className="flex flex-col gap-2">
              {aiKnockedOutCards.map((card, index) => (
                <div key={`aiko-${index}`} className="opacity-60 scale-75 transform origin-top">
                  <Card card={card} />
                </div>
              ))}
            </div>
          </div>

          {/* Player's Deck - Bottom Right */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-center">Your Deck</h3>
            <div className="flex justify-center">
              {deck.length > 0 ? (
                <div className="relative">
                  <Card showBack={true} />
                  <div className="absolute top-0 right-0 bg-white rounded-full px-2 py-1 text-xs font-bold">
                    {deck.length}
                  </div>
                </div>
              ) : (
                <div className="w-32 h-44 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400 text-xs">Empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats and Game Log */}
      <div className="mt-6 flex justify-center gap-8 text-lg">
        <div className="bg-green-100 px-4 py-2 rounded-lg shadow">
          Total Wins: <strong>{wins}</strong>
        </div>
        <div className="bg-red-100 px-4 py-2 rounded-lg shadow">
          Total Losses: <strong>{losses}</strong>
        </div>
      </div>

      <div className="text-center mt-3">
        <button
          onClick={() => {
            const confirmed = window.confirm("Reset wins and losses?");
            if (confirmed) {
              localStorage.removeItem("wins");
              localStorage.removeItem("losses");
              setWins(0);
              setLosses(0);
              setLog((prev) => [...prev, "Stats reset."]);
            }
          }}
          className="mt-2 text-sm bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
        >
          Reset Stats
        </button>
      </div>

      <div className="mt-8 bg-gray-100 p-4 rounded shadow-md max-w-xl mx-auto">
        <h2 className="text-lg font-semibold mb-2">Game Log</h2>
        <ul className="text-sm text-gray-700 space-y-1 max-h-40 overflow-y-auto">
          {log.map((line, index) => (
            <li key={index}>• {line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GameBoard;