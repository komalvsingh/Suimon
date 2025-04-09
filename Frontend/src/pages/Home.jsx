import React from "react";
import WalletCard from "../components/WalletCard";
import CreatureDisplay from "../components/CreatureDisplay";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-pink-200 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4">🔥 SuiMon Wallet</h1>
      <WalletCard />
      <CreatureDisplay />
    </div>
  );
}
