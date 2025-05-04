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