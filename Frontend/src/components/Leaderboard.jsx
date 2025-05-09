import { useState, useEffect } from 'react';
import ConnectButtonWrapper from './ConnectButtonWrapper.jsx';

const Leaderboard = ({ wallet }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('players'); // 'players' or 'creatures'
  
  // Using the wallet prop passed from App.jsx
  
  // Sample leaderboard data
  const samplePlayers = [
    {
      id: '1',
      address: '0x1234...5678',
      name: 'CryptoChampion',
      wins: 42,
      losses: 12,
      creatures: 8,
      highestPower: 185,
    },
    {
      id: '2',
      address: '0x8765...4321',
      name: 'BlockchainMaster',
      wins: 38,
      losses: 15,
      creatures: 6,
      highestPower: 172,
    },
    {
      id: '3',
      address: '0x5678...1234',
      name: 'SuiWarrior',
      wins: 35,
      losses: 10,
      creatures: 5,
      highestPower: 168,
    },
    {
      id: '4',
      address: '0x4321...8765',
      name: 'NFTCollector',
      wins: 30,
      losses: 18,
      creatures: 12,
      highestPower: 155,
    },
    {
      id: '5',
      address: '0x9876...5432',
      name: 'CryptoGamer',
      wins: 28,
      losses: 22,
      creatures: 7,
      highestPower: 145,
    },
  ];
  
  const sampleCreatures = [
    {
      id: '1',
      name: 'Dragonite',
      type: 'Dragon',
      level: 10,
      power: 185,
      owner: 'CryptoChampion',
      wins: 28,
      losses: 4,
    },
    {
      id: '2',
      name: 'Thunderstrike',
      type: 'Electric',
      level: 9,
      power: 172,
      owner: 'BlockchainMaster',
      wins: 25,
      losses: 6,
    },
    {
      id: '3',
      name: 'Inferno',
      type: 'Fire',
      level: 8,
      power: 168,
      owner: 'SuiWarrior',
      wins: 22,
      losses: 5,
    },
    {
      id: '4',
      name: 'Tsunami',
      type: 'Water',
      level: 8,
      power: 165,
      owner: 'CryptoChampion',
      wins: 20,
      losses: 7,
    },
    {
      id: '5',
      name: 'Earthquake',
      type: 'Earth',
      level: 7,
      power: 155,
      owner: 'NFTCollector',
      wins: 18,
      losses: 8,
    },
  ];
  
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // In a real implementation, you would fetch leaderboard data from the blockchain
        // For now, we'll use sample data
        setTimeout(() => {
          setLeaderboardData(activeTab === 'players' ? samplePlayers : sampleCreatures);
          setIsLoading(false);
        }, 1000); // Simulate loading
      } catch (err) {
        console.error('Error fetching leaderboard data:', err);
        setError('Failed to load leaderboard data. Please try again.');
        setIsLoading(false);
      }
    };
    
    fetchLeaderboardData();
  }, [activeTab, wallet]);
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const renderPlayerLeaderboard = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-background/50">
            <th className="p-3 text-left">Rank</th>
            <th className="p-3 text-left">Player</th>
            <th className="p-3 text-center">Wins</th>
            <th className="p-3 text-center">Losses</th>
            <th className="p-3 text-center">Win Rate</th>
            <th className="p-3 text-center">Creatures</th>
            <th className="p-3 text-center">Highest Power</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((player, index) => {
            const winRate = ((player.wins / (player.wins + player.losses)) * 100).toFixed(1);
            return (
              <tr key={player.id} className="border-b border-gray-700">
                <td className="p-3">
                  <span className={`font-bold ${index < 3 ? 'text-primary' : ''}`}>{index + 1}</span>
                </td>
                <td className="p-3">
                  <div className="font-bold">{player.name}</div>
                  <div className="text-sm text-gray-400">{player.address}</div>
                </td>
                <td className="p-3 text-center">{player.wins}</td>
                <td className="p-3 text-center">{player.losses}</td>
                <td className="p-3 text-center">{winRate}%</td>
                <td className="p-3 text-center">{player.creatures}</td>
                <td className="p-3 text-center">{player.highestPower}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
  
  const renderCreatureLeaderboard = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-background/50">
            <th className="p-3 text-left">Rank</th>
            <th className="p-3 text-left">Creature</th>
            <th className="p-3 text-center">Type</th>
            <th className="p-3 text-center">Level</th>
            <th className="p-3 text-center">Power</th>
            <th className="p-3 text-left">Owner</th>
            <th className="p-3 text-center">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((creature, index) => {
            const winRate = ((creature.wins / (creature.wins + creature.losses)) * 100).toFixed(1);
            return (
              <tr key={creature.id} className="border-b border-gray-700">
                <td className="p-3">
                  <span className={`font-bold ${index < 3 ? 'text-primary' : ''}`}>{index + 1}</span>
                </td>
                <td className="p-3">
                  <div className="font-bold">{creature.name}</div>
                </td>
                <td className="p-3 text-center">{creature.type}</td>
                <td className="p-3 text-center">{creature.level}</td>
                <td className="p-3 text-center font-bold">{creature.power}</td>
                <td className="p-3">{creature.owner}</td>
                <td className="p-3 text-center">{winRate}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg text-red-500">
          {error}
        </div>
      )}
      
      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">SuiMon Leaderboard</h2>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => handleTabChange('players')}
              className={`px-4 py-2 rounded-md ${activeTab === 'players' ? 'bg-primary text-white' : 'bg-background hover:bg-background/80'}`}
            >
              Top Players
            </button>
            <button 
              onClick={() => handleTabChange('creatures')}
              className={`px-4 py-2 rounded-md ${activeTab === 'creatures' ? 'bg-primary text-white' : 'bg-background hover:bg-background/80'}`}
            >
              Top Creatures
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p>Loading leaderboard data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'players' ? renderPlayerLeaderboard() : renderCreatureLeaderboard()}
            
            {wallet.account && (
              <div className="mt-6 p-4 bg-background/50 rounded-lg">
                <h3 className="font-bold mb-2">Your Stats</h3>
                <p className="text-sm text-gray-400">Connect your wallet and battle with your creatures to appear on the leaderboard!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;