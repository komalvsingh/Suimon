import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from '@suiet/wallet-kit';

// Create a context for Web3 functionality
const Web3Context = createContext();

// Provider component that wraps your app and makes web3 object available to any
// child component that calls useWeb3().
export function Web3Provider({ children }) {
  const wallet = useWallet();
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  
  // Connection function that uses the actual wallet
  const connect = () => {
    // Use the actual wallet account if connected
    if (wallet.connected && wallet.account) {
      setAccount(wallet.account.address);
    } else {
      setAccount(null);
    }
    
    // Mock contract with methods
    setContract({
      methods: {
        getStarterTokenId: (address) => ({
          call: async () => '1' // Mock token ID
        }),
        getPokemonData: (tokenId) => ({
          call: async () => {
            // Get the Pokemon name from localStorage or default to Bulbasaur
            const pokemonName = localStorage.getItem('pokemonName') || 'Bulbasaur';
            return {
              name: pokemonName,
              tokenId: tokenId,
              wins: localStorage.getItem('pokemonWins') || '0',
              health: localStorage.getItem('pokemonHealth') || '100',
              energy: localStorage.getItem('pokemonEnergy') || '0'
            };
          }
        }),
        recordVictory: (tokenId, wins, evolved, health, energy) => ({
          send: async ({ from }) => {
            // Store in localStorage instead of blockchain
            localStorage.setItem('pokemonWins', wins.toString());
            localStorage.setItem('pokemonEvolved', evolved);
            
            // Store health and energy values for persistence
            if (health !== undefined) localStorage.setItem('pokemonHealth', health.toString());
            if (energy !== undefined) localStorage.setItem('pokemonEnergy', energy.toString());
            return true;
          }
        })
      }
    });
  };

  // Initialize connection on component mount and when wallet connection changes
  useEffect(() => {
    connect();
  }, [wallet.connected, wallet.account]);

  const contextValue = {
    account,
    contract,
    connect
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
}

// Hook for child components to get the web3 object
export const useWeb3 = () => useContext(Web3Context);