// import { useState, useEffect } from 'react';
// import ConnectButtonWrapper from './ConnectButtonWrapper.jsx';

// const BattleArena = ({ wallet }) => {
//   const [creatures, setCreatures] = useState([]);
//   const [selectedCreature, setSelectedCreature] = useState(null);
//   const [opponents, setOpponents] = useState([]);
//   const [selectedOpponent, setSelectedOpponent] = useState(null);
//   const [battleResult, setBattleResult] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [battleInProgress, setBattleInProgress] = useState(false);
  
//   // Using the wallet prop passed from App.jsx
  
//   // Sample creature data - in a real app, this would come from the blockchain
//   const sampleCreatures = [
//     {
//       id: '1',
//       name: 'Flamander',
//       type: 'Fire',
//       level: 5,
//       power: 120,
//       image: 'https://via.placeholder.com/150/FF4500/FFFFFF?text=Flamander',
//     },
//     {
//       id: '2',
//       name: 'Aquadrake',
//       type: 'Water',
//       level: 3,
//       power: 85,
//       image: 'https://via.placeholder.com/150/1E90FF/FFFFFF?text=Aquadrake',
//     },
//     {
//       id: '3',
//       name: 'Leafeon',
//       type: 'Plant',
//       level: 4,
//       power: 95,
//       image: 'https://th.bing.com/th/id/OIP._O24GCZcMOswRo8YUw2mwQHaHa?rs=1&pid=ImgDetMain',
//     },
//   ];
  
//   // Sample opponent data
//   const sampleOpponents = [
//     {
//       id: 'opp1',
//       name: 'Thunderbolt',
//       type: 'Electric',
//       level: 4,
//       power: 110,
//       image: 'https://via.placeholder.com/150/FFD700/000000?text=Thunderbolt',
//       owner: 'AI',
//     },
//     {
//       id: 'opp2',
//       name: 'Rockslide',
//       type: 'Earth',
//       level: 6,
//       power: 130,
//       image: 'https://via.placeholder.com/150/8B4513/FFFFFF?text=Rockslide',
//       owner: 'AI',
//     },
//     {
//       id: 'opp3',
//       name: 'Frostbite',
//       type: 'Ice',
//       level: 5,
//       power: 115,
//       image: 'https://via.placeholder.com/150/ADD8E6/000000?text=Frostbite',
//       owner: 'AI',
//     },
//   ];
  
//   useEffect(() => {
//     const fetchData = async () => {
//       if (!wallet.connected || !wallet.account) {
//         setCreatures([]);
//         setOpponents([]);
//         setIsLoading(false);
//         return;
//       }
      
//       setIsLoading(true);
//       setError('');
      
//       try {
//         // In a real implementation, you would fetch NFTs owned by the user
//         // For example:
//         // const nfts = await suiClient.getOwnedObjects({
//         //   owner: wallet.account.address,
//         //   options: { showContent: true },
//         // });
        
//         // For now, we'll use sample data
//         setTimeout(() => {
//           setCreatures(sampleCreatures);
//           setOpponents(sampleOpponents);
//           setIsLoading(false);
//         }, 1000); // Simulate loading
//       } catch (err) {
//         console.error('Error fetching data:', err);
//         setError('Failed to load battle data. Please try again.');
//         setIsLoading(false);
//       }
//     };
    
//     fetchData();
//   }, [wallet]); // Changed from currentAccount to wallet
  
//   const startBattle = () => {
//     if (!selectedCreature || !selectedOpponent) {
//       setError('Please select both your creature and an opponent');
//       return;
//     }
    
//     setError('');
//     setBattleInProgress(true);
    
//     // Simulate battle with some randomness
//     setTimeout(() => {
//       const playerPower = selectedCreature.power * (0.8 + Math.random() * 0.4); // 80-120% of power
//       const opponentPower = selectedOpponent.power * (0.8 + Math.random() * 0.4);
      
//       // Type advantages (simplified)
//       const typeAdvantages = {
//         Fire: ['Plant'],
//         Water: ['Fire'],
//         Plant: ['Water', 'Earth'],
//         Electric: ['Water'],
//         Earth: ['Electric'],
//         Ice: ['Plant'],
//       };
      
