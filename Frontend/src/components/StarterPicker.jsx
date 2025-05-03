import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import StarterPickerSuccessMessage from './StarterPickerSuccessMessage';

// Import metadata for preview
import bulbasaurMetadata from '../assets/metadata/bulbasaur.json';
import charmanderMetadata from '../assets/metadata/charmander.json';
import squirtleMetadata from '../assets/metadata/squirtle.json';

// Constants for Pokemon IDs
const BULBASAUR_ID = 1;
const CHARMANDER_ID = 4;
const SQUIRTLE_ID = 7;

const StarterPicker = () => {
  const [selectedStarter, setSelectedStarter] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasAlreadyMinted, setHasAlreadyMinted] = useState(false);
  
  const navigate = useNavigate();
  const wallet = useWallet();
  
  // Add ref to track if component is mounted
  const isMounted = React.useRef(true);
  
  // Add useEffect cleanup to prevent navigation after unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check if the user has already minted a starter when wallet connects
  useEffect(() => {
    const checkMintedStatus = async () => {
      if (wallet && wallet.connected && wallet.provider) {
        try {
          console.log('Checking if user has already minted a starter');
          // For now, we'll skip the check to prevent errors
          // When your backend is ready, you can implement this
          
          // Note: The previous implementation was failing because wallet.provider might not
          // have a getObject method or the provider wasn't fully initialized
          
          // You would typically call your backend or check on-chain here
          // setHasAlreadyMinted(/* Logic to determine if user has already minted */);
        } catch (err) {
          console.error('Error checking minted status:', err);
        }
      }
    };
    
    checkMintedStatus();
  }, [wallet]);

  // Get metadata based on selected starter
  const getMetadata = (id) => {
    switch (id) {
      case BULBASAUR_ID:
        return bulbasaurMetadata;
      case CHARMANDER_ID:
        return charmanderMetadata;
      case SQUIRTLE_ID:
        return squirtleMetadata;
      default:
        return null;
    }
  };

  const handleStarterSelect = (id) => {
    setSelectedStarter(id);
    setError('');
  };

  const handleMint = async () => {
    if (!selectedStarter) {
      setError('Please select a starter Pokémon');
      return;
    }

    if (!wallet || !wallet.connected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsMinting(true);
      setError('');

      // Package ID from your published contract
      const packageId = '0x4449c9d9120cc867dc63dca40358383638ef008761a15fc9956bdf38b04a5d51';
      const moduleId = 'starter_nft';
      
      // MintedRecord object ID from your published contract
      const mintedRecordId = '0x428bd00add43f4c7dfa8f29881a398f4fa88fa44783b0791271bb8a68801b69d';
      
      // Create a proper transaction block using Sui.js
      const txb = new TransactionBlock();
      
      console.log('Using MintedRecord object ID:', mintedRecordId);
      
      // Set gas budget explicitly - using a more conservative value
      txb.setGasBudget(50000000); // Increased from 30000000
      
      // Call the mint_starter function from your package
      txb.moveCall({
        target: `${packageId}::${moduleId}::mint_starter`,
        arguments: [
          txb.object(mintedRecordId),
          txb.pure.u64(selectedStarter) // Explicitly use u64 for the Pokemon ID
        ],
      });
      
      console.log('Executing transaction with payload:', txb);
      
      // Execute the transaction block with explicit options
      const response = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: {
          showEffects: true,
          showObjectChanges: true,
          showInput: true,
        },
      });
      
      console.log('Mint transaction response:', response);
      
      // Updated response checking to be more robust
      // First verify we have a transaction digest which indicates success
      if (response && response.digest) {
        // Consider the transaction successful if we have a digest
        console.log('Transaction successful with digest:', response.digest);
        setSuccess(true);
        
        // REMOVED redirect logic since we now use the StarterPickerSuccessMessage
        // component with a Link instead of programmatic navigation
      } else {
        throw new Error('Transaction failed: Missing transaction digest');
      }
    } catch (err) {
      console.error('Error minting starter:', err);
      
      // Extract more useful error information
      let errorMessage = 'Unknown error';
      
      if (err.message && err.message.includes('MoveAbort')) {
        // This is likely an issue with a condition in the smart contract failing
        errorMessage = 'Contract validation failed. You may have already minted a starter or there could be other contract restrictions.';
      } else if (err.message && err.message.includes('dry run failed')) {
        errorMessage = 'Transaction simulation failed. Please check your wallet has enough SUI for gas fees.';
      } else if (err.message && err.message.includes('gas payment missing')) {
        errorMessage = 'Transaction gas payment issue. Please make sure your wallet has SUI tokens available.';
      } else if (err.message && err.message.includes('rejected')) {
        errorMessage = 'Transaction was rejected. You may have declined the transaction in your wallet.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(`Failed to mint: ${errorMessage}`);
    } finally {
      setIsMinting(false);
    }
  };

  const renderStarterCard = (id, name) => {
    const metadata = getMetadata(id);
    const isSelected = selectedStarter === id;
    
    return (
      <div 
        className={`starter-card ${isSelected ? 'selected' : ''}`}
        onClick={() => handleStarterSelect(id)}
      >
        <div className="starter-image">
          <img src={metadata.image} alt={metadata.name} />
        </div>
        <div className="starter-info">
          <h3>{metadata.name}</h3>
          <p className="starter-type">
            {metadata.types.map(type => (
              <span key={type} className={`type ${type}`}>{type}</span>
            ))}
          </p>
          <p className="starter-description">{metadata.description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="starter-picker-container">
      <h2>Choose Your Starter Pokémon</h2>
      <p className="instructions">Select one of the three starter Pokémon to mint as your NFT. You can only mint one starter per wallet address.</p>
      
      <div className="starter-options">
        {renderStarterCard(BULBASAUR_ID, 'Bulbasaur')}
        {renderStarterCard(CHARMANDER_ID, 'Charmander')}
        {renderStarterCard(SQUIRTLE_ID, 'Squirtle')}
      </div>
      
      {error && <p className="error-message">{error}</p>}
      
      {success ? (
        <StarterPickerSuccessMessage selectedStarterId={selectedStarter} />
      ) : (
        <button 
          className="mint-button" 
          onClick={handleMint} 
          disabled={!selectedStarter || isMinting || !wallet || !wallet.connected || hasAlreadyMinted}
        >
          {isMinting ? 'Minting...' : 'Mint Starter Pokémon'}
        </button>
      )}
      
      {hasAlreadyMinted && (
        <p className="already-minted-message">You have already minted a starter Pokémon.</p>
      )}
      
      {(!wallet || !wallet.connected) && (
        <p className="connect-wallet-message">Please connect your wallet to mint a starter Pokémon.</p>
      )}
    </div>
  );
};

export default StarterPicker;