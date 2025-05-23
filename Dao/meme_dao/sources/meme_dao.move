// ==============================================================
// Standalone Multisig Meme Pool DAO Module
// ==============================================================
module suimon::meme_dao {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    use std::vector;
    use sui::dynamic_field as df;

    // Error codes
    const ENotMember: u64 = 0;
    const EAlreadyMember: u64 = 1;
    const EInsufficientBalance: u64 = 2;
    const EProposalNotFound: u64 = 3;
    const EAlreadyVoted: u64 = 4;
    const EProposalExpired: u64 = 5;
    const EProposalNotPassed: u64 = 6;
    const EUnauthorized: u64 = 7;
    const EInvalidThreshold: u64 = 8;
    const EMinimumMembersRequired: u64 = 9;
    const EInvalidAmount: u64 = 10;
    const EUsernameNotFound: u64 = 11;

    // Constants
    const MIN_MEMBERS: u64 = 3;
    const MAX_MEMBERS: u64 = 100;
    const PROPOSAL_DURATION_MS: u64 = 604800000; // 7 days in milliseconds

    // Proposal types
    const PROPOSAL_TYPE_TRANSFER: u8 = 0;
    const PROPOSAL_TYPE_USERNAME_TRANSFER: u8 = 1;
    const PROPOSAL_TYPE_ADD_MEMBER: u8 = 2;
    const PROPOSAL_TYPE_REMOVE_MEMBER: u8 = 3;
    const PROPOSAL_TYPE_UPDATE_THRESHOLD: u8 = 4;
    const PROPOSAL_TYPE_FUND_PROJECT: u8 = 5;

    // Meme DAO structure
    public struct MemeDAO<phantom T> has key {
        id: UID,
        name: String,
        description: String,
        members: vector<address>,
        voting_threshold: u64, // Number of votes needed to pass proposal
        treasury: Balance<T>,
        proposal_count: u64,
        creator: address,
        created_at: u64,
        is_active: bool,
        // Built-in username registry for this DAO
        username_to_address: Table<String, address>,
    }

    // Proposal structure
    public struct Proposal<phantom T> has store {
        id: u64,
        proposal_type: u8,
        title: String,
        description: String,
        proposer: address,
        target_address: address,
        target_username: String,
        amount: u64,
        votes_for: u64,
        votes_against: u64,
        voters: vector<address>,
        created_at: u64,
        expires_at: u64,
        executed: bool,
        new_member_address: address,
        remove_member_address: address,
        new_threshold: u64,
    }

    // Member info - suppress unused field warnings
    #[allow(unused_field)]
    public struct MemberInfo has store {
        address: address,
        username: String,
        joined_at: u64,
        contributions: u64,
        votes_cast: u64,
    }

    // DAO Registry to track all DAOs
    public struct DAORegistry has key {
        id: UID,
        dao_count: u64,
        dao_by_name: Table<String, ID>,
        member_daos: Table<address, vector<ID>>,
    }

    // Username handle for DAO members
    public struct UsernameHandle has key, store {
        id: UID,
        username: String,
        owner: address,
        dao_id: ID,
    }

    // Events
    public struct DAOCreated has copy, drop {
        dao_id: ID,
        name: String,
        creator: address,
        initial_members: vector<address>,
        threshold: u64,
    }

    public struct MemberAdded has copy, drop {
        dao_id: ID,
        member: address,
        added_by: address,
    }

    // Suppress unused field warnings for MemberRemoved
    #[allow(unused_field)]
    public struct MemberRemoved has copy, drop {
        dao_id: ID,
        member: address,
        removed_by: address,
    }

    public struct ProposalCreated has copy, drop {
        dao_id: ID,
        proposal_id: u64,
        proposal_type: u8,
        title: String,
        proposer: address,
        amount: u64,
    }

    public struct ProposalVoted has copy, drop {
        dao_id: ID,
        proposal_id: u64,
        voter: address,
        vote_for: bool,
    }

    public struct ProposalExecuted has copy, drop {
        dao_id: ID,
        proposal_id: u64,
        executor: address,
        success: bool,
    }

    public struct FundsDeposited has copy, drop {
        dao_id: ID,
        depositor: address,
        amount: u64,
    }

    public struct CreatorTipped has copy, drop {
        dao_id: ID,
        recipient: address,
        amount: u64,
        tipper: address,
    }

    public struct UsernameRegistered has copy, drop {
        dao_id: ID,
        username: String,
        owner: address,
    }

