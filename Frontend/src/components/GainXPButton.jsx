import React, { useState } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { PACKAGE_ID, MODULE_NAME } from "../lib/constants";

export default function GainXPButton({ id }) {
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);

  // Debug logs
  console.log("GainXPButton - id:", id);
  console.log("GainXPButton - wallet.connected:", wallet.connected);

  // If ID is not defined, do not show the button
  if (!id) return <p className="text-gray-500 italic">Loading Creature...</p>;

  const handleGainXP = async () => {
    if (!wallet.connected || !id) {
      alert("Wallet not connected or Creature ID missing.");
      return;
    }

    setLoading(true);
    const tx = new TransactionBlock();

    try {
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::gain_xp`,
        arguments: [tx.object(id), tx.pure(50)],
      });

      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });

      console.log("XP updated:", result);
      alert("XP gained! Refresh to see changes.");
    } catch (err) {
      console.error("XP gain failed:", err);
      alert("XP gain failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGainXP}
      disabled={loading}
      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
    >
      {loading ? "Gaining XP..." : "Gain XP"}
    </button>
  );
}
