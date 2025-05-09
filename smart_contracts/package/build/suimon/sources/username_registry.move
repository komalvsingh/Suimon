// MOVE MODULES

// ==============================================================
// 1. Username Registry Module (Your original code)
// ==============================================================
// username_registry.move
module suimon::username_registry {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::dynamic_object_field as dof;
    use sui::table::{Self, Table};
    use std::string::{Self, String};
    use sui::event;

    // Errors
    const EUsernameAlreadyRegistered: u64 = 0;
    const EUsernameNotFound: u64 = 1;
    const ENotOwner: u64 = 2;
    const EInvalidUsername: u64 = 3;

    // Registry object that stores username -> address mappings
    public struct UsernameRegistry has key {
        id: UID,
        username_to_address: Table<String, address>,
    }

    // Individual username object owned by users
    public struct UsernameHandle has key, store {
        id: UID,
        username: String,
        owner: address,
    }

    // Events
    public struct UsernameRegistered has copy, drop {
        username: String,
        owner: address,
    }

    public struct UsernameUnregistered has copy, drop {
        username: String,
        owner: address,
    }

    // === Init function ===
    fun init(ctx: &mut TxContext) {
        let registry = UsernameRegistry {
            id: object::new(ctx),
            username_to_address: table::new(ctx),
        };
        
        // Share the registry as a shared object
        transfer::share_object(registry);
    }

    // === Public functions ===
    
    // Register a new username
    public entry fun register_username(
        registry: &mut UsernameRegistry,
        username: vector<u8>,
        ctx: &mut TxContext
    ) {
        let username_str = string::utf8(username);
        
        // Check username is valid (basic validation)
        assert!(string::length(&username_str) >= 3, EInvalidUsername);
        
        // Check if username already exists
        assert!(!table::contains(&registry.username_to_address, username_str), EUsernameAlreadyRegistered);
        
        // Store username -> address mapping in registry
        table::add(&mut registry.username_to_address, string::utf8(username), tx_context::sender(ctx));
        
        // Create a handle for the user
        let handle = UsernameHandle {
            id: object::new(ctx),
            username: string::utf8(username),
            owner: tx_context::sender(ctx),
        };
        
        // Transfer handle to user
        transfer::transfer(handle, tx_context::sender(ctx));
        
        // Emit registration event
        event::emit(UsernameRegistered {
            username: string::utf8(username),
            owner: tx_context::sender(ctx),
        });
    }
    
    // Unregister a username
    public entry fun unregister_username(
        registry: &mut UsernameRegistry,
        handle: UsernameHandle,
        ctx: &mut TxContext
    ) {
        // Verify owner
        assert!(handle.owner == tx_context::sender(ctx), ENotOwner);
        
        // Remove from registry
        let username = handle.username;
        table::remove(&mut registry.username_to_address, username);
        
        // Destroy handle
        let UsernameHandle { id, username: _, owner: _ } = handle;
        object::delete(id);
        
        // Emit unregistration event
        event::emit(UsernameUnregistered {
            username,
            owner: tx_context::sender(ctx),
        });
    }
    
    // Lookup an address by username
    public fun lookup_address(registry: &UsernameRegistry, username: String): (bool, address) {
        if (table::contains(&registry.username_to_address, username)) {
            (true, *table::borrow(&registry.username_to_address, username))
        } else {
            (false, @0x0)
        }
    }
    
    // Check if a username is available
    public fun is_username_available(registry: &UsernameRegistry, username: String): bool {
        !table::contains(&registry.username_to_address, username)
    }
    
    // Get username of handle
    public fun get_username(handle: &UsernameHandle): String {
        handle.username
    }
    
    // Get owner of handle
    public fun get_owner(handle: &UsernameHandle): address {
        handle.owner
    }
}

// ==============================================================
// 2. Username Transfer Module (New code)
// ==============================================================
// username_transfer.move
module suimon::username_transfer {
    use sui::coin::{Self, Coin};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::event;
    
    // Import our username registry module
    use suimon::username_registry::{Self, UsernameRegistry};
    
    // Errors
    const EUsernameNotFound: u64 = 0;
    const EInsufficientBalance: u64 = 1;
    
