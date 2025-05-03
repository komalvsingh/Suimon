# Pokémon Starter NFT Metadata

This directory contains the metadata JSON files for the three starter Pokémon NFTs:

- Bulbasaur (#1)
- Charmander (#4)
- Squirtle (#7)

## Metadata Format

Each JSON file follows the NFT standard format with the following fields:

- `name`: Pokémon name (capitalized)
- `description`: English flavor text from the Pokémon species data
- `image`: URL to the Pokémon's Dream World sprite
- `weight`: Weight in kg
- `height`: Height in meters
- `types`: List of type names
- `abilities`: List of ability names
- `stats`: Object with stat names and their base values
- `external_url`: Link to the Pokémon details page

## IPFS Deployment Instructions

### 1. Upload to IPFS

To use these metadata files for NFTs, you need to upload them to IPFS. You can use services like:

- [Pinata](https://pinata.cloud/)
- [NFT.Storage](https://nft.storage/)
- [Infura IPFS](https://infura.io/product/ipfs)

### 2. Update Smart Contract

After uploading to IPFS, you'll receive Content Identifiers (CIDs) for each file. Update the CID constants in the `starter_nft.move` contract:

```move
// Replace with your actual CIDs
const BULBASAUR_CID: vector<u8> = b"ipfs://YOUR_BULBASAUR_CID_HERE";
const CHARMANDER_CID: vector<u8> = b"ipfs://YOUR_CHARMANDER_CID_HERE";
const SQUIRTLE_CID: vector<u8> = b"ipfs://YOUR_SQUIRTLE_CID_HERE";
```

### 3. Deploy the Contract

Compile and deploy the `starter_nft.move` contract to the Sui blockchain.

### 4. Integrate with Frontend

Update your frontend application to interact with the deployed contract, allowing users to mint their chosen starter Pokémon NFT.