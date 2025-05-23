import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { TransactionBlock } from '@mysten/sui.js/transactions';

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
  
  const navigate = useNavigate();
  const wallet = useWallet();

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
      const packageId = '0x70217963607936caee034ce016fb2e9be0debc644d13a6ac40d955940e1066a7';
      const moduleId = 'starter_nft';
      
      // MintedRecord object ID from your published contract
      const mintedRecordId = '0xe0fd566dfd14df738ec42b1e7e04e02ca05fff14964583b2e7c4cb1bebcaba4e';
      
      // Create a proper transaction block using Sui.js
      const txb = new TransactionBlock();
      
      console.log('Using MintedRecord object ID:', mintedRecordId);
      
      // Call the mint_starter function from your package
      txb.moveCall({
        target: `${packageId}::${moduleId}::mint_starter`,
        arguments: [
          txb.object(mintedRecordId),
          txb.pure(selectedStarter) // Passing the ID as a number, not a string
        ],
      });
      
      console.log('Executing transaction with payload:', txb);
      
      // Execute the transaction block
      const response = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });
      
      console.log('Mint transaction response:', response);
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/detail/${selectedStarter}`);
      }, 2000);
    } catch (err) {
      console.error('Error minting starter:', err);
      setError(`Failed to mint: ${err.message || 'Unknown error'}`);
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
        <div className="success-message">
          <p>Successfully minted your starter Pokémon!</p>
          <p>Redirecting to Pokémon details...</p>
        </div>
      ) : (
        <button 
          className="mint-button" 
          onClick={handleMint} 
          disabled={!selectedStarter || isMinting || !wallet || !wallet.connected}
        >
          {isMinting ? 'Minting...' : 'Mint Starter Pokémon'}
        </button>
      )}
      
      {(!wallet || !wallet.connected) && (
        <p className="connect-wallet-message">Please connect your wallet to mint a starter Pokémon.</p>
      )}
    </div>
  );
};

export default StarterPicker;