import { SuiClient } from '@mysten/sui.js/client';
import { PACKAGE_ID, MODULE_NAME, CREATURE_STRUCT } from '../lib/constants';

// ✅ Replace Blockvision or rate-limited endpoint with official testnet fullnode
const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io' });

export async function getOwnedCreatureNfts(address) {
  try {
    const objects = await client.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${PACKAGE_ID}::${MODULE_NAME}::${CREATURE_STRUCT}`,
      },
      options: {
        showContent: true,
      },
    });

    const creatureNfts = objects.data.map((obj) => {
      const content = obj.data?.content;
      if (!content || !content.fields) return null;

      return {
        id: obj.data.objectId,
        name: content.fields.name,
        imageUrl: content.fields.image_url,
        xp: content.fields.xp,
        level: content.fields.level,
      };
    }).filter(Boolean); // remove any nulls if content/fields was missing

    return creatureNfts;
  } catch (error) {
    console.error('Error fetching Creature NFTs:', error);
    return [];
  }
}
