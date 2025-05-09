import { SuiClientProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectButton, useWallet } from '@suiet/wallet-kit';

// Network configuration
const networks = {
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  devnet: { url: getFullnodeUrl('devnet') },
  localnet: { url: getFullnodeUrl('localnet') },
};

// Create a client for React Query
const queryClient = new QueryClient();

const WalletProviderWrapper = ({ children }) => {
  const wallet = useWallet();

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <div className="wallet-container">
          <ConnectButton />
          <section>
            <p>
              <span className="gradient">Wallet status:</span> {wallet.status}
            </p>
          </section>
          {children}
        </div>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};

export default WalletProviderWrapper;