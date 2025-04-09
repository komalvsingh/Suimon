import React, { useState } from "react";
import { useWallet } from "@suiet/wallet-kit";
import { createMintNftTxnBlock } from "../lib/contractUtils";

export default function CreatureDisplay() {
  const wallet = useWallet();
  const [loading, setLoading] = useState(false);

  const mintNft = async () => {
    if (!wallet.connected) return;

    setLoading(true);

    const name = "CharmEon";
    
    const imageUrl = "https://your-arweave-or-ipfs-link.png";

    try {
      const tx = createMintNftTxnBlock(name,imageUrl);
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });

      console.log("NFT minted successfully!", result);
      alert("Congrats! Your NFT is minted!");
    } catch (e) {
      console.error("Minting failed", e);
      alert("Oops! Minting failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 text-center">
      {wallet.connected ? (
        <button
          onClick={mintNft}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          disabled={loading}
        >
          {loading ? "Minting..." : "Mint Creature NFT"}
        </button>
      ) : (
        <p className="text-red-600">Please connect your wallet first.</p>
      )}
    </div>
  );
}
