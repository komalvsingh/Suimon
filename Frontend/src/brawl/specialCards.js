// Special effect cards for the Pokemon RPG battle game

export const specialCards = [
  {
    name: 'Charge',
    description: 'Adds 50 damage to next attack',
    immediateEffect: false
  },
  {
    name: 'Mega Charge',
    description: 'Adds 100 damage to next attack',
    immediateEffect: false
  },
  {
    name: 'Ultra Charge',
    description: 'Adds 150 damage to next attack',
    immediateEffect: false
  },
  {
    name: 'Focus Energy',
    description: 'Boosts all attacks by 50% for 3 turns',
    immediateEffect: true
  },
  {
    name: 'All-Out Attack',
    description: 'Adds 200 to next attack, but take +25% damage next turn',
    immediateEffect: false
  },
  {
    name: 'Detect',
    description: 'Nullifies all damage in next opponent turn',
    immediateEffect: true
  },
  {
    name: 'Recover',
    description: 'Restore 25% of current HP',
    immediateEffect: true
  },
  {
    name: 'Full Restore',
    description: 'Restore 50% of current HP',
    immediateEffect: true
  },
  {
    name: 'Double Shock',
    description: 'Doubles next attack\'s damage',
    immediateEffect: false
  },
  {
    name: 'Focus Band',
    description: 'Removes all cooldowns from your attacks',
    immediateEffect: true
  },
  {
    name: 'Scary Face',
    description: 'Reduces opponent\'s next attack damage by 150',
    immediateEffect: true
  },
  {
    name: 'Light Screen',
    description: 'Reduces all damage taken next turn by 25%',
    immediateEffect: true
  }
];