//       let playerBonus = 1;
//       let opponentBonus = 1;
      
//       // Check for type advantages
//       if (typeAdvantages[selectedCreature.type]?.includes(selectedOpponent.type)) {
//         playerBonus = 1.2; // 20% bonus
//       }
      
//       if (typeAdvantages[selectedOpponent.type]?.includes(selectedCreature.type)) {
//         opponentBonus = 1.2; // 20% bonus
//       }
      
//       const finalPlayerPower = playerPower * playerBonus;
//       const finalOpponentPower = opponentPower * opponentBonus;
      
//       const playerWins = finalPlayerPower > finalOpponentPower;
      
//       setBattleResult({
//         winner: playerWins ? selectedCreature : selectedOpponent,
//         playerPower: finalPlayerPower.toFixed(0),
//         opponentPower: finalOpponentPower.toFixed(0),
//         playerBonus,
//         opponentBonus,
//         xpGained: playerWins ? 10 : 5,
//         suiReward: playerWins ? 0.01 : 0,
//       });
      
//       setBattleInProgress(false);
//     }, 2000); // Simulate battle calculation time
//   };
  
//   const resetBattle = () => {
//     setSelectedCreature(null);
//     setSelectedOpponent(null);
//     setBattleResult(null);
//   };
  
//   // Render creature card
//   const CreatureCard = ({ creature, isSelected, onClick, isOpponent = false }) => (
//     <div 
//       onClick={onClick}
//       className={`bg-background p-4 rounded-lg shadow border ${isSelected ? 'border-primary border-2' : 'border-gray-700'} hover:border-primary transition-colors cursor-pointer`}
//     >
//       <div className="aspect-square mb-3 overflow-hidden rounded-md">
//         <img 
//           src={creature.image} 
//           alt={creature.name} 
//           className="w-full h-full object-cover"
//         />
//       </div>
//       <h3 className="text-lg font-bold">{creature.name}</h3>
//       <div className="flex justify-between mt-2">
//         <span className="text-sm">Type: {creature.type}</span>
//         <span className="text-sm">Level: {creature.level}</span>
//       </div>
//       <div className="mt-2">
//         <div className="flex justify-between items-center">
//           <span className="text-sm">Power:</span>
//           <span className="text-sm font-bold">{creature.power}</span>
//         </div>
//         <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
//           <div 
//             className="bg-primary h-2 rounded-full" 
//             style={{ width: `${Math.min(100, (creature.power / 200) * 100)}%` }}
//           ></div>
//         </div>
//       </div>
//       {isOpponent && (
//         <div className="mt-2 text-sm text-gray-400">
//           Owner: {creature.owner}
//         </div>
//       )}
//     </div>
//   );
  
//   return (
//     <div className="space-y-6">
//       {!wallet.account ? (
//         <div className="bg-surface p-6 rounded-lg shadow-lg text-center">
//           <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
//           <p className="mb-4">Please connect your wallet to access the Battle Arena.</p>
//           <ConnectButton className="bg-primary hover:bg-primary/80 px-4 py-2 rounded-md text-white" />
//         </div>
//       ) : isLoading ? (
//         <div className="bg-surface p-6 rounded-lg shadow-lg text-center">
//           <p>Loading battle data...</p>
//         </div>
//       ) : (
//         <>
//           {error && (
//             <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg text-red-500">
//               {error}
//             </div>
//           )}
          
//           {battleResult ? (
//             <div className="bg-surface p-6 rounded-lg shadow-lg">
//               <h2 className="text-xl font-bold mb-4 text-center">Battle Results</h2>
              
//               <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
//                 <div className="text-center">
//                   <h3 className="font-bold">{selectedCreature.name}</h3>
//                   <p>Power: {battleResult.playerPower}</p>
//                   {battleResult.playerBonus > 1 && (
//                     <p className="text-green-500">Type Advantage!</p>
//                   )}
//                 </div>
                
//                 <div className="text-center text-2xl font-bold">
//                   VS
//                 </div>
                