    // Events
    public struct CoinTransferByUsername has copy, drop {
        from_address: address,
        to_username: String,
        to_address: address,
        amount: u64,
    }
    
    /// Transfer coins to a user identified by username
    /// Registry is the shared UsernameRegistry object
    /// Coin<T> is the coin being transferred
    /// username is the recipient's username
    /// amount is the amount to transfer
    public entry fun transfer_coin_by_username<T>(
        registry: &UsernameRegistry,
        coin_in: &mut Coin<T>,
        username: vector<u8>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let username_str = string::utf8(username);
        
        // Look up the recipient's address using username
        let (exists, recipient_address) = username_registry::lookup_address(registry, username_str);
        
        // Make sure the username exists
        assert!(exists, EUsernameNotFound);
        
        // Make sure we have enough balance
        assert!(coin::value(coin_in) >= amount, EInsufficientBalance);
        
        // Split the coin and transfer to recipient
        let recipient_coin = coin::split(coin_in, amount, ctx);
        transfer::public_transfer(recipient_coin, recipient_address);
        
        // Emit transfer event
        event::emit(CoinTransferByUsername {
            from_address: tx_context::sender(ctx),
            to_username: username_str,
            to_address: recipient_address,
            amount,
        });
    }
    
    /// Transfer the entire coin to a user identified by username
    public entry fun transfer_coin_by_username_take_all<T>(
        registry: &UsernameRegistry,
        coin_in: Coin<T>,
        username: vector<u8>,
        ctx: &mut TxContext
    ) {
        let username_str = string::utf8(username);
        
        // Look up the recipient's address using username
        let (exists, recipient_address) = username_registry::lookup_address(registry, username_str);
        
        // Make sure the username exists
        assert!(exists, EUsernameNotFound);
        
        let amount = coin::value(&coin_in);
        
        // Transfer the entire coin to recipient
        transfer::public_transfer(coin_in, recipient_address);
        
        // Emit transfer event
        event::emit(CoinTransferByUsername {
            from_address: tx_context::sender(ctx),
            to_username: username_str,
            to_address: recipient_address,
            amount,
        });
    }
    
    /// Convenience function to check if a username is valid for transfers
    public fun is_valid_transfer_recipient(
        registry: &UsernameRegistry,
        username: vector<u8>
    ): bool {
        let username_str = string::utf8(username);
        let (exists, _) = username_registry::lookup_address(registry, username_str);
        exists
    }
}

// ==============================================================
// 3. Enhanced Username Registry Module (Optional improvements)
// ==============================================================
// enhanced_username_registry.move
module suimon::enhanced_username_registry {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use std::string::{Self, String};
    use sui::event;
    use std::vector;
    // No need for ascii module
    
    // Errors
    const EUsernameAlreadyRegistered: u64 = 0;
    const EUsernameNotFound: u64 = 1;
    const ENotOwner: u64 = 2;
    const EInvalidUsername: u64 = 3;
    const EInvalidCharacters: u64 = 4;
    const EUsernameTooLong: u64 = 5;
    const EAdminOnly: u64 = 6;
    
    // Constants
    const MAX_USERNAME_LENGTH: u64 = 20;
    
    // Registry object that stores username -> address mappings
    public struct UsernameRegistry has key {
        id: UID,
        username_to_address: Table<String, address>,
        admin: address,
        reserved_usernames: vector<String>
    }
    
    // Individual username object owned by users
    public struct UsernameHandle has key, store {
        id: UID,
        username: String,
        owner: address,
        registration_time: u64,
    }
    
    // Events
    public struct UsernameRegistered has copy, drop {
        username: String,
        owner: address,
        timestamp: u64,
    }
    
    public struct UsernameUnregistered has copy, drop {
        username: String,
        owner: address,
    }
    
    // === Init function ===
    fun init(ctx: &mut TxContext) {
        let registry = UsernameRegistry {
            id: object::new(ctx),
            username_to_address: table::new(ctx),
            admin: tx_context::sender(ctx),
            reserved_usernames: vector::empty<String>()
        };
        
        // Share the registry as a shared object
        transfer::share_object(registry);
    }
    
    // === Helper functions ===
    
