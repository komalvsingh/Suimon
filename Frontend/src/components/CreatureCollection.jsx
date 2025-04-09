import { useState, useEffect } from 'react';
import { ConnectButton } from '@suiet/wallet-kit';
import { LazyLoadImage } from 'react-lazy-load-image-component';

const CreatureCollection = ({ wallet }) => {
  const [creatures, setCreatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Using the wallet prop passed from App.jsx
  
  // Sample creature data - in a real app, this would come from the blockchain
  const sampleCreatures = [
    {
      id: '1',
      name: 'Flamander',
      type: 'Fire',
      level: 5,
      power: 120,
      image: 'https://via.placeholder.com/150/FF4500/FFFFFF?text=Flamander',
    },
    {
      id: '2',
      name: 'Aquadrake',
      type: 'Water',
      level: 3,
      power: 85,
      image: 'https://via.placeholder.com/150/1E90FF/FFFFFF?text=Aquadrake',
    },
    {
      id: '3',
      name: 'Leafeon',
      type: 'Plant',
      level: 4,
      power: 95,
      image: 'https://via.placeholder.com/150/32CD32/FFFFFF?text=Leafeon',
    },
  ];
  
  useEffect(() => {
    const fetchCreatures = async () => {
      if (!wallet.connected || !wallet.account) {
        setCreatures([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError('');
      
      try {
       
         // In a real implementation, you would fetch NFTs owned by the user
        // For example:
        // const nfts = await suiClient.getOwnedObjects({
        //   owner: currentAccount.address,
        //   options: { showContent: true },
        // });
        // For now, we'll use sample data
        setTimeout(() => {
          setCreatures(sampleCreatures);
          setIsLoading(false);
        }, 1000); // Simulate loading
      } catch (err) {
        console.error('Error fetching creatures:', err);
        setError('Failed to load your creatures. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchCreatures();
  }, [wallet]);
  
  const mintCreature = async () => {
    if (!wallet.account) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // In a real implementation, you would call a smart contract to mint an NFT
      // For demonstration, we'll just add a new creature to the list
      const newCreature = {
        id: `${creatures.length + 1}`,
        name: 'New SuiMon',
        type: ['Fire', 'Water', 'Plant', 'Electric'][Math.floor(Math.random() * 4)],
        level: 1,
        power: 50 + Math.floor(Math.random() * 50),
        image: `https://via.placeholder.com/150/CCCCCC/FFFFFF?text=New+SuiMon`,
      };
      
      setCreatures([...creatures, newCreature]);
    } catch (err) {
      console.error('Error minting creature:', err);
      setError('Failed to mint new creature. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {!wallet.account ? (
        <div className="bg-surface p-6 rounded-lg shadow-lg text-center">
          <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="mb-4">Please connect your wallet to view your SuiMon creatures.</p>
          <ConnectButtonWrapper className="bg-primary hover:bg-primary/80 px-4 py-2 rounded-md text-white" />
        </div>
      ) : isLoading ? (
        <div className="bg-surface p-6 rounded-lg shadow-lg text-center">
          <p>Loading your creatures...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg text-red-500">
              {error}
            </div>
          )}
          
          <div className="bg-surface p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your SuiMon Creatures</h2>
              <button 
                onClick={mintCreature}
                className="bg-primary hover:bg-primary/80 px-4 py-2 rounded-md text-white"
              >
                Mint New Creature
              </button>
            </div>
            
            {creatures.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creatures.map(creature => (
                  <div key={creature.id} className="bg-background p-4 rounded-lg shadow border border-gray-700 hover:border-primary transition-colors">
                    <div className="aspect-square mb-3 overflow-hidden rounded-md">
                      <LazyLoadImage
                        src={creature.image}
                        alt={creature.name}
                        className="w-full h-full object-cover"
                        placeholder={<div className="w-full h-full bg-gray-700 animate-pulse" />}
                      />
                    </div>
                    <h3 className="text-lg font-bold">{creature.name}</h3>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm">Type: {creature.type}</span>
                      <span className="text-sm">Level: {creature.level}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Power:</span>
                        <span className="text-sm font-bold">{creature.power}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (creature.power / 200) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <button className="flex-1 bg-primary/20 hover:bg-primary/30 px-2 py-1 rounded text-sm">
                        Train
                      </button>
                      <button className="flex-1 bg-primary/20 hover:bg-primary/30 px-2 py-1 rounded text-sm">
                        Battle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">You don't have any creatures yet</p>
                <button 
                  onClick={mintCreature}
                  className="bg-primary hover:bg-primary/80 px-4 py-2 rounded-md text-white"
                >
                  Mint Your First Creature
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CreatureCollection;