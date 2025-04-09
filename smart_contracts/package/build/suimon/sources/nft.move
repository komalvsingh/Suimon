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
        Creature {
            id: object::new(ctx),
            name,
            image_url,
            level: 1,
            xp: 0,
        }
    }

    public fun send(creature: Creature, recipient: address) {
        transfer::transfer(creature, recipient);
    }
}