    // Validate username format
    fun validate_username(username: &String): bool {
        let length = string::length(username);
        
        // Check length constraints
        if (length < 3 || length > MAX_USERNAME_LENGTH) {
            return false
        };
        
        // Convert to bytes for character validation
        let bytes = *string::bytes(username);
        
        // Check characters (allowing only letters, numbers, underscores)
        let mut i = 0;
        while (i < vector::length(&bytes)) {
            let char = *vector::borrow(&bytes, i);
            let is_lowercase = char >= 97 && char <= 122;  // a-z
            let is_uppercase = char >= 65 && char <= 90;   // A-Z
            let is_digit = char >= 48 && char <= 57;       // 0-9
            let is_underscore = char == 95;                // _
            
            if (!(is_lowercase || is_uppercase || is_digit || is_underscore)) {
                return false
            };
            
            i = i + 1;
        };
        
        true
    }
    
    // Check if username is reserved
    fun is_username_reserved(registry: &UsernameRegistry, username: &String): bool {
        let mut i = 0;
        let reserved = &registry.reserved_usernames;
        let size = vector::length(reserved);
        
        while (i < size) {
            if (username == vector::borrow(reserved, i)) {
                return true
            };
            i = i + 1;
        };
        
        false
    }
    
    // === Public functions ===
    
    // Register a new username with enhanced validation
    public entry fun register_username(
        registry: &mut UsernameRegistry,
        username: vector<u8>,
        ctx: &mut TxContext
    ) {
        let username_str = string::utf8(username);
        
        // Enhanced validation
        assert!(validate_username(&username_str), EInvalidCharacters);
        assert!(!is_username_reserved(registry, &username_str), EInvalidUsername);
        
        // Check if username already exists
        assert!(!table::contains(&registry.username_to_address, username_str), EUsernameAlreadyRegistered);
        
        // Store username -> address mapping in registry
        table::add(&mut registry.username_to_address, string::utf8(username), tx_context::sender(ctx));
        
        // Create a handle for the user
        let handle = UsernameHandle {
            id: object::new(ctx),
            username: string::utf8(username),
            owner: tx_context::sender(ctx),
            registration_time: tx_context::epoch(ctx),
        };
        
        // Transfer handle to user
        transfer::transfer(handle, tx_context::sender(ctx));
        
        // Emit registration event
        event::emit(UsernameRegistered {
            username: string::utf8(username),
            owner: tx_context::sender(ctx),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }
    
    // Unregister a username
    public entry fun unregister_username(
        registry: &mut UsernameRegistry,
        handle: UsernameHandle,
        ctx: &mut TxContext
    ) {
        // Verify owner
        assert!(handle.owner == tx_context::sender(ctx), ENotOwner);
        
        // Remove from registry
        let username = handle.username;
        table::remove(&mut registry.username_to_address, username);
        
        // Destroy handle
        let UsernameHandle { id, username: _, owner: _, registration_time: _ } = handle;
        object::delete(id);
        
        // Emit unregistration event
        event::emit(UsernameUnregistered {
            username,
            owner: tx_context::sender(ctx),
        });
    }
    
    // Admin function to reserve usernames
    public entry fun reserve_username(
        registry: &mut UsernameRegistry,
        username: vector<u8>,
        ctx: &mut TxContext
    ) {
        // Only admin can reserve usernames
        assert!(tx_context::sender(ctx) == registry.admin, EAdminOnly);
        
        let username_str = string::utf8(username);
        vector::push_back(&mut registry.reserved_usernames, username_str);
    }
    
    // Lookup an address by username
    public fun lookup_address(registry: &UsernameRegistry, username: String): (bool, address) {
        if (table::contains(&registry.username_to_address, username)) {
            (true, *table::borrow(&registry.username_to_address, username))
        } else {
            (false, @0x0)
        }
    }
    
    // Check if a username is available
    public fun is_username_available(registry: &UsernameRegistry, username: String): bool {
        !table::contains(&registry.username_to_address, username) && 
        !is_username_reserved(registry, &username)
    }
    
    // Get username of handle
    public fun get_username(handle: &UsernameHandle): String {
        handle.username
    }
    
    // Get owner of handle
    public fun get_owner(handle: &UsernameHandle): address {
        handle.owner
    }
    
    // Get registration time of handle
    public fun get_registration_time(handle: &UsernameHandle): u64 {
        handle.registration_time
    }
}