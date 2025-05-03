import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';

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
  const { connected, signAndExecuteTransaction } = useWallet();

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

    if (!connected) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setIsMinting(true);
      setError('');

      // Replace with your actual contract address and package ID
      const packageId = 'YOUR_PACKAGE_ID';
      const moduleId = 'starter_nft';
      
      // Create transaction payload
      const txb = {
        packageObjectId: packageId,
        module: moduleId,
        function: 'mint_starter',
        typeArguments: [],
        arguments: [
          // Replace with your actual MintedRecord object ID
          'YOUR_MINTED_RECORD_OBJECT_ID',
          selectedStarter.toString()
        ],
        gasBudget: 10000,
      };

      // Execute transaction
      const response = await signAndExecuteTransaction(txb);
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
          disabled={!selectedStarter || isMinting || !connected}
        >
          {isMinting ? 'Minting...' : 'Mint Starter Pokémon'}
        </button>
      )}
      
      {!connected && (
        <p className="connect-wallet-message">Please connect your wallet to mint a starter Pokémon.</p>
      )}
    </div>
  );
};

export default StarterPicker;