    // Initialize registry
    fun init(ctx: &mut TxContext) {
        let registry = DAORegistry {
            id: object::new(ctx),
            dao_count: 0,
            dao_by_name: table::new(ctx),
            member_daos: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    // Create a new Meme DAO
    public entry fun create_dao<T>(
        registry: &mut DAORegistry,
        name: vector<u8>,
        description: vector<u8>,
        mut initial_members: vector<address>, // Made mutable
        voting_threshold: u64,
        initial_funds: Coin<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let name_str = string::utf8(name);
        let description_str = string::utf8(description);
        let creator = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);

        // Validate inputs
        assert!(vector::length(&initial_members) >= MIN_MEMBERS, EMinimumMembersRequired);
        assert!(vector::length(&initial_members) <= MAX_MEMBERS, EMinimumMembersRequired);
        assert!(voting_threshold > 0 && voting_threshold <= vector::length(&initial_members), EInvalidThreshold);
        assert!(!table::contains(&registry.dao_by_name, name_str), EAlreadyMember);

        // Add creator to members if not already included
        if (!vector::contains(&initial_members, &creator)) {
            vector::push_back(&mut initial_members, creator);
        };

        let dao_id = object::new(ctx);
        let dao_obj_id = object::uid_to_inner(&dao_id);

        // Create DAO with built-in username registry
        let dao = MemeDAO<T> {
            id: dao_id,
            name: name_str,
            description: description_str,
            members: initial_members,
            voting_threshold,
            treasury: coin::into_balance(initial_funds),
            proposal_count: 0,
            creator,
            created_at: current_time,
            is_active: true,
            username_to_address: table::new(ctx),
        };

        // Update registry
        table::add(&mut registry.dao_by_name, name_str, dao_obj_id);
        registry.dao_count = registry.dao_count + 1;

        // Track member DAOs
        let mut i = 0;
        while (i < vector::length(&dao.members)) {
            let member = *vector::borrow(&dao.members, i);
            if (!table::contains(&registry.member_daos, member)) {
                table::add(&mut registry.member_daos, member, vector::empty<ID>());
            };
            let member_daos = table::borrow_mut(&mut registry.member_daos, member);
            vector::push_back(member_daos, dao_obj_id);
            i = i + 1;
        };

        // Emit event
        event::emit(DAOCreated {
            dao_id: dao_obj_id,
            name: name_str,
            creator,
            initial_members: dao.members,
            threshold: voting_threshold,
        });

        // Share DAO object
        transfer::share_object(dao);
    }

    // Register a username within a DAO
    public entry fun register_username_in_dao<T>(
        dao: &mut MemeDAO<T>,
        username: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(vector::contains(&dao.members, &sender), ENotMember);
        
        let username_str = string::utf8(username);
        assert!(!table::contains(&dao.username_to_address, username_str), EAlreadyMember);
        
        // Add username mapping
        table::add(&mut dao.username_to_address, username_str, sender);
        
        // Create handle for user
        let handle = UsernameHandle {
            id: object::new(ctx),
            username: username_str,
            owner: sender,
            dao_id: object::uid_to_inner(&dao.id),
        };
        
        transfer::transfer(handle, sender);
        
        event::emit(UsernameRegistered {
            dao_id: object::uid_to_inner(&dao.id),
            username: username_str,
            owner: sender,
        });
    }

    // Lookup address by username within a DAO
    public fun lookup_username_in_dao<T>(dao: &MemeDAO<T>, username: String): (bool, address) {
        if (table::contains(&dao.username_to_address, username)) {
            (true, *table::borrow(&dao.username_to_address, username))
        } else {
            (false, @0x0)
        }
    }

    // Deposit funds to DAO treasury
    public entry fun deposit_funds<T>(
        dao: &mut MemeDAO<T>,
        funds: Coin<T>,
        ctx: &mut TxContext
    ) {
        let depositor = tx_context::sender(ctx);
        let amount = coin::value(&funds);
        
        assert!(vector::contains(&dao.members, &depositor), ENotMember);
        assert!(amount > 0, EInvalidAmount);

        balance::join(&mut dao.treasury, coin::into_balance(funds));

        event::emit(FundsDeposited {
            dao_id: object::uid_to_inner(&dao.id),
            depositor,
            amount,
        });
    }

    // Create a transfer proposal
    public entry fun create_transfer_proposal<T>(
        dao: &mut MemeDAO<T>,
        title: vector<u8>,
        description: vector<u8>,
        target_address: address,
        amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let proposer = tx_context::sender(ctx);
        assert!(vector::contains(&dao.members, &proposer), ENotMember);
        assert!(balance::value(&dao.treasury) >= amount, EInsufficientBalance);

        create_proposal_internal(
            dao,
            PROPOSAL_TYPE_TRANSFER,
            title,
            description,
            target_address,
            string::utf8(b""),
            amount,
            @0x0,
            @0x0,
            0,
            clock,
            ctx
        );
    }

    // Create a username transfer proposal
    public entry fun create_username_transfer_proposal<T>(
        dao: &mut MemeDAO<T>,
        title: vector<u8>,
        description: vector<u8>,
        target_username: vector<u8>,
        amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let proposer = tx_context::sender(ctx);
        assert!(vector::contains(&dao.members, &proposer), ENotMember);
        assert!(balance::value(&dao.treasury) >= amount, EInsufficientBalance);

        // Verify username exists in this DAO
        let username_str = string::utf8(target_username);
        let (exists, _) = lookup_username_in_dao(dao, username_str);
        assert!(exists, EUsernameNotFound);

        create_proposal_internal(
            dao,
            PROPOSAL_TYPE_USERNAME_TRANSFER,
            title,
            description,
            @0x0,
            username_str,
            amount,
            @0x0,
            @0x0,
            0,
            clock,
            ctx
        );
    }

    // Create a member addition proposal
    public entry fun create_add_member_proposal<T>(
        dao: &mut MemeDAO<T>,
        title: vector<u8>,
        description: vector<u8>,
        new_member: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let proposer = tx_context::sender(ctx);
        assert!(vector::contains(&dao.members, &proposer), ENotMember);
        assert!(!vector::contains(&dao.members, &new_member), EAlreadyMember);

        create_proposal_internal(
            dao,
            PROPOSAL_TYPE_ADD_MEMBER,
            title,
            description,
            @0x0,
            string::utf8(b""),
            0,
            new_member,
            @0x0,
            0,
            clock,
            ctx
        );
    }

    // Internal function to create proposals
    fun create_proposal_internal<T>(
        dao: &mut MemeDAO<T>,
        proposal_type: u8,
        title: vector<u8>,
        description: vector<u8>,
        target_address: address,
        target_username: String,
        amount: u64,
        new_member_address: address,
        remove_member_address: address,
        new_threshold: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let proposer = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);
        let proposal_id = dao.proposal_count;
        
        dao.proposal_count = dao.proposal_count + 1;

        let proposal = Proposal<T> {
            id: proposal_id,
            proposal_type,
            title: string::utf8(title),
            description: string::utf8(description),
            proposer,
            target_address,
            target_username,
            amount,
            votes_for: 0,
            votes_against: 0,
            voters: vector::empty<address>(),
            created_at: current_time,
            expires_at: current_time + PROPOSAL_DURATION_MS,
            executed: false,
            new_member_address,
            remove_member_address,
            new_threshold,
        };

        // Store proposal in DAO
        df::add(&mut dao.id, proposal_id, proposal);

        event::emit(ProposalCreated {
            dao_id: object::uid_to_inner(&dao.id),
            proposal_id,
            proposal_type,
            title: string::utf8(title),
            proposer,
            amount,
        });
    }

