import { useWallet as useSuietWallet } from "@suiet/wallet-kit";

export function useWallet() {
  const {
    connected,
    account,
    chain,
    signAndExecuteTransactionBlock,
    disconnect,
    select,
  } = useSuietWallet();

  return {
    connected,
    account,
    chain,
    signAndExecuteTransactionBlock,
    disconnect,
    select,
  };
}
