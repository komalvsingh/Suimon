module suimon::dao {
    use sui::object::{Self, UID};
    use sui::tx_context::{TxContext, sender};
    use sui::balance::{Self, Balance, zero, join};
    use sui::coin::{Self, Coin};
    use sui::transfer;

    struct MemePool has key {
        id: UID,
        votes: u64,
        meme_url: vector<u8>,
        creator: address,
        fund: Balance<0x2::sui::SUI>,
    }

    public fun create_pool(
        meme_url: vector<u8>,
        ctx: &mut TxContext
    ): MemePool {
        MemePool {
            id: object::new(ctx),
            votes: 0,
            meme_url,
            creator: sender(ctx),
            fund: zero<0x2::sui::SUI>(),
        }
    }

    public fun vote(pool: &mut MemePool) {
        pool.votes = pool.votes + 1;
    }

    public fun donate_to_pool(
        pool: &mut MemePool,
        coin: Coin<0x2::sui::SUI>
    ) {
        let value = coin::value(&coin);
        let coin_balance = coin::into_balance(coin);
        join(&mut pool.fund, coin_balance);
    }

    public fun claim_rewards(pool: &mut MemePool, ctx: &mut TxContext): Coin<0x2::sui::SUI> {
        assert!(sender(ctx) == pool.creator, 1);
        let amount = balance::withdraw_all(&mut pool.fund);
        coin::from_balance(amount, ctx)
    }

    public entry fun create_and_share(meme_url: vector<u8>, ctx: &mut TxContext) {
        let pool = create_pool(meme_url, ctx);
        transfer::share_object(pool);
    }
}