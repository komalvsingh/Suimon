import React, { useState } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, MODULE_NAME } from "../lib/constants";

export default function GainXPButton({ id }) {
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);

  const handleGainXP = async () => {
    if (!wallet.connected) return;
    setLoading(true);
    const tx = new Transaction();

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::gain_xp`,
      arguments: [
        tx.object(id),
        tx.pure(50), // Add 50 XP
      ],
    });

    try {
      const result = await wallet.signAndExecuteTransactionBlock({ transactionBlock: tx });
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
      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      {loading ? "Gaining XP..." : "Gain XP"}
    </button>
  );
}
