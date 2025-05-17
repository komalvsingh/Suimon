module suimon::battle {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    
    // Battle struct
    struct Battle has key, store {
        id: UID,
        winner: address,
        loser: address,
        xp_reward: u64,
    }
    
    // Create a new battle object
    public fun create_battle(
        winner: address,
        loser: address,
        xp_reward: u64,
        ctx: &mut TxContext
    ): Battle {
        Battle {
            id: object::new(ctx),
            winner,
            loser,
            xp_reward,
        }
    }
    
    // Simple function to get a new UID for any battle-related object
    public fun new_battle_id(ctx: &mut TxContext): UID {
        object::new(ctx)
    }
    
    // Getters
    public fun winner(battle: &Battle): address {
        battle.winner
    }
    
    public fun loser(battle: &Battle): address {
        battle.loser
    }
    
    public fun xp_reward(battle: &Battle): u64 {
        battle.xp_reward
    }
}