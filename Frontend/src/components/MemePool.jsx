import React, { useState } from "react";
import { createMemePool, voteForMeme, donateToMemePool, claimRewards } from "../lib/contractUtils";
import { useWallet } from "../hooks/useWallet";

export default function MemePool() {
  const { wallet } = useWallet();
  const [url, setUrl] = useState("");

  const handleCreate = async () => {
    await createMemePool(url, wallet.address, wallet);
    setUrl("");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Create a Meme Pool</h2>
      <input
        type="text"
        className="border p-2 w-full"
        placeholder="Enter meme URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={handleCreate} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        Create Pool
      </button>
    </div>
  );
}
