module suimon::creature {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    
    // Creature struct definition
    struct Creature has key, store {
        id: UID,
        name: vector<u8>,
        xp: u64,
        level: u64,
    }
    
    // Create a new creature
    public fun create_creature(
        name: vector<u8>,
        ctx: &mut TxContext
    ): Creature {
        Creature {
            id: object::new(ctx),
            name,
            xp: 0,
            level: 1,
        }
    }
    
    // Award XP to a creature
    public fun gain_xp(creature: &mut Creature, amount: u64) {
        creature.xp = creature.xp + amount;
        
        // Level up logic - very simple for demonstration
        // Every 100 XP is a level
        creature.level = creature.xp / 100 + 1;
    }
    
    // Getters
    public fun name(creature: &Creature): vector<u8> {
        creature.name
    }
    
    public fun xp(creature: &Creature): u64 {
        creature.xp
    }
    
    public fun level(creature: &Creature): u64 {
        creature.level
    }
}