import React from "react";
import { ConnectButton } from "@suiet/wallet-kit";
import "@suiet/wallet-kit/style.css";

export default function WalletCard() {
  return (
    <div className="p-6 bg-white shadow-xl rounded-xl text-center">
      <ConnectButton />
    </div>
  );
}
