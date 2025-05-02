import React from "react";
import { motion } from "framer-motion";

const Card = ({ card, onPlay, onAttack, isInBattle }) => {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-lg p-4 w-52 hover:scale-105 transition-transform"
      whileHover={{ scale: 1.05 }}
    >
      <img
        src={card.image}
        alt={card.name}
        className="w-full h-32 object-contain mb-2"
      />
      <h2 className="text-lg font-bold text-center">{card.name}</h2>
      <p className="text-sm text-center text-gray-500">
        HP: {card.currentHP ?? card.hp}
      </p>

      <div className="mt-2">
        {card.attacks.map((attack, index) => (
          <div key={index} className="text-sm mb-1">
            <strong>{attack.name}</strong> - {attack.damage} dmg
            {isInBattle && onAttack && (
              <button
                onClick={() => onAttack(attack)}
                className="ml-2 text-xs bg-red-400 hover:bg-red-500 text-white px-2 py-1 rounded"
              >
                Use
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-sm text-center text-gray-500">
        HP: {card.currentHP ?? card.hp}
      </p>
      <div className="h-2 w-full bg-red-200 rounded-full mt-1 mb-2">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{
            width: `${((card.currentHP ?? card.hp) / card.hp) * 100}%`,
          }}
        ></div>
      </div>

      {!isInBattle && onPlay && (
        <button
          onClick={() => onPlay(card)}
          className="mt-3 bg-yellow-400 hover:bg-yellow-500 text-white text-sm px-4 py-1 rounded-full w-full"
        >
          Play
        </button>
      )}
    </motion.div>
  );
};

export default Card;
