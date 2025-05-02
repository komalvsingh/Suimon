import React, { useState, useEffect } from "react";
import Card from "../components/Card";
import playerCards from "../data/playerCards"; // Import player cards
import aiCards from "../data/aiCards"; // Import AI cards

const cloneCardWithHP = (card) => ({
  ...card,
  currentHP: card.hp,
});

const GameBoard = () => {
  const [hand, setHand] = useState(playerCards); // Start with player's cards
  const [activeCard, setActiveCard] = useState(null);
  const [aiCard, setAiCard] = useState(null);
  const [usedCards, setUsedCards] = useState([]);
  const [turn, setTurn] = useState("player");
  const [log, setLog] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  const [wins, setWins] = useState(
    () => parseInt(localStorage.getItem("wins")) || 0
  );
  const [losses, setLosses] = useState(
    () => parseInt(localStorage.getItem("losses")) || 0
  );

  const updateWins = () => {
    const newWins = wins + 1;
    setWins(newWins);
    localStorage.setItem("wins", newWins);
  };

  const updateLosses = () => {
    const newLosses = losses + 1;
    setLosses(newLosses);
    localStorage.setItem("losses", newLosses);
  };

  const handlePlayCard = (card) => {
    if (turn !== "player" || activeCard || gameOver) return;
    setActiveCard(cloneCardWithHP(card));
    setHand(hand.filter((c) => c.id !== card.id));
    setUsedCards((prev) => [...prev, card.id]);
    setLog((prev) => [...prev, `You played ${card.name}`]);
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
    const noPlayerCardsLeft = hand.length === 0 && !activeCard;
    const noAiCardLeft = !aiCard;
    if (noPlayerCardsLeft && noAiCardLeft) {
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
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2 text-center">
            Your Active Pokémon
          </h2>
          {activeCard ? (
            <Card card={activeCard} isInBattle onAttack={handleAttack} />
          ) : (
            <p className="text-center text-gray-400">No card played.</p>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2 text-center">
            AI's Active Pokémon
          </h2>
          {aiCard ? (
            <Card card={aiCard} isInBattle />
          ) : (
            <p className="text-center text-gray-400">Waiting for AI...</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-center">Your Hand</h2>
        <div className="flex justify-center flex-wrap gap-4 mt-2">
          {hand.map((card) => (
            <Card key={card.id} card={card} onPlay={handlePlayCard} />
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-8 text-lg">
        <div className="bg-green-100 px-4 py-2 rounded-lg shadow">
          Wins: <strong>{wins}</strong>
        </div>
        <div className="bg-red-100 px-4 py-2 rounded-lg shadow">
          Losses: <strong>{losses}</strong>
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
