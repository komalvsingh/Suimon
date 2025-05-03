"use client";

import React from "react";
import { motion } from "framer-motion";

const Card = ({ card, onPlay, onAttack, isInBattle, showBack = false }) => {
  // Card back display
  if (showBack) {
    return (
      <motion.div
        className="bg-white rounded-lg shadow-lg p-1 w-32 hover:scale-105 transition-transform"
        whileHover={{ scale: 1.05 }}
      >
        <img
          src="https://i.ebayimg.com/images/g/M8YAAOSw5JdgClKt/s-l1200.jpg"
          alt="Card Back"
          className="w-full h-auto object-contain rounded"
        />
      </motion.div>
    );
  }

  // Safety check for null/undefined card
  if (!card) {
    return null;
  }

  return (
    <motion.div
      className="bg-white rounded-lg shadow-lg p-2 w-40 hover:scale-105 transition-transform"
      whileHover={{ scale: 1.05 }}
    >
      {/* Card image */}
      <img
        src={card.image}
        alt={card.name}
        className="w-full h-28 object-contain mb-1"
      />
      
      {/* Card name */}
      <h2 className="text-sm font-bold text-center">{card.name}</h2>
      
      {/* HP display text */}
      <p className="text-xs text-center text-gray-500">
        HP: {card.currentHP ?? card.hp}
      </p>
      
      {/* HP bar */}
      <div className="h-2 w-full bg-red-200 rounded-full mt-1 mb-2">
        <div
          className="h-full bg-green-500 rounded-full transition-all"
          style={{
            width: `${((card.currentHP ?? card.hp) / card.hp) * 100}%`,
          }}
        ></div>
      </div>

      {/* Attacks */}
      <div className="mt-1">
        {card.attacks && card.attacks.map((attack, index) => (
          <div
            key={index}
            className="text-xs mb-1 flex justify-between items-center"
          >
            <span className="font-medium">{attack.name}</span>
            <div className="flex items-center">
              <span className="text-xs">{attack.damage} dmg</span>
              {isInBattle && onAttack && (
                <button
                  onClick={() => onAttack(attack)}
                  className="ml-1 text-xs bg-red-400 hover:bg-red-500 text-white px-1.5 py-0.5 rounded"
                >
                  Use
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Play button */}
      {!isInBattle && onPlay && (
        <button
          onClick={() => onPlay(card)}
          className="mt-2 bg-yellow-400 hover:bg-yellow-500 text-white text-xs px-3 py-1 rounded-full w-full"
        >
          Play
        </button>
      )}
    </motion.div>
  );
};

export default Card;