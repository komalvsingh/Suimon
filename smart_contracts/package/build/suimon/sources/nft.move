module suimon::nft {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use sui::transfer;

    struct Creature has key, store {
        id: UID,
        name: vector<u8>,
        image_url: vector<u8>,
        level: u8,
        xp: u64,
    }

    public fun mint(name: vector<u8>, image_url: vector<u8>, ctx: &mut TxContext): Creature {
    let id = object::new(ctx);
    let creature = Creature {
        id,
        name,
        image_url,
        level: 1,
        xp: 0,
    };
    
    // Return the creature so it can be transferred to the user
    creature
}

    public fun send(creature: Creature, recipient: address) {
        transfer::public_transfer(creature, recipient);
    }

    public fun gain_xp(creature: &mut Creature, amount: u64) {
        creature.xp = creature.xp + amount;
        if (creature.xp >= 100) {
            creature.level = creature.level + 1;
            creature.xp = 0;
        }
    }
}