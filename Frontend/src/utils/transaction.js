export const sendTransaction = async ({ tx, signAndExecuteTransactionBlock }) => {
  const result = await signAndExecuteTransactionBlock({
    transactionBlock: tx,
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
    },
  });

  return result;
};