    // Vote on a proposal
    public entry fun vote_proposal<T>(
        dao: &mut MemeDAO<T>,
        proposal_id: u64,
        vote_for: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let voter = tx_context::sender(ctx);
        assert!(vector::contains(&dao.members, &voter), ENotMember);
        assert!(df::exists_(&dao.id, proposal_id), EProposalNotFound);

        let proposal = df::borrow_mut<u64, Proposal<T>>(&mut dao.id, proposal_id);
        let current_time = clock::timestamp_ms(clock);
        
        assert!(current_time < proposal.expires_at, EProposalExpired);
        assert!(!vector::contains(&proposal.voters, &voter), EAlreadyVoted);

        // Record vote
        vector::push_back(&mut proposal.voters, voter);
        if (vote_for) {
            proposal.votes_for = proposal.votes_for + 1;
        } else {
            proposal.votes_against = proposal.votes_against + 1;
        };

        event::emit(ProposalVoted {
            dao_id: object::uid_to_inner(&dao.id),
            proposal_id,
            voter,
            vote_for,
        });
    }

    // Execute a passed proposal
    public entry fun execute_proposal<T>(
        dao: &mut MemeDAO<T>,
        registry: &mut DAORegistry,
        proposal_id: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let executor = tx_context::sender(ctx);
        assert!(vector::contains(&dao.members, &executor), ENotMember);
        assert!(df::exists_(&dao.id, proposal_id), EProposalNotFound);

        // Get proposal info first to avoid borrowing conflicts
        let (proposal_type, target_username, amount, new_member_address, target_address) = {
            let proposal = df::borrow<u64, Proposal<T>>(&dao.id, proposal_id);
            let current_time = clock::timestamp_ms(clock);
            
            assert!(current_time < proposal.expires_at, EProposalExpired);
            assert!(!proposal.executed, EProposalNotFound);
            assert!(proposal.votes_for >= dao.voting_threshold, EProposalNotPassed);
            
            (proposal.proposal_type, proposal.target_username, proposal.amount, 
             proposal.new_member_address, proposal.target_address)
        };

        // Mark proposal as executed
        let proposal = df::borrow_mut<u64, Proposal<T>>(&mut dao.id, proposal_id);
        proposal.executed = true;
        let success = true;

        // Execute based on proposal type (after releasing the borrow)
        if (proposal_type == PROPOSAL_TYPE_TRANSFER) {
            // Transfer funds to target address
            let payment = coin::take(&mut dao.treasury, amount, ctx);
            transfer::public_transfer(payment, target_address);
        } else if (proposal_type == PROPOSAL_TYPE_USERNAME_TRANSFER) {
            // Transfer funds to username
            let (exists, resolved_address) = lookup_username_in_dao(dao, target_username);
            if (exists) {
                let payment = coin::take(&mut dao.treasury, amount, ctx);
                transfer::public_transfer(payment, resolved_address);
            };
        } else if (proposal_type == PROPOSAL_TYPE_ADD_MEMBER) {
            // Add new member
            vector::push_back(&mut dao.members, new_member_address);
            
            // Update registry
            if (!table::contains(&registry.member_daos, new_member_address)) {
                table::add(&mut registry.member_daos, new_member_address, vector::empty<ID>());
            };
            let member_daos = table::borrow_mut(&mut registry.member_daos, new_member_address);
            vector::push_back(member_daos, object::uid_to_inner(&dao.id));

            event::emit(MemberAdded {
                dao_id: object::uid_to_inner(&dao.id),
                member: new_member_address,
                added_by: executor,
            });
        };

        event::emit(ProposalExecuted {
            dao_id: object::uid_to_inner(&dao.id),
            proposal_id,
            executor,
            success,
        });
    }

