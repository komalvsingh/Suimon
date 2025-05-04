import { useState, useEffect } from 'react';
import { useSuiClient } from '@suiet/wallet-kit';
import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import ConnectButtonWrapper from './ConnectButtonWrapper.jsx';
import { TransactionBlock } from '@mysten/sui.js/transactions';

// Registry module constants
const REGISTRY_PACKAGE_ID = '0x0cdeac32e3e56c3e4592c5715bf6fa886bf6fcea2f734de3270b2e2ed507097a'; 
const REGISTRY_MODULE = 'username_registry';
const REGISTRY_OBJECT_ID = '0x609fd38b9e2f5881ad7e78635f74640a62a69c25bccd6ac86ce0c709d0b860db';

const WalletDashboard = ({ wallet }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const suiClient = useSuiClient();
  
  const [sendAmount, setSendAmount] = useState('');
  const [recipientInput, setRecipientInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  
  // Username management
  const [username, setUsername] = useState('');
  const [userHandle, setUserHandle] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  
  // Fetch wallet balance, transactions, and username handle
  const fetchWalletData = async () => {
    if (!wallet.connected || !wallet.account) {
      setBalance(0);
      setTransactions([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
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
      
      // Fetch owned objects to check for username handle
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: wallet.account.address,
        options: {
          showContent: true,
        },
      });
      
      // Look for username handle in owned objects
      let foundUserHandle = null;
      for (const obj of ownedObjects.data) {
        if (obj.data?.content?.type?.includes(`${REGISTRY_PACKAGE_ID}::${REGISTRY_MODULE}::UsernameHandle`)) {
          // Extract username from handle
          const fields = obj.data.content.fields;
          if (fields && fields.username) {
            foundUserHandle = {
              objectId: obj.data.objectId,
              username: fields.username,
            };
            break;
          }
        }
      }
      
      setUserHandle(foundUserHandle);
      setTransactions([]);
    } catch (err) {
      console.error('Error fetching wallet data:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Run fetchWalletData on component mount or when wallet changes
  useEffect(() => {
    if (wallet.connected) {
      fetchWalletData();
    }
  }, [wallet.connected, wallet.account]);
  
  // Check if username is available
  const checkUsernameAvailability = async (usernameToCheck) => {
    if (!usernameToCheck || !wallet.connected) return;
    
    setIsCheckingUsername(true);
    try {
      const txb = new TransactionBlock();
      
      // FIXED: Added explicit type specification
      txb.moveCall({
        target: `${REGISTRY_PACKAGE_ID}::${REGISTRY_MODULE}::is_username_available`,
        arguments: [
          txb.object(REGISTRY_OBJECT_ID),
          txb.pure.string(usernameToCheck)
        ],
        typeArguments: [], // Explicitly set empty type arguments
      });
      
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: txb,
        sender: wallet.account.address,
      });
      
      if (result.results?.[0]?.returnValues?.[0]) {
        const available = JSON.parse(result.results[0].returnValues[0][0]);
        setUsernameAvailable(available);
      }
    } catch (err) {
      console.error('Error checking username availability:', err);
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };
  
  // Register a new username
  const registerUsername = async (e) => {
    e.preventDefault();
    if (!wallet.connected || !wallet.account || !username) return;
    
    setIsRegistering(true);
    setRegistrationStatus('');
    setError('');
    
    try {
      const txb = new TransactionBlock();
      
      // FIXED: Add gas budget and explicit typing
      txb.setGasBudget(30000000); // Setting explicit gas budget
      
      txb.moveCall({
        target: `${REGISTRY_PACKAGE_ID}::${REGISTRY_MODULE}::register_username`,
        arguments: [
          txb.object(REGISTRY_OBJECT_ID),
          txb.pure.string(username)
        ],
        typeArguments: [], // Explicitly set empty type arguments
      });
      
      // Execute transaction
      const response = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showEvents: true,
        },
      });
      
      console.log('Username registration response:', response);
      
      // Find the created UsernameHandle object from the transaction effects
      let handleObjectId = null;
      if (response.effects?.created) {
        for (const created of response.effects.created) {
          if (created.owner?.AddressOwner === wallet.account.address) {
            handleObjectId = created.reference.objectId;
            break;
          }
        }
      }
      
      setRegistrationStatus('success');
      setUserHandle({
        username: username,
        objectId: handleObjectId || 'unknown',
      });
      
      // Reset the form
      setUsername('');
      setUsernameAvailable(null);
      
      // Refresh wallet data to update UI
      setTimeout(fetchWalletData, 1000);
    } catch (err) {
      console.error('Error registering username:', err);
      setRegistrationStatus('error');
      setError('Failed to register username: ' + (err.message || 'Unknown error'));
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Unregister username
  const unregisterUsername = async () => {
    if (!wallet.connected || !wallet.account || !userHandle) return;
    
    try {
      const txb = new TransactionBlock();
      
      // FIXED: Add gas budget and explicit typing
      txb.setGasBudget(20000000); // Setting explicit gas budget
      
      txb.moveCall({
        target: `${REGISTRY_PACKAGE_ID}::${REGISTRY_MODULE}::unregister_username`,
        arguments: [
          txb.object(REGISTRY_OBJECT_ID),
          txb.object(userHandle.objectId),
        ],
        typeArguments: [], // Explicitly set empty type arguments
      });
      
      // Execute transaction
      const response = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: {
          showEffects: true,
        },
      });
      
      console.log('Username unregistration response:', response);
      
      // Reset handle state
      setUserHandle(null);
      
      // Refresh wallet data
      setTimeout(fetchWalletData, 1000);
    } catch (err) {
      console.error('Error unregistering username:', err);
      setError('Failed to unregister username: ' + (err.message || 'Unknown error'));
    }
  };
  
  // Lookup address by username
  const lookupAddressByUsername = async (username) => {
    if (!username.startsWith('@') || !wallet.connected) return null;
    
    const usernameWithoutAt = username.substring(1);
    
    try {
      const txb = new TransactionBlock();
      
      txb.moveCall({
        target: `${REGISTRY_PACKAGE_ID}::${REGISTRY_MODULE}::lookup_address`,
        arguments: [
          txb.object(REGISTRY_OBJECT_ID),
          txb.pure.string(usernameWithoutAt)
        ],
        typeArguments: [], // Explicitly set empty type arguments
      });
      
      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: txb,
        sender: wallet.account.address,
      });
      
      // Parse the result - we expect (bool, address)
      if (result.results?.[0]?.returnValues?.[0]) {
        const [found, address] = JSON.parse(result.results[0].returnValues[0]);
        if (found) {
          return address;
        }
      }
      
      return null;
    } catch (err) {
      console.error('Error looking up address by username:', err);
      return null;
    }
  };
  
  // Handle sending transaction with username support
  const handleSend = async (e) => {
    e.preventDefault();
    if (!wallet.connected || !wallet.account || !sendAmount || !recipientInput) return;
    
    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0 || amount > balance) {
      setError('Invalid amount');
      return;
    }
    
    setIsSending(true);
    setError('');
    
    try {
      // Check if this is a username (starts with @)
      let recipientAddress = recipientInput;
      let resolvedUsername = null;
      
      if (recipientInput.startsWith('@')) {
        const resolved = await lookupAddressByUsername(recipientInput);
        if (!resolved) {
          throw new Error(`Username ${recipientInput} not found`);
        }
        recipientAddress = resolved;
        resolvedUsername = recipientInput;
      }
      
      // Convert SUI to MIST (1 SUI = 10^9 MIST)
      const amountMist = Math.floor(amount * 1_000_000_000);
      
      const txb = new TransactionBlock();
      
      // FIXED: Add gas budget
      txb.setGasBudget(20000000); // Setting explicit gas budget
      
      // Split/merge coins as needed and create a coin with the specific amount
      const [coin] = txb.splitCoins(txb.gas, [txb.pure(amountMist)]);
      
      // Transfer the coin to the recipient
      txb.transferObjects([coin], txb.pure(recipientAddress));
      
      const response = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: {
          showEffects: true,
        },
      });
      
      console.log('Transaction response:', response);
      
      // Add the transaction to the list
      const newTransaction = {
        id: transactions.length + 1,
        type: 'send',
        amount,
        to: resolvedUsername || recipientAddress,
        toAddress: recipientAddress,
        timestamp: new Date().toLocaleString(),
        txId: response.digest,
        resolvedUsername: resolvedUsername,
      };
      
      setTransactions([newTransaction, ...transactions]);
      // Update balance (optimistically)
      setBalance(prevBalance => prevBalance - amount);
      setSendAmount('');
      setRecipientInput('');
      
      // Refresh wallet data after a short delay to get updated balance
      setTimeout(fetchWalletData, 3000);
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
                onClick={fetchWalletData}
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
            {userHandle && (
              <div className="mt-2 flex items-center">
                <span className="text-green-400 font-bold">@{userHandle.username}</span>
                <button
                  onClick={unregisterUsername}
                  className="ml-2 text-xs text-red-400 hover:text-red-300"
                  title="Unregister username"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          
          {/* Username Registration */}
          {!userHandle && (
            <div className="bg-surface p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4">Register Username</h2>
              <p className="text-sm mb-4">Register a custom @username so others can send you SUI easily!</p>
              
              <form onSubmit={registerUsername} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block mb-1">Username</label>
                  <div className="flex">
                    <span className="bg-primary/20 p-2 rounded-l-md">@</span>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => {
                        const value = e.target.value;
                        setUsername(value);
                        if (value.length >= 3) {
                          checkUsernameAvailability(value);
                        } else {
                          setUsernameAvailable(null);
                        }
                      }}
                      onBlur={() => {
                        if (username.length >= 3) {
                          checkUsernameAvailability(username);
                        }
                      }}
                      placeholder="username"
                      className="flex-1 p-2 rounded-r-md bg-background border border-gray-700 focus:border-primary focus:outline-none"
                      required
                      minLength={3}
                    />
                  </div>
                  
                  {username.length >= 3 && isCheckingUsername && (
                    <p className="mt-1 text-sm text-gray-400">Checking availability...</p>
                  )}
                  
                  {username.length >= 3 && !isCheckingUsername && usernameAvailable !== null && (
                    <p className={`mt-1 text-sm ${usernameAvailable ? 'text-green-400' : 'text-red-400'}`}>
                      {usernameAvailable ? 'Username available! ✓' : 'Username already taken ✗'}
                    </p>
                  )}
                </div>
                
                {registrationStatus === 'error' && (
                  <div className="bg-red-500/10 border border-red-500 p-3 rounded-lg">
                    <p className="text-red-500">{error}</p>
                  </div>
                )}
                
                {registrationStatus === 'success' && (
                  <div className="bg-green-500/10 border border-green-500 p-3 rounded-lg">
                    <p className="text-green-500">Username registered successfully!</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isRegistering || !wallet.connected || !username || username.length < 3 || usernameAvailable === false}
                  className="w-full bg-primary hover:bg-primary/80 text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRegistering ? 'Registering...' : 'Register Username'}
                </button>
              </form>
            </div>
          )}
          
          {/* Send Transaction Form */}
          <div className="bg-surface p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Send SUI</h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label htmlFor="recipient" className="block mb-1">Recipient (Address or @username)</label>
                <input
                  id="recipient"
                  type="text"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  placeholder="0x... or @username"
                  className="w-full p-2 rounded-md bg-background border border-gray-700 focus:border-primary focus:outline-none"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  You can use @username format for registered users
                </p>
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
                      {tx.resolvedUsername && <span className="text-green-400 ml-1">({tx.resolvedUsername})</span>}
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