//                 <div className="text-center">
//                   <h3 className="font-bold">{selectedOpponent.name}</h3>
//                   <p>Power: {battleResult.opponentPower}</p>
//                   {battleResult.opponentBonus > 1 && (
//                     <p className="text-green-500">Type Advantage!</p>
//                   )}
//                 </div>
//               </div>
              
//               <div className="text-center mb-6">
//                 <h3 className="text-xl font-bold mb-2">
//                   {battleResult.winner.name === selectedCreature.name ? 'Victory!' : 'Defeat!'}
//                 </h3>
//                 <p className="text-lg">
//                   {battleResult.winner.name === selectedCreature.name 
//                     ? `Your ${selectedCreature.name} defeated ${selectedOpponent.name}!` 
//                     : `Your ${selectedCreature.name} was defeated by ${selectedOpponent.name}!`}
//                 </p>
//               </div>
              
//               <div className="bg-background p-4 rounded-lg mb-6">
//                 <h4 className="font-bold mb-2">Rewards:</h4>
//                 <p>XP Gained: {battleResult.xpGained}</p>
//                 {battleResult.suiReward > 0 && (
//                   <p>SUI Tokens: {battleResult.suiReward}</p>
//                 )}
//               </div>
              
//               <div className="text-center">
//                 <button 
//                   onClick={resetBattle}
//                   className="bg-primary hover:bg-primary/80 px-6 py-2 rounded-md text-white"
//                 >
//                   Battle Again
//                 </button>
//               </div>
//             </div>
//           ) : (
//             <div className="bg-surface p-6 rounded-lg shadow-lg">
//               <h2 className="text-xl font-bold mb-4">Battle Arena</h2>
              
