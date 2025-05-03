module suimon::alias {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    struct Alias has key, store {
        id: UID,
        name: vector<u8>,
        owner: address,
    }

    public fun register(name: vector<u8>, ctx: &mut TxContext): Alias {
        Alias {
            id: object::new(ctx),
            name,
            owner: tx_context::sender(ctx),
        }
    }

    public fun send(alias: Alias, recipient: address) {
        transfer::transfer(alias, recipient);
    }

    public fun resolve(alias: &Alias): address {
        alias.owner
    }
}
