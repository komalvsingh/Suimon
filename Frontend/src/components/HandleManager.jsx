import React, { useState } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { createRegisterAliasTx } from "../lib/contractUtils";

export default function HandleManager() {
  const wallet = useWallet();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!name || !wallet.connected) return;

    setLoading(true);
    setError("");
    
    try {
      // Get the sender address first - before any other operations
      const senderAddress = wallet.account?.address;
      if (!senderAddress) {
        throw new Error("Wallet address not available");
      }
      
      // Clean up the name - remove @ if user added it
      const cleanName = name.startsWith('@') ? name.substring(1) : name;
      
      // Create the transaction with the sender address
      const tx = createRegisterAliasTx(cleanName, senderAddress);
      
      // Set the sender explicitly (may be redundant but ensures it's set)
      tx.setSender(senderAddress);
      
      // Sign and execute the transaction
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });
      
      console.log("Transaction result:", result);
      alert(`Handle @${cleanName} registered successfully!`);
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Handle registration failed");
      alert(`Registration failed: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">🔖 Register Your @Handle</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="username (without @)"
          className="border px-4 py-2 rounded mr-2 w-64"
        />
      </div>
      
      <button
        onClick={handleRegister}
        className={`px-4 py-2 rounded ${
          loading ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'
        } text-white`}
        disabled={loading || !wallet.connected}
      >
        {loading ? "Registering..." : "Register Handle"}
      </button>
      
      {!wallet.connected && (
        <div className="mt-4 text-amber-600">
          Please connect your wallet first
        </div>
      )}
    </div>
  );
}