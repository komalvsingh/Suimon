# Pokémon Starter NFT Deployment Guide

This guide walks you through the process of deploying the Pokémon Starter NFT collection on the Sui blockchain.

## Prerequisites

- Sui CLI installed and configured
- A Sui wallet with sufficient SUI tokens for deployment
- IPFS account (Pinata, NFT.Storage, or Infura)

## Step 1: Upload Metadata to IPFS

1. Navigate to the metadata directory:
   ```
   cd Frontend/src/assets/metadata
   ```

2. Upload each JSON file to your preferred IPFS service:
   - bulbasaur.json
   - charmander.json
   - squirtle.json

3. After uploading, you'll receive a Content Identifier (CID) for each file. Note these CIDs.

## Step 2: Update Smart Contract

1. Open the `starter_nft.move` file in the `smart_contracts/package/sources` directory.

2. Replace the placeholder CIDs with your actual IPFS CIDs:
   ```move
   const BULBASAUR_CID: vector<u8> = b"ipfs://YOUR_BULBASAUR_CID_HERE";
   const CHARMANDER_CID: vector<u8> = b"ipfs://YOUR_CHARMANDER_CID_HERE";
   const SQUIRTLE_CID: vector<u8> = b"ipfs://YOUR_SQUIRTLE_CID_HERE";
   ```

## Step 3: Build and Publish the Smart Contract

1. Navigate to the package directory:
   ```
   cd smart_contracts/package
   ```

2. Build the package:
   ```
   sui move build
   ```

3. Publish the package to the Sui blockchain:
   ```
   sui client publish --gas-budget 100000000
   ```

4. After successful publication, note the following from the output:
   - Package ID
   - MintedRecord object ID

## Step 4: Update Frontend Configuration

1. Open the `StarterPicker.jsx` file in the `Frontend/src/components` directory.

2. Replace the placeholder values with your actual contract details:
   ```javascript
   const packageId = 'YOUR_PACKAGE_ID'; // Replace with your actual package ID
   const moduleId = 'starter_nft';
   ```

3. Update the MintedRecord object ID:
   ```javascript
   'YOUR_MINTED_RECORD_OBJECT_ID', // Replace with your actual MintedRecord object ID
   ```

## Step 5: Test the NFT Minting

1. Start your frontend application:
   ```
   cd Frontend
   npm run dev
   ```

2. Navigate to the Starter Picker page.

3. Connect your wallet and try minting a starter Pokémon NFT.

## Troubleshooting

- If you encounter gas budget errors, try increasing the gas budget in the publish command.
- If the transaction fails, check the error message in the browser console for details.
- Ensure your wallet has sufficient SUI tokens for the transaction.

## Next Steps

- Consider adding more Pokémon to your NFT collection.
- Implement additional features like trading or battling with your NFT Pokémon.
- Enhance the UI/UX of the minting experience.