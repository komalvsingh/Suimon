import { SuiClient } from "@mysten/sui/client";
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULE_NAME } from "./constants";

const suiClient = new SuiClient({ url: "https://fullnode.devnet.sui.io" });

export const createMintNftTxnBlock = (name, imageUrl, senderAddress) => {
  const txb = new Transaction();

  // Step 1: Call mint function and get the creature object
  const creature = txb.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::mint`,
    arguments: [
      txb.pure.string(name),
      txb.pure.string(imageUrl)
    ],
  });

  // Step 2: Transfer the creature to the sender
  // THIS IS IMPORTANT: Make sure the transfer happens in the same transaction
  txb.transferObjects([creature], txb.pure.address(senderAddress));

  console.log("Created mint transaction for:", name, "to address:", senderAddress);
  return txb;
};

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

    // Handle case where no creatures are found
    if (!response.data || response.data.length === 0) {
      console.log("No creatures found for address:", address);
      return [];
    }

    // Log the first item structure to understand the data format
    if (response.data[0]) {
      console.log("First creature data structure:", JSON.stringify(response.data[0], null, 2));
    }

    // More robust parsing of creature data
    const creatures = [];
    
    for (const item of response.data) {
      try {
        if (item.data && item.data.content) {
          const objectId = item.data.objectId;
          let name, image_url, level, xp;
          
          // Check if fields are directly in content or nested
          const fields = item.data.content.fields || {};
          
          name = fields.name;
          image_url = fields.image_url;
          level = fields.level;
          xp = fields.xp;
          
          // If not found, try alternative structures
          if (!name && item.data.display) {
            name = item.data.display.name || "Unknown Creature";
          }
          
          // Convert numeric values safely
          level = parseInt(level, 10) || 1;
          xp = parseInt(xp, 10) || 0;
          
          creatures.push({
            id: objectId,
            name: name || "Unknown Creature",
            image_url: image_url || "https://placehold.co/200x200?text=No+Image",
            level: level,
            xp: xp,
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
export const createGainXpTxn = (objectId) => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::gain_xp`,
    arguments: [
      tx.object(objectId),
      tx.pure.u64(50) // Make sure to use the proper type for XP value
    ],
  });
  return tx;
};

// Add this function to your contractUtils.js
export const getAllOwnedObjects = async (address) => {
  try {
    console.log("Getting ALL owned objects for address:", address);
    
    const response = await suiClient.getOwnedObjects({
      owner: address,
      options: { showContent: true, showType: true },
    });
    
    console.log("All objects raw response:", response);
    
    // Check all objects for debugging
    if (response.data && response.data.length > 0) {
      console.log(`Found ${response.data.length} total objects. Types:`);
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