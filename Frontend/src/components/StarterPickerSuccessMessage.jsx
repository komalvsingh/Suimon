import React from 'react';
import { Link } from 'react-router-dom';

// Import metadata for preview
import bulbasaurMetadata from '../assets/metadata/bulbasaur.json';
import charmanderMetadata from '../assets/metadata/charmander.json';
import squirtleMetadata from '../assets/metadata/squirtle.json';

const StarterPickerSuccessMessage = ({ selectedStarterId }) => {
  // Get metadata based on selected starter
  const getMetadata = (id) => {
    const idNum = parseInt(id, 10);
    switch (idNum) {
      case 1:
        return bulbasaurMetadata;
      case 4:
        return charmanderMetadata;
      case 7:
        return squirtleMetadata;
      default:
        return null;
    }
  };

  const metadata = getMetadata(selectedStarterId);
  
  return (
    <div className="success-message">
      <h3>Congratulations!</h3>
      <p>You've successfully minted your {metadata?.name} NFT.</p>
      <div className="starter-image-success">
        <img src={metadata?.image} alt={metadata?.name} />
      </div>
      <Link 
        to={`/detail/${selectedStarterId}`} 
        className="view-details-button"
      >
        View Your Pokémon
      </Link>
    </div>
  );
};

export default StarterPickerSuccessMessage;