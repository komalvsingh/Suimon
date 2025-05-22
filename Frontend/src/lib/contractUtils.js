import { SuiClient } from "@mysten/sui/client";
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULE_NAME, ALIAS_MODULE, DAO_MODULE } from "./constants";

const suiClient = new SuiClient({ url: "https://fullnode.devnet.sui.io" });

// Register Alias
export function createRegisterAliasTx(name, senderAddress) {
  const tx = new Transaction();

  const result = tx.moveCall({
    target: `${PACKAGE_ID}::${ALIAS_MODULE}::register`,
    arguments: [tx.pure.string(name)],
  });

  tx.transferObjects([result], tx.pure.address(senderAddress));
  return tx;
}

// Fixed createMemePool function
export async function createMemePool(memeUrl, senderAddress, wallet) {
  try {
    const tx = new Transaction();

    const result = tx.moveCall({
      target: `${PACKAGE_ID}::${DAO_MODULE}::create_pool`,
      arguments: [tx.pure.string(memeUrl)],
    });

    // Transfer the pool object back to the user
    tx.transferObjects([result], tx.pure.address(senderAddress));

    // Sign and execute the transaction
    const response = await wallet.signAndExecuteTransactionBlock({
      transactionBlock: tx,
    });
    
    return response;
  } catch (error) {
    console.error("Error in createMemePool:", error);
    throw error;
  }
}

// Vote for meme
export async function voteForMeme(poolId, wallet) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::${DAO_MODULE}::vote`,
    arguments: [tx.object(poolId)],
  });

  return await wallet.signAndExecuteTransactionBlock({ transactionBlock: tx });
}

// Donate to meme pool
export async function donateToMemePool(poolId, coinObj, wallet) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::${DAO_MODULE}::donate_to_pool`,
    arguments: [tx.object(poolId), tx.object(coinObj)],
  });

  return await wallet.signAndExecuteTransactionBlock({ transactionBlock: tx });
}

// Claim rewards
export async function claimRewards(poolId, wallet) {
  const tx = new Transaction();

  tx.moveCall({
    target: `${PACKAGE_ID}::${DAO_MODULE}::claim_rewards`,
    arguments: [tx.object(poolId)],
  });

  return await wallet.signAndExecuteTransactionBlock({ transactionBlock: tx });
}

// Mint NFT
export const createMintNftTxnBlock = (name, imageUrl, senderAddress) => {
  const txb = new Transaction();

  const creature = txb.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::mint`,
    arguments: [
      txb.pure.string(name),
      txb.pure.string(imageUrl)
    ],
  });

  txb.transferObjects([creature], txb.pure.address(senderAddress));

  console.log("Created mint transaction for:", name, "to address:", senderAddress);
  return txb;
};

// Get owned creatures
export const getOwnedCreatures = async (address) => {
  try {
    const type = `${PACKAGE_ID}::${MODULE_NAME}::Creature`;
    console.log("Querying for creatures with type:", type);

    const response = await suiClient.getOwnedObjects({
      owner: address,
      filter: { StructType: type },
      options: { showContent: true, showDisplay: true },
    });

    console.log("Raw response from Sui:", response);

    if (!response.data || response.data.length === 0) {
      console.log("No creatures found for address:", address);
      return [];
    }

    const creatures = [];

    for (const item of response.data) {
      try {
        if (item.data && item.data.content) {
          const objectId = item.data.objectId;
          let name, image_url, level, xp;
          const fields = item.data.content.fields || {};

          name = fields.name;
          image_url = fields.image_url;
          level = parseInt(fields.level, 10) || 1;
          xp = parseInt(fields.xp, 10) || 0;

          if (!name && item.data.display) {
            name = item.data.display.name || "Unknown Creature";
          }

          creatures.push({
            id: objectId,
            name: name || "Unknown Creature",
            image_url: image_url || "https://placehold.co/200x200?text=No+Image",
            level,
            xp,
          });

          console.log("Processed creature:", { id: objectId, name, level, xp });
        }
      } catch (parseError) {
        console.error("Error parsing creature:", parseError, item);
      }
    }

    console.log("Total creatures found:", creatures.length);
    return creatures;
  } catch (error) {
    console.error("Error fetching owned creatures:", error);
    return [];
  }
};

// Gain XP
export const createGainXpTxn = (objectId) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::gain_xp`,
    arguments: [
      tx.object(objectId),
      tx.pure.u64(50)
    ],
  });
  return tx;
};

// All owned objects
export const getAllOwnedObjects = async (address) => {
  try {
    console.log("Getting ALL owned objects for address:", address);

    const response = await suiClient.getOwnedObjects({
      owner: address,
      options: { showContent: true, showType: true },
    });

    if (response.data && response.data.length > 0) {
      const types = response.data
        .filter(item => item.data && item.data.type)
        .map(item => item.data.type);
      console.log("Object types:", [...new Set(types)]);
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching all objects:", error);
    return [];
  }
};