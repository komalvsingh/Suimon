# Pokémon RPG Battle Game

A turn-based RPG-style Pokémon battle game where you play as Pikachu and battle against iconic Pokémon opponents in a progressive battle system. The game features card mechanics for special effects, buffs, and healing, with each encounter becoming progressively tougher.

## Features

### Turn-Based Combat
- Players and opponents alternate turns
- Each turn allows one of the following actions:
  - Attack (standard or special)
  - Defend (reduces incoming damage by 50%)
  - Use one of three randomly generated special effect cards

### Battle UI Design
- Left Side: Pikachu (Player Character)
- Right Side: Enemy Pokémon (Squirtle, Onix, etc.)
- Top Area: Pokémon avatars and health bars
- Bottom Area: Attack/Defend buttons and three card slots

### Player Pokémon – Pikachu
- Type: Electric
- Initial Health: 2000 HP
- Attacks:
  - Thunder Shock: 350 damage, no cooldown
  - Electro Ball: 450 damage, 1 turn cooldown
  - Volt Tackle: 600 damage, 2 turn cooldown (unlocks after defeating Lucario)
  - Gigavolt Havoc: 700 damage, 3 turn cooldown (unlocks after defeating Garchomp)

### Enemy Pokémon Lineup
1. **Squirtle (Water)** - Level 1
   - Health: 2000
   - Attacks: Water Gun (350 damage), Aqua Tail (450 damage, 1-turn cooldown)

2. **Onix (Rock/Ground)** - Level 2
   - Health: 2200
   - Attacks: Rock Throw (350 damage), Iron Tail (450 damage, 1-turn cooldown)

3. **Pidgeot (Flying)** - Level 3
   - Health: 2400
   - Attacks: Gust (350 damage), Air Slash (450 damage, 1-turn cooldown)

4. **Lucario (Fighting/Steel)** - Level 4
   - Health: 2650
   - Attacks: Force Palm (350 damage), Aura Sphere (450 damage, 1-turn cooldown)

5. **Garchomp (Dragon/Ground)** - Level 5
   - Health: 3000
   - Attacks: Dragon Claw (350 damage), Earthquake (450 damage, 1-turn cooldown), Dragon Rush (600 damage, 2-turn cooldown), Giga Impact (700 damage, 3-turn cooldown)

### Special Effect Cards
Randomly assigned each turn, offering buffs, healing, or damage boosts:
- Charge: Adds 50 damage to next attack
- Mega Charge: Adds 100 damage to next attack
- Ultra Charge: Adds 150 damage to next attack
- Focus Energy: Boosts all attacks by 50% for 3 turns
- All-Out Attack: Adds 200 to next attack, but take +25% damage next turn
- Detect: Nullifies all damage in next opponent turn
- Recover: Restore 25% of current HP
- Full Restore: Restore 50% of current HP
- Double Shock: Doubles next attack's damage
- Focus Band: Removes all cooldowns from your attacks
- Scary Face: Reduces opponent's next attack damage by 150
- Light Screen: Reduces all damage taken next turn by 25%

### Progression System
- After defeating Lucario, unlock Volt Tackle
- After defeating Garchomp, unlock Gigavolt Havoc
- After every battle won, Pikachu's max HP increases by 250

## How to Use

### Integration

To add the Pokémon battle game to your application, import the `PokemonBattle` component:

```jsx
import { PokemonBattle } from './brawl';

function YourComponent() {
  return (
    <div>
      <h1>Your App</h1>
      <PokemonBattle />
    </div>
  );
}
```

Alternatively, you can use the demo component which includes instructions:

```jsx
import PokemonBattleDemo from './brawl/PokemonBattleDemo';

function YourComponent() {
  return <PokemonBattleDemo />;
}
```

### Customization

You can customize the game by modifying the following files:

- `pokemonData.js`: Change enemy Pokémon stats, attacks, and properties
- `specialCards.js`: Modify card effects or add new cards
- `PokemonBattle.css`: Customize the visual appearance of the game

## Technical Notes

- The game uses React hooks for state management
- Pokémon data can be fetched from the PokéAPI (https://pokeapi.co/)
- The battle system uses a turn-based state machine
- Responsive design works on both desktop and mobile devices

## Future Enhancements

- Add more Pokémon to the player's roster
- Implement type effectiveness (e.g., Electric is strong against Water)
- Add animations for attacks and effects
- Implement a save/load system for game progress
- Add sound effects and background music