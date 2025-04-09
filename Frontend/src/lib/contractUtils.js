import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULE_NAME } from "./constants";

export const createMintNftTxnBlock = (name, imageUrl) => {
  const txb = new Transaction();
  
  txb.moveCall({
    target: `${PACKAGE_ID}::${MODULE_NAME}::mint`,
    arguments: [
      txb.pure.string(name),
      
      txb.pure.string(imageUrl),
    ],
  });
  tx.transferObjects([creature], tx.pure(tx.sender()));
  return txb;
};