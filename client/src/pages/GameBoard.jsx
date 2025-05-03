import React, { useState, useEffect } from "react";
import Card from "../components/Card";
import playerCards from "../data/playerCards"; // Import player cards
import aiCards from "../data/aiCards"; // Import AI cards

const cloneCardWithHP = (card) => ({
  ...card,
  currentHP: card.hp,
});

const GameBoard = () => {
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

  // Initialize the game - shuffle deck and set up bench
  useEffect(() => {
    initializeGame();
  }, []);

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

  const updateWins = () => {
    const newWins = wins + 1;
    setWins(newWins);
    localStorage.setItem("wins", newWins);
    
    // Update match wins
    const newPlayerMatchWins = playerMatchWins + 1;
    setPlayerMatchWins(newPlayerMatchWins);
    setLog((prev) => [...prev, `You won this round! (${newPlayerMatchWins}/4 wins)`]);
    
    // Check if player has won the match
    if (newPlayerMatchWins >= 4) {
      setMatchWinner("player");
      setShowMatchAlert(true);
      setLog((prev) => [...prev, "Congratulations! You won the match!"]);
    }
  };

  const updateLosses = () => {
    const newLosses = losses + 1;
    setLosses(newLosses);
    localStorage.setItem("losses", newLosses);
    
    // Update AI match wins
    const newAiMatchWins = aiMatchWins + 1;
    setAiMatchWins(newAiMatchWins);
    setLog((prev) => [...prev, `AI won this round! (${newAiMatchWins}/4 wins)`]);
    
    // Check if AI has won the match
    if (newAiMatchWins >= 4) {
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
        const remaining = aiCards.filter((c) => !usedCards.includes(c.id)); // Check for AI's unused cards

        if (remaining.length === 0) {
          // If AI has no remaining cards
          setLog((prev) => [...prev, "AI has no cards left."]);
          setAiCard(null);
          setTurn("player");
          return; // Skip AI's actions if no cards are left
        }

        const aiRandom =
          remaining[Math.floor(Math.random() * remaining.length)];

        if (aiRandom) {
          const aiClone = cloneCardWithHP(aiRandom);
          setAiCard(aiClone);
          setUsedCards((prev) => [...prev, aiClone.id]);
          setLog((prev) => [...prev, `AI played ${aiClone.name}`]);

          if (activeCard && aiClone.attacks.length > 0) {
            const atk =
              aiClone.attacks[
                Math.floor(Math.random() * aiClone.attacks.length)
              ];
            const newHP = activeCard.currentHP - atk.damage;

            setLog((prev) => [
              ...prev,
              `AI used ${atk.name} for ${atk.damage} damage!`,
            ]);

            if (newHP <= 0) {
              setLog((prev) => [
                ...prev,
                `Your ${activeCard.name} was knocked out!`,
              ]);
              // Add knocked out card to player's knocked out pile
              setKnockedOutCards(prev => [...prev, activeCard]);
              setActiveCard(null);
              updateLosses();
            } else {
              setActiveCard({ ...activeCard, currentHP: newHP });
            }
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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center mb-4">Pokémon TCG</h1>

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