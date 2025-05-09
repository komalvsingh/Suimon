import React, { useState, useEffect } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { createMintNftTxnBlock, getOwnedCreatures, createGainXpTxn } from "../lib/contractUtils";

export default function CreatureDisplay() {
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);
  const [mintedCreatures, setMintedCreatures] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fetchStatus, setFetchStatus] = useState("idle"); // For debugging

  const fetchCreatures = async () => {
    if (wallet.account?.address) {
      try {
        setFetchStatus("loading");
        console.log("Fetching creatures for address:", wallet.account.address);
        
        const creatures = await getOwnedCreatures(wallet.account.address);
        console.log("Creatures fetched:", creatures);
        
        setMintedCreatures(creatures);
        setFetchStatus("success");
      } catch (err) {
        console.error("Error fetching creatures:", err);
        setFetchStatus("error: " + err.message);
      }
    } else {
      setFetchStatus("no wallet connected");
    }
  };

  useEffect(() => {
    if (wallet.connected) {
      fetchCreatures();
    } else {
      setMintedCreatures([]);
      setFetchStatus("wallet disconnected");
    }
  }, [wallet.connected, wallet.account, refreshKey]);

  const mintNft = async () => {
    if (!wallet.connected) return;
    setLoading(true);

    const name = "CharmEon";
    const imageUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png";

    try {
      console.log("Creating mint transaction for:", name);
      const txb = createMintNftTxnBlock(name, imageUrl, wallet.account.address);
      
      console.log("Signing and executing transaction...");
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txb,
      });
      
      console.log("NFT minted, transaction result:", result);
      alert(`NFT Minted! Transaction digest: ${result.digest.slice(0, 10)}...`);
      
      // Force refresh after waiting for transaction
      setTimeout(() => {
        console.log("Refreshing creatures list after mint...");
        setRefreshKey(prev => prev + 1);
      }, 3000);
    } catch (e) {
      console.error("Mint error:", e);
      alert("Minting failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 text-center">
      {wallet.connected ? (
        <>
          <button
            onClick={mintNft}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 mb-6"
            disabled={loading}
          >
            {loading ? "Minting..." : "Mint Creature NFT"}
          </button>
          
          {/* Debug info */}
          <div className="text-sm text-gray-500 mb-4">
            Status: {fetchStatus} | Wallet: {wallet.account?.address?.slice(0, 10)}...
            <button 
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="ml-2 text-blue-500 underline"
            >
              Refresh
            </button>
          </div>

          {mintedCreatures.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-6">
              {mintedCreatures.map((creature) => (
                <div
                  key={creature.id}
                  className="bg-white shadow-lg rounded-xl p-4 w-72 text-center"
                >
                  <img
                    src={creature.image_url}
                    alt={creature.name}
                    className="w-full rounded h-48 object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/200x200?text=Image+Error";
                    }}
                  />
                  <h3 className="text-xl font-bold mt-2">{creature.name}</h3>
                  <p>Level: {creature.level}</p>
                  <p>XP: {creature.xp}</p>
                  <p className="text-xs text-gray-500 mb-2">ID: {creature.id.slice(0, 8)}...</p>
                  <button
                    onClick={() => handleGainXP(creature.id)}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Gain XP
                  </button>

                  <button 
  onClick={async () => {
    const objects = await getAllOwnedObjects(wallet.account.address);
    console.log("All owned objects:", objects);
    alert(`Found ${objects.length} total objects. Check console for details.`);
  }}
  className="ml-2 px-3 py-1 bg-gray-200 rounded text-sm"
>
  Debug: Check All Objects
</button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p className="text-gray-600">No creatures found. Mint your first creature!</p>
              <p className="text-xs text-gray-500 mt-2">
                If you just minted, the blockchain might still be processing. Try the refresh button.
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="text-red-600">Please connect your wallet first.</p>
      )}
    </div>
  );
}