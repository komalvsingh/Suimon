module suimon::starter_nft {
    use sui::url::{Self, Url};
    use sui::object::{Self, UID, ID};
    use sui::event;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use std::vector;
    use sui::package;
    use sui::display;

    // Error codes
    const EAlreadyMinted: u64 = 0;
    const EInvalidStarterChoice: u64 = 1;
    const EInvalidEvolution: u64 = 2;

    // Starter Pokemon IDs
    const BULBASAUR_ID: u8 = 1;
    const CHARMANDER_ID: u8 = 4;
    const SQUIRTLE_ID: u8 = 7;

    // Evolution Pokemon IDs
    const IVYSAUR_ID: u8 = 2;
    const VENUSAUR_ID: u8 = 3;
    const CHARMELEON_ID: u8 = 5;
    const CHARIZARD_ID: u8 = 6;
    const WARTORTLE_ID: u8 = 8;
    const BLASTOISE_ID: u8 = 9;

    // Experience thresholds for evolution
    const FIRST_EVOLUTION_THRESHOLD: u64 = 100;
    const SECOND_EVOLUTION_THRESHOLD: u64 = 300;

    // One-time witness for the package
    public struct STARTER_NFT has drop {}  // Added 'public' visibility

    // StarterNFT represents a Pokemon starter NFT
    public struct StarterNFT has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: Url,
        pokemon_id: u8,
        token_uri: Url,
        experience: u64,
        evolution_stage: u8,
    }

    // Capability that represents the authority to mint StarterNFTs
    public struct MinterCap has key { id: UID }

    // Tracks which addresses have already minted a starter
    public struct MintedRecord has key {
        id: UID,
        minted_addresses: vector<address>
    }

    // Events
    public struct StarterNFTMinted has copy, drop {
        pokemon_id: u8,
        name: String,
        minter: address,
        object_id: ID 
    }

    public struct ExperienceGained has copy, drop {
        pokemon_id: u8,
        name: String,
        owner: address,
        experience_gained: u64,
        total_experience: u64
    }

    public struct PokemonEvolved has copy, drop {
        old_pokemon_id: u8,
        new_pokemon_id: u8,
        old_name: String,
        new_name: String,
        owner: address,
        evolution_stage: u8
    }

    // Initialize the module
    fun init(witness: STARTER_NFT, ctx: &mut TxContext) {
        // Create and transfer the minter capability to the deployer
        transfer::transfer(
            MinterCap { id: object::new(ctx) },
            tx_context::sender(ctx)
        );

        // Create and share the minted record
        transfer::share_object(
            MintedRecord {
                id: object::new(ctx),
                minted_addresses: vector::empty<address>()
            }
        );
        
        // Register Display schema for better wallet compatibility
        let publisher = package::claim(witness, ctx);
        
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
            string::utf8(b"project_url"),
            string::utf8(b"creator")
        ];
        
        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"{description}"),
            string::utf8(b"{image_url}"),
            string::utf8(b"https://suimon.app"),
            string::utf8(b"Suimon")
        ];
        
        let mut display_schema = display::new_with_fields<StarterNFT>(  // Changed to 'mut'
            &publisher, keys, values, ctx
        );
        
        display::update_version(&mut display_schema);
        
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display_schema, tx_context::sender(ctx));
    }

    // Mint a starter Pokemon NFT
    public entry fun mint_starter(
        record: &mut MintedRecord,
        starter_choice: u8,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Check if the user has already minted a starter
        let mut i = 0;  // Changed to 'mut'
        let len = vector::length(&record.minted_addresses);
        while (i < len) {
            if (*vector::borrow(&record.minted_addresses, i) == sender) {
                abort EAlreadyMinted
            };
            i = i + 1;
        };

        // Add the user to the minted addresses
        vector::push_back(&mut record.minted_addresses, sender);

        // Mint the chosen starter
        if (starter_choice == BULBASAUR_ID) {
            mint_bulbasaur(sender, ctx);
        } else if (starter_choice == CHARMANDER_ID) {
            mint_charmander(sender, ctx);
        } else if (starter_choice == SQUIRTLE_ID) {
            mint_squirtle(sender, ctx);
        } else {
            abort EInvalidStarterChoice
        };
    }

    // Mint a Bulbasaur NFT
    fun mint_bulbasaur(recipient: address, ctx: &mut TxContext) {
        let nft_id = object::new(ctx);
        let nft_obj_id = object::uid_to_inner(&nft_id);
        
        let nft = StarterNFT {
            id: nft_id,
            name: string::utf8(b"Bulbasaur"),
            description: string::utf8(b"A strange seed was planted on its back at birth. The plant sprouts and grows with this Pokemon."),
            image_url: url::new_unsafe_from_bytes(b"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/1.svg"),
            pokemon_id: BULBASAUR_ID,
            token_uri: url::new_unsafe_from_bytes(b"ipfs://bafkreicz5hnnlwvzztfsr257mc5vy2sitrwufr6bipmf7vwc56guxkn3sa"),
            experience: 0,
            evolution_stage: 0,
        };

        event::emit(StarterNFTMinted {
            pokemon_id: BULBASAUR_ID,
            name: string::utf8(b"Bulbasaur"),
            minter: recipient,
            object_id: nft_obj_id
        });

        transfer::transfer(nft, recipient);
    }

    // Mint a Charmander NFT
    fun mint_charmander(recipient: address, ctx: &mut TxContext) {
        let nft_id = object::new(ctx);
        let nft_obj_id = object::uid_to_inner(&nft_id);
        
        let nft = StarterNFT {
            id: nft_id,
            name: string::utf8(b"Charmander"),
            description: string::utf8(b"Obviously prefers hot places. If it gets caught in the rain, steam is said to spout from the tip of its tail."),
            image_url: url::new_unsafe_from_bytes(b"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/4.svg"),
            pokemon_id: CHARMANDER_ID,
            token_uri: url::new_unsafe_from_bytes(b"ipfs://bafkreia5xsjwag54q5ck6vfmmtqg2fz2ohtap4y32ciucbd5ctvb6awwu4"),
            experience: 0,
            evolution_stage: 0,
        };

        event::emit(StarterNFTMinted {
            pokemon_id: CHARMANDER_ID,
            name: string::utf8(b"Charmander"),
            minter: recipient,
            object_id: nft_obj_id
        });

        transfer::transfer(nft, recipient);
    }

    // Mint a Squirtle NFT
    fun mint_squirtle(recipient: address, ctx: &mut TxContext) {
        let nft_id = object::new(ctx);
        let nft_obj_id = object::uid_to_inner(&nft_id);
        
        let nft = StarterNFT {
            id: nft_id,
            name: string::utf8(b"Squirtle"),
            description: string::utf8(b"After birth, its back swells and hardens into a shell. It powerfully sprays foam from its mouth."),
            image_url: url::new_unsafe_from_bytes(b"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/7.svg"),
            pokemon_id: SQUIRTLE_ID,
            token_uri: url::new_unsafe_from_bytes(b"ipfs://bafkreieo7na3patidayis4ndm665b3binl3aoexw63kvkwtcptjjntky3i"),
            experience: 0,
            evolution_stage: 0,
        };

        event::emit(StarterNFTMinted {
            pokemon_id: SQUIRTLE_ID,
            name: string::utf8(b"Squirtle"),
            minter: recipient,
            object_id: nft_obj_id
        });

        transfer::transfer(nft, recipient);
    }

    // Get the Pokemon ID of a StarterNFT
    public fun get_pokemon_id(nft: &StarterNFT): u8 {
        nft.pokemon_id
    }

    // Get the name of a StarterNFT
    public fun get_name(nft: &StarterNFT): &String {
        &nft.name
    }

    // Get the description of a StarterNFT
    public fun get_description(nft: &StarterNFT): &String {
        &nft.description
    }

    // Get the image URL of a StarterNFT
    public fun get_image_url(nft: &StarterNFT): &Url {
        &nft.image_url
    }

    // Get the token URI of a StarterNFT
    public fun get_token_uri(nft: &StarterNFT): &Url {
        &nft.token_uri
    }

    // Get the experience of a StarterNFT
    public fun get_experience(nft: &StarterNFT): u64 {
        nft.experience
    }

    // Get the evolution stage of a StarterNFT
    public fun get_evolution_stage(nft: &StarterNFT): u8 {
        nft.evolution_stage
    }

    // Gain experience and potentially evolve
    public entry fun gain_experience(nft: &mut StarterNFT, exp_amount: u64, ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        let _old_exp = nft.experience;  // Added underscore prefix
        let old_stage = nft.evolution_stage;
        let old_pokemon_id = nft.pokemon_id;
        let old_name = nft.name;
        
        // Add experience
        nft.experience = nft.experience + exp_amount;
        
        // Emit experience gained event
        event::emit(ExperienceGained {
            pokemon_id: nft.pokemon_id,
            name: nft.name,
            owner: sender,
            experience_gained: exp_amount,
            total_experience: nft.experience
        });
        
        // Check for evolution
        if (old_stage == 0 && nft.experience >= FIRST_EVOLUTION_THRESHOLD) {
            // First evolution
            evolve_pokemon(nft, 1);
        } else if (old_stage == 1 && nft.experience >= SECOND_EVOLUTION_THRESHOLD) {
            // Second evolution
            evolve_pokemon(nft, 2);
        };
        
        // If Pokemon evolved, emit evolution event
        if (nft.evolution_stage > old_stage) {
            event::emit(PokemonEvolved {
                old_pokemon_id,
                new_pokemon_id: nft.pokemon_id,
                old_name,
                new_name: nft.name,
                owner: sender,
                evolution_stage: nft.evolution_stage
            });
        };
    }

    // Helper function to evolve a Pokemon
    fun evolve_pokemon(nft: &mut StarterNFT, new_stage: u8) {
        // Set the evolution stage
        nft.evolution_stage = new_stage;
        
        // Update Pokemon based on its ID and new stage
        if (nft.pokemon_id == BULBASAUR_ID && new_stage == 1) {
            // Evolve Bulbasaur to Ivysaur
            nft.name = string::utf8(b"Ivysaur");
            nft.description = string::utf8(b"When the bulb on its back grows large, it appears to lose the ability to stand on its hind legs.");
            nft.image_url = url::new_unsafe_from_bytes(b"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/2.svg");
            nft.pokemon_id = IVYSAUR_ID;
            nft.token_uri = url::new_unsafe_from_bytes(b"ipfs://bafkreifxd3qxqagt3rf5p2rl4ebwezla64ptlvnihv445rxjelqh2i3ne4");
        } else if (nft.pokemon_id == IVYSAUR_ID && new_stage == 2) {
            // Evolve Ivysaur to Venusaur
            nft.name = string::utf8(b"Venusaur");
            nft.description = string::utf8(b"The plant blooms when it is absorbing solar energy. It stays on the move to seek sunlight.");
            nft.image_url = url::new_unsafe_from_bytes(b"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/3.svg");
            nft.pokemon_id = VENUSAUR_ID;
            nft.token_uri = url::new_unsafe_from_bytes(b"ipfs://bafkreif534zlngrvv2dj44tpj6eo7fqwzxv46um5id4lq2du6flvn3ktga");
        } else if (nft.pokemon_id == CHARMANDER_ID && new_stage == 1) {
            // Evolve Charmander to Charmeleon
            nft.name = string::utf8(b"Charmeleon");
            nft.description = string::utf8(b"When it swings its burning tail, it elevates the temperature to unbearably high levels.");
            nft.image_url = url::new_unsafe_from_bytes(b"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/5.svg");
            nft.pokemon_id = CHARMELEON_ID;
            nft.token_uri = url::new_unsafe_from_bytes(b"ipfs://bafkreihcxxmjqoldby6zybsupi2ba3z4ctpy5a2wmyjnipfam3ph2hmmfi");
        } else if (nft.pokemon_id == CHARMELEON_ID && new_stage == 2) {
            // Evolve Charmeleon to Charizard
            nft.name = string::utf8(b"Charizard");
            nft.description = string::utf8(b"It spits fire that is hot enough to melt boulders. It may cause forest fires by blowing flames.");
            nft.image_url = url::new_unsafe_from_bytes(b"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/6.svg");
            nft.pokemon_id = CHARIZARD_ID;
            nft.token_uri = url::new_unsafe_from_bytes(b"ipfs://bafkreie4h2vmdxyypdaibpr4uucd554aivag4jbizmqv7r77oqxlfzkoha");
        } else if (nft.pokemon_id == SQUIRTLE_ID && new_stage == 1) {
            // Evolve Squirtle to Wartortle
            nft.name = string::utf8(b"Wartortle");
            nft.description = string::utf8(b"It is recognized as a symbol of longevity. If its shell has algae on it, that Wartortle is very old.");
            nft.image_url = url::new_unsafe_from_bytes(b"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/8.svg");
            nft.pokemon_id = WARTORTLE_ID;
            nft.token_uri = url::new_unsafe_from_bytes(b"ipfs://bafkreihebgqi2emklknoldhebokigppmrao24ajwfmpp45autenhel43wi");
        } else if (nft.pokemon_id == WARTORTLE_ID && new_stage == 2) {
            // Evolve Wartortle to Blastoise
            nft.name = string::utf8(b"Blastoise");
            nft.description = string::utf8(b"It crushes its foe under its heavy body to cause fainting. In a pinch, it will withdraw inside its shell.");
            nft.image_url = url::new_unsafe_from_bytes(b"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/9.svg");
            nft.pokemon_id = BLASTOISE_ID;
            nft.token_uri = url::new_unsafe_from_bytes(b"ipfs://bafkreigcyvwabmtoibojbtsdjxbgfu74upva7gifbqnbawfrd45zh2ubqu");
        } else {
            // Invalid evolution path
            abort EInvalidEvolution
        };
    }
}