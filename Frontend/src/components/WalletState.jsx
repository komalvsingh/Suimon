import { useWallet } from '@suiet/wallet-kit';
import ConnectButtonWrapper from './ConnectButtonWrapper.jsx';

export default function WalletState({ title, message, children }) {
  const wallet = useWallet();

  if (!wallet.connected) {
    return (
      <div className="bg-surface p-6 rounded-lg shadow-lg text-center">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="mb-4">{message}</p>
        <ConnectButtonWrapper className="bg-primary hover:bg-primary/80 px-4 py-2 rounded-md" />
      </div>
    );
  }

  return children;
}