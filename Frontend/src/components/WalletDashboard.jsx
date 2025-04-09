import { useState, useEffect } from 'react';
import { ConnectButton, useSuiClient } from '@suiet/wallet-kit';
import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import ConnectButtonWrapper from './ConnectButtonWrapper.jsx';

const WalletDashboard = ({ wallet }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the wallet prop instead of useCurrentAccount
  // const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  
  // Fetch wallet balance and transactions when account changes
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!wallet.connected || !wallet.account) {
        setBalance(0);
        setTransactions([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError('');
      
      // Check cached balance first
      const cachedBalance = localStorage.getItem('suiBalance');
      if (cachedBalance) {
        setBalance(Number(cachedBalance));
      }
      
      try {
        // Get balance using SuiClient
        const coins = await suiClient.getCoins({
          owner: wallet.account.address,
          coinType: SUI_TYPE_ARG
        });
        
        // Calculate total balance from all coins
        let totalBalance = 0n;
        for (const coin of coins.data) {
          totalBalance += BigInt(coin.balance);
        }
        
        // Convert from MIST to SUI (1 SUI = 10^9 MIST)
        setBalance(Number(totalBalance) / 1_000_000_000);
        
        // For transactions, we'll use a placeholder for now
        // In a real implementation, you would fetch transactions from the blockchain
        // Example: const txs = await wallet.getTransactionsByAddress(wallet.account.address);
        setTransactions([]);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWalletData();
  }, [wallet]);
  
  const handleSend = async (e) => {
    e.preventDefault();
    if (!wallet.connected || !wallet.account || !sendAmount || !recipientAddress) return;
    
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      setError('Invalid amount');
      return;
    }
    
    setIsSending(true);
    setError('');
    
    try {
      // Convert SUI to MIST (1 SUI = 10^9 MIST)
      const amountMist = BigInt(Math.floor(amount * 1_000_000_000));
      
      // Use Suiet wallet to send transaction
      const response = await wallet.signAndExecuteTransaction({
        transaction: {
          kind: 'moveCall',
          data: {
            packageObjectId: '0x2',
            module: 'sui',
            function: 'pay',
            typeArguments: [SUI_TYPE_ARG],
            arguments: [
              wallet.account.address,
              [recipientAddress],
              [amountMist.toString()]
            ],
            gasBudget: 10000000, // Gas budget in MIST
          }
        }
      });
      
      console.log('Transaction response:', response);
      
      // Add the transaction to the list
      const newTransaction = {
        id: transactions.length + 1,
        type: 'send',
        amount,
        to: recipientAddress,
        timestamp: new Date().toLocaleString(),
        txId: response.digest,
      };
      
      setTransactions([newTransaction, ...transactions]);
      // Update balance (optimistically)
      setBalance(prevBalance => prevBalance - amount);
      setSendAmount('');
      setRecipientAddress('');
    } catch (err) {
      console.error('Error sending transaction:', err);
      setError('Failed to send transaction: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {!wallet.connected ? (
        <div className="bg-surface p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="mb-4">Please connect your wallet to view your balance and transactions.</p>
          // In the return statement where ConnectButton is used:
          <ConnectButtonWrapper className="bg-primary hover:bg-primary/80 px-4 py-2 rounded-md" />
        </div>
      ) : isLoading ? (
        <div className="bg-surface p-6 rounded-lg shadow-lg text-center">
          <svg className="animate-spin h-8 w-8 text-primary mx-auto" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-2">Loading wallet data...</p>
        </div>
      ) : (
        <>
          <div className="bg-surface p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Wallet Balance</h2>
              <button 
                onClick={() => fetchWalletData()}
                className="text-sm bg-primary/10 hover:bg-primary/20 px-3 py-1 rounded-md"
                title="Refresh balance"
              >
                ⟳
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-primary">{balance.toFixed(4)}</span>
              <span className="text-lg">SUI</span>
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Address: {wallet.account?.address}
            </div>
          </div>
          
          {/* Send Transaction Form */}
          <div className="bg-surface p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Send SUI</h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label htmlFor="recipient" className="block mb-1">Recipient Address</label>
                <input
                  id="recipient"
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-2 rounded-md bg-background border border-gray-700 focus:border-primary focus:outline-none"
                  required
                />
              </div>
              <div>
                <label htmlFor="amount" className="block mb-1">Amount (SUI)</label>
                <input
                  id="amount"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  max={balance}
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full p-2 rounded-md bg-background border border-gray-700 focus:border-primary focus:outline-none"
                  required
                />
              </div>
              {error && (
              <div className="bg-red-500/10 border border-red-500 p-3 rounded-lg mb-4">
                <p className="text-red-500">{error}</p>
                <button 
                  onClick={() => fetchWalletData()}
                  className="text-red-500 hover:text-red-400 mt-2 text-sm"
                >
                  Try Again
                </button>
              </div>
            )}
              <button
                type="submit"
                disabled={isSending || !wallet.connected}
                className="w-full bg-primary hover:bg-primary/80 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? 'Sending...' : 'Send SUI'}
              </button>
            </form>
          </div>
          
          {/* Transaction History */}
          <div className="bg-surface p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Transaction History</h2>
            {transactions.length === 0 ? (
              <p className="text-center text-gray-400">No transactions found</p>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="border-b border-gray-700 pb-3">
                    <div className="flex justify-between">
                      <span className="font-bold">{tx.type === 'send' ? 'Sent' : 'Received'}</span>
                      <span className={tx.type === 'send' ? 'text-red-500' : 'text-green-500'}>
                        {tx.type === 'send' ? '-' : '+'}{tx.amount.toFixed(4)} SUI
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {tx.type === 'send' ? 'To: ' : 'From: '}{tx.to || tx.from}
                    </div>
                    <div className="text-sm text-gray-400">
                      {tx.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WalletDashboard;