    // Quick tip function for creators
    public entry fun tip_creator<T>(
        dao: &mut MemeDAO<T>,
        recipient: address,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let tipper = tx_context::sender(ctx);
        assert!(vector::contains(&dao.members, &tipper), ENotMember);
        assert!(balance::value(&dao.treasury) >= amount, EInsufficientBalance);

        // For small tips, allow immediate transfer without proposal
        // This is for amounts less than 1% of treasury
        let treasury_value = balance::value(&dao.treasury);
        let max_tip = treasury_value / 100;
        assert!(amount <= max_tip, EInvalidAmount);

        let payment = coin::take(&mut dao.treasury, amount, ctx);
        transfer::public_transfer(payment, recipient);

        event::emit(CreatorTipped {
            dao_id: object::uid_to_inner(&dao.id),
            recipient,
            amount,
            tipper,
        });
    }

    // Tip creator by username within DAO
    public entry fun tip_creator_by_username<T>(
        dao: &mut MemeDAO<T>,
        username: vector<u8>,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let username_str = string::utf8(username);
        let (exists, recipient) = lookup_username_in_dao(dao, username_str);
        assert!(exists, EUsernameNotFound);

        tip_creator(dao, recipient, amount, ctx);
    }

    // View functions
    public fun get_dao_info<T>(dao: &MemeDAO<T>): (String, String, vector<address>, u64, u64, bool) {
        (dao.name, dao.description, dao.members, dao.voting_threshold, balance::value(&dao.treasury), dao.is_active)
    }

    public fun get_proposal_info<T>(dao: &MemeDAO<T>, proposal_id: u64): (u8, String, String, address, u64, u64, u64, bool, bool) {
        assert!(df::exists_(&dao.id, proposal_id), EProposalNotFound);
        let proposal = df::borrow<u64, Proposal<T>>(&dao.id, proposal_id);
        (
            proposal.proposal_type,
            proposal.title,
            proposal.description,
            proposal.proposer,
            proposal.amount,
            proposal.votes_for,
            proposal.votes_against,
            proposal.executed,
            proposal.votes_for >= dao.voting_threshold
        )
    }

    public fun is_member<T>(dao: &MemeDAO<T>, member: address): bool {
        vector::contains(&dao.members, &member)
    }

    public fun get_treasury_balance<T>(dao: &MemeDAO<T>): u64 {
        balance::value(&dao.treasury)
    }

    public fun get_member_count<T>(dao: &MemeDAO<T>): u64 {
        vector::length(&dao.members)
    }

    public fun is_username_available<T>(dao: &MemeDAO<T>, username: String): bool {
        !table::contains(&dao.username_to_address, username)
    }

    public fun get_username_owner<T>(dao: &MemeDAO<T>, username: String): address {
        assert!(table::contains(&dao.username_to_address, username), EUsernameNotFound);
        *table::borrow(&dao.username_to_address, username)
    }
}