//               <div className="mb-6">
//                 <h3 className="font-bold mb-3">Select Your Creature</h3>
//                 {creatures.length > 0 ? (
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     {creatures.map(creature => (
//                       <CreatureCard 
//                         key={creature.id}
//                         creature={creature}
//                         isSelected={selectedCreature?.id === creature.id}
//                         onClick={() => setSelectedCreature(creature)}
//                       />
//                     ))}
//                   </div>
//                 ) : (
//                   <p className="text-gray-400">You don't have any creatures yet</p>
//                 )}
//               </div>
              
//               <div className="mb-6">
//                 <h3 className="font-bold mb-3">Select Opponent</h3>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   {opponents.map(opponent => (
//                     <CreatureCard 
//                       key={opponent.id}
//                       creature={opponent}
//                       isSelected={selectedOpponent?.id === opponent.id}
//                       onClick={() => setSelectedOpponent(opponent)}
//                       isOpponent
//                     />
//                   ))}
//                 </div>
//               </div>
              
//               <div className="text-center">
//                 <button 
//                   onClick={startBattle}
//                   disabled={!selectedCreature || !selectedOpponent || battleInProgress}
//                   className={`bg-primary hover:bg-primary/80 px-6 py-2 rounded-md text-white ${(!selectedCreature || !selectedOpponent || battleInProgress) ? 'opacity-50 cursor-not-allowed' : ''}`}
//                 >
//                   {battleInProgress ? 'Battle in Progress...' : 'Start Battle'}
//                 </button>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// };

// export default BattleArena;

// components/BattleArena.jsx
import React, { useEffect, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useWallet } from '@suiet/wallet-kit';
import { getOwnedCreatureNfts } from '../utils/nftutils';
import { Transaction } from '@mysten/sui/transactions';
import { sendTransaction } from '../utils/transaction';
import { PACKAGE_ID } from '../lib/constants';
import { bcs } from '@mysten/sui/bcs';

// 3D Model that animates based on victory state
const CreatureModel = ({ isWinner }) => {
  const color = isWinner ? 'limegreen' : 'crimson';
  const bounce = isWinner ? 0.3 : 0;

  return (
    <group>
      <mesh position={[0, bounce, 0]} scale={isWinner ? 1.2 : 1}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

const BattleArena = () => {
  const { account, signAndExecuteTransactionBlock } = useWallet();
  const [creatures, setCreatures] = useState([]);
  const [selected, setSelected] = useState(null);
  const [battleResult, setBattleResult] = useState(null);
  const [isWinner, setIsWinner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (account?.address) {
      getOwnedCreatureNfts(account.address)
        .then(nfts => {
          console.log("Fetched NFTs:", nfts);
          setCreatures(nfts);
        })
        .catch(err => {
          console.error("Error fetching NFTs:", err);
          setError("Failed to load your creatures. Please try again.");
        });
    }
  }, [account]);

  const handleCreatureSelect = (creature) => {
    console.log("Creature clicked:", creature);
    setSelected(creature);
    setBattleResult(null);
    setIsWinner(false);
    setError(null); // Clear any previous errors
  };

  const handleBattle = async () => {
    if (!selected) {
      console.log("No creature selected for battle");
      return;
    }
    
    if (loading) {
      console.log("Battle already in progress");
      return;
    }

    console.log("Starting battle with creature:", selected);
    
    // Clear previous results
    setBattleResult(null);
    setError(null);
    
    // Set loading state
    setLoading(true);
    
    try {
      // Simple random battle outcome for demo
      const didWin = Math.random() > 0.5;
      console.log("Battle result - Win:", didWin);
      
      setIsWinner(didWin);
      setBattleResult(didWin ? '🎉 Victory! XP awarded!' : '💀 Defeat! Try again!');
      
      if (didWin) {
        try {
          console.log("Awarding XP via transaction");
          const tx = new Transaction();
          
          // Properly serialize the XP amount (10) as a u64
          // Option 1: Using bcs.U64
          tx.moveCall({
            target: `${PACKAGE_ID}::battle::award_xp`,
            arguments: [
              tx.object(selected.id), 
              tx.pure(10, 'u64') // Specify the BCS type as 'u64'
            ],
          });

          await sendTransaction({ tx, signAndExecuteTransactionBlock });
          console.log("XP awarded successfully");
          
          // Update the creature's XP locally for immediate feedback
          setCreatures(prev => 
            prev.map(creature => 
              creature.id === selected.id 
                ? { ...creature, xp: (creature.xp || 0) + 10 }
                : creature
            )
          );
        } catch (err) {
          console.error('Error awarding XP:', err);
          setError(`Failed to award XP: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('Battle error:', err);
      setError(`Battle error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-4xl font-extrabold mb-6 text-purple-700">⚔️ SuiMon Battle Arena</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {creatures.length === 0 && !error ? (
          <div className="col-span-3 text-center py-10">
            <p>Loading your creatures...</p>
          </div>
        ) : (
          creatures.map((creature) => (
            <div
              key={creature.id}
              onClick={() => handleCreatureSelect(creature)}
              className={`cursor-pointer p-4 rounded-xl shadow-md transition-all transform hover:scale-105 ${
                selected?.id === creature.id ? 'border-4 border-green-500' : 'border border-gray-300'
              }`}
            >
              <img 
                src={creature.imageUrl || "/api/placeholder/200/200"} 
                alt="NFT" 
                className="w-full rounded mb-2" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/api/placeholder/200/200";
                }}
              />
              <p className="font-bold">{creature.name || `Creature #${creature.id.slice(0, 6)}`}</p>
              <p>ID: {creature.id.slice(0, 12)}...</p>
              <p>XP: {creature.xp || 0}</p>
            </div>
          ))
        )}
      </div>

      {selected && (
        <div className="mt-6">
          <p className="mb-4">Selected: {selected.name || `Creature #${selected.id.slice(0, 6)}`}</p>
          <button
            onClick={handleBattle}
            disabled={loading}
            className={`px-8 py-3 text-lg rounded-xl text-white transition ${
              loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading ? "Fighting..." : "⚔️ Fight!"}
          </button>
        </div>
      )}

      {battleResult && (
        <>
          <p className="mt-6 text-2xl font-semibold">{battleResult}</p>

          <div className="h-72 w-full mt-4 border rounded-xl overflow-hidden shadow-inner">
            <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[2, 5, 2]} />
              <Suspense fallback={null}>
                <CreatureModel isWinner={isWinner} />
              </Suspense>
              <OrbitControls enableZoom={false} />
            </Canvas>
          </div>
        </>
      )}
    </div>
  );
};

export default BattleArena;