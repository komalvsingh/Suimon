import React, { useState, useEffect, useCallback } from "react";
import { SuiClient } from "@mysten/sui.js/client";

// Initialize Sui client for testnet
const TESTNET_CLIENT = new SuiClient({
  url: "https://fullnode.testnet.sui.io",
});

// Contract address from your BattleArena.js
const CONTRACT_ADDRESS = "0x70217963607936caee034ce016fb2e9be0debc644d13a6ac40d955940e1066a7";

// XP Constants from your GameBoard.js
const XP_LEVELS = [
  { level: 1, xpRequired: 0, reward: "Basic Card Pack" },
  { level: 2, xpRequired: 25, reward: "1 Rare Card" },
  { level: 3, xpRequired: 75, reward: "Standard Card Pack" },
  { level: 4, xpRequired: 150, reward: "2 Rare Cards" },
  { level: 5, xpRequired: 300, reward: "Elite Card Pack" },
  { level: 6, xpRequired: 500, reward: "1 Ultra Rare Card" },
  { level: 7, xpRequired: 750, reward: "Premium Card Pack" },
  { level: 8, xpRequired: 1000, reward: "2 Ultra Rare Cards" },
  { level: 9, xpRequired: 1500, reward: "Master Card Pack" },
  { level: 10, xpRequired: 2500, reward: "Legendary Card" }
];

const DynamicGameLeaderboard = ({ wallet }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [userStats, setUserStats] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to calculate level from XP (same as your GameBoard.js)
  const calculateLevel = (currentXp) => {
    let playerLevel = 1;
    let nextLevelXp = 0;
    let reward = "";

    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
      if (currentXp >= XP_LEVELS[i].xpRequired) {
        playerLevel = XP_LEVELS[i].level;
        nextLevelXp = i < XP_LEVELS.length - 1 ? XP_LEVELS[i + 1].xpRequired : null;
        reward = XP_LEVELS[i].reward;
        break;
      }
    }

    return {
      level: playerLevel,
      nextLevelXp: nextLevelXp !== null ? nextLevelXp - currentXp : "MAX",
      reward
    };
  };

  // Helper function to get rank badge color
  const getRankBadgeColor = (rank) => {
    if (rank === 1) return "bg-yellow-500 text-yellow-900"; // Gold
    if (rank === 2) return "bg-gray-400 text-gray-900"; // Silver
    if (rank === 3) return "bg-amber-600 text-amber-100"; // Bronze
    return "bg-blue-500 text-blue-100"; // Default
  };

  // Helper function to get trainer rank based on level
  const getTrainerRank = (level) => {
    if (level <= 3) return "Rookie Trainer";
    if (level <= 5) return "Skilled Trainer";
    if (level <= 7) return "Expert Trainer";
    if (level <= 9) return "Master Trainer";
    return "Pokémon Champion";
  };

  // Fetch all XP data from blockchain
  const fetchLeaderboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      console.log("Fetching XP events from blockchain...");
      
      // Get recent XP gain events from your trainCreature function
      const events = await TESTNET_CLIENT.queryEvents({
        query: {
          MoveEventType: `${CONTRACT_ADDRESS}::starter_nft::ExperienceGained`,
        },
        limit: 200, // Increased limit to get more data
        order: "descending"
      });

      console.log(`Found ${events.data.length} XP events`);
      
      // DEBUG: Log the first few events to see their structure
      if (events.data.length > 0) {
        console.log("First event structure:", JSON.stringify(events.data[0], null, 2));
        console.log("First event parsedJson:", events.data[0].parsedJson);
      }

      // Create a map to track total XP for each player
      const playerXpMap = new Map();
      const playerCreatureCount = new Map();
      const playerWinCount = new Map();

      // Process events to extract player XP data
      for (const event of events.data) {
        const fields = event.parsedJson;
        console.log("Event fields:", fields); // DEBUG: Log each event's fields
        if (!fields || !fields.owner) continue;

        const owner = fields.owner;
        const xpGained = parseInt(fields.amount) || 0;

        // Add XP to player's total
        if (playerXpMap.has(owner)) {
          playerXpMap.set(owner, playerXpMap.get(owner) + xpGained);
        } else {
          playerXpMap.set(owner, xpGained);
        }

        // Count unique creatures per player
        if (fields.creature_id) {
          const creatureKey = `${owner}-${fields.creature_id}`;
          if (!playerCreatureCount.has(owner)) {
            playerCreatureCount.set(owner, new Set());
          }
          playerCreatureCount.get(owner).add(fields.creature_id);
        }
      }

      // Also get local storage data for current user if wallet is connected
      let localPlayerData = null;
      if (wallet?.account?.address) {
        const localXP = parseInt(localStorage.getItem("playerXP")) || 0;
        const localWins = parseInt(localStorage.getItem("wins")) || 0;
        const localLosses = parseInt(localStorage.getItem("losses")) || 0;
        const gymBadges = parseInt(localStorage.getItem("gymBadges")) || 0;
        
        localPlayerData = {
          address: wallet.account.address,
          xp: localXP,
          wins: localWins,
          losses: localLosses,
          gymBadges: gymBadges,
          source: "local"
        };
      }

      // Convert maps to leaderboard array
      const playersArray = [];
      
      for (const [address, totalXp] of playerXpMap.entries()) {
        const creatureCount = playerCreatureCount.get(address)?.size || 0;
        const levelInfo = calculateLevel(totalXp);
        
        playersArray.push({
          address: address,
          name: `Player ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
          xp: totalXp,
          level: levelInfo.level,
          nextLevelXp: levelInfo.nextLevelXp,
          reward: levelInfo.reward,
          trainerRank: getTrainerRank(levelInfo.level),
          creatures: creatureCount,
          wins: 0, // This would need separate tracking in your smart contract
          losses: 0, // This would need separate tracking in your smart contract
          gymBadges: 0, // This would need separate tracking in your smart contract
          source: "blockchain"
        });
      }

      // Add local player data if they're not in blockchain data
      if (localPlayerData) {
        const existingPlayer = playersArray.find(p => 
          p.address.toLowerCase() === localPlayerData.address.toLowerCase()
        );
        
        if (!existingPlayer) {
          const levelInfo = calculateLevel(localPlayerData.xp);
          playersArray.push({
            address: localPlayerData.address,
            name: `You (${localPlayerData.address.substring(0, 6)}...)`,
            xp: localPlayerData.xp,
            level: levelInfo.level,
            nextLevelXp: levelInfo.nextLevelXp,
            reward: levelInfo.reward,
            trainerRank: getTrainerRank(levelInfo.level),
            creatures: 0,
            wins: localPlayerData.wins,
            losses: localPlayerData.losses,
            gymBadges: localPlayerData.gymBadges,
            source: "local"
          });
        } else {
          // Update existing player with local data
          existingPlayer.wins = localPlayerData.wins;
          existingPlayer.losses = localPlayerData.losses;
          existingPlayer.gymBadges = localPlayerData.gymBadges;
          existingPlayer.name = `You (${localPlayerData.address.substring(0, 6)}...)`;
          // Use higher XP value between blockchain and local
          if (localPlayerData.xp > existingPlayer.xp) {
            existingPlayer.xp = localPlayerData.xp;
            const levelInfo = calculateLevel(localPlayerData.xp);
            existingPlayer.level = levelInfo.level;
            existingPlayer.nextLevelXp = levelInfo.nextLevelXp;
            existingPlayer.reward = levelInfo.reward;
            existingPlayer.trainerRank = getTrainerRank(levelInfo.level);
          }
        }
      }

      // Sort by XP descending
      const sortedPlayers = playersArray.sort((a, b) => b.xp - a.xp);

      // Update state
      setLeaderboardData(sortedPlayers);

      // Set user stats if wallet is connected
      if (wallet?.account?.address) {
        const userPlayer = sortedPlayers.find(p => 
          p.address.toLowerCase() === wallet.account.address.toLowerCase()
        );
        setUserStats(userPlayer || null);
      }

      setLastRefreshed(new Date());
      setError("");
      console.log(`Leaderboard updated with ${sortedPlayers.length} players`);

    } catch (err) {
      console.error("Error fetching leaderboard data:", err);
      setError(`Failed to load leaderboard: ${err.message}`);
      
      // Fallback to local data only
      if (wallet?.account?.address) {
        const localXP = parseInt(localStorage.getItem("playerXP")) || 0;
        const localWins = parseInt(localStorage.getItem("wins")) || 0;
        const localLosses = parseInt(localStorage.getItem("losses")) || 0;
        const gymBadges = parseInt(localStorage.getItem("gymBadges")) || 0;
        
        const levelInfo = calculateLevel(localXP);
        const localPlayer = {
          address: wallet.account.address,
          name: `You (Local Data)`,
          xp: localXP,
          level: levelInfo.level,
          nextLevelXp: levelInfo.nextLevelXp,
          reward: levelInfo.reward,
          trainerRank: getTrainerRank(levelInfo.level),
          creatures: 0,
          wins: localWins,
          losses: localLosses,
          gymBadges: gymBadges,
          source: "local"
        };
        
        setLeaderboardData([localPlayer]);
        setUserStats(localPlayer);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [wallet]);

  // Initial data fetch and interval setup
  useEffect(() => {
    fetchLeaderboardData();

    const intervalId = setInterval(() => {
      fetchLeaderboardData();
    }, refreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [fetchLeaderboardData, refreshInterval]);

  // Handle manual refresh
  const handleRefresh = () => {
    fetchLeaderboardData();
  };

  // Format time since last refresh
  const formatTimeSince = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  };

  // Get XP progress percentage for progress bar
  const getXpProgressPercentage = (player) => {
    if (player.nextLevelXp === "MAX") return 100;
    
    const currentLevelObj = XP_LEVELS.find(l => l.level === player.level);
    const nextLevelObj = XP_LEVELS.find(l => l.level === player.level + 1);
    
    if (!nextLevelObj) return 100;
    
    const levelMinXp = currentLevelObj.xpRequired;
    const xpRange = nextLevelObj.xpRequired - levelMinXp;
    const playerProgress = player.xp - levelMinXp;
    
    return Math.min(100, Math.round((playerProgress / xpRange) * 100));
  };

  if (isLoading && leaderboardData.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leaderboard from blockchain...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">🏆 Pokémon Trainers Leaderboard</h1>
              <p className="text-blue-100">Top trainers ranked by experience points</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <svg
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white"
              >
                <option value="10" className="text-gray-800">10s</option>
                <option value="30" className="text-gray-800">30s</option>
                <option value="60" className="text-gray-800">1m</option>
                <option value="300" className="text-gray-800">5m</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-blue-200 mt-4">
            Last updated: {formatTimeSince(lastRefreshed)} • Auto-refreshes every {refreshInterval}s
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* User Stats Card */}
        {userStats && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 border-b">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Your Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">Level & Rank</div>
                <div className="text-2xl font-bold text-blue-600">{userStats.level}</div>
                <div className="text-sm text-gray-600">{userStats.trainerRank}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Rank #{leaderboardData.findIndex(p => p.address === userStats.address) + 1} of {leaderboardData.length}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">Experience Points</div>
                <div className="text-2xl font-bold text-purple-600">{userStats.xp.toLocaleString()}</div>
                {userStats.nextLevelXp !== "MAX" && (
                  <div className="text-xs text-gray-500 mt-1">
                    {userStats.nextLevelXp} XP to next level
                  </div>
                )}
                {/* XP Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getXpProgressPercentage(userStats)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">Battle Record</div>
                <div className="text-lg font-bold text-green-600">
                  {userStats.wins}W - {userStats.losses}L
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {userStats.wins + userStats.losses > 0 ? 
                    `${((userStats.wins / (userStats.wins + userStats.losses)) * 100).toFixed(1)}% win rate` : 
                    'No battles yet'
                  }
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">Progress</div>
                <div className="text-lg font-bold text-yellow-600">
                  {userStats.gymBadges} Gym Badges
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {userStats.creatures} Creatures Trained
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trainer
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experience
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Battles
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Badges
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaderboardData.map((player, index) => {
                const rank = index + 1;
                const winRate = player.wins + player.losses > 0 ? 
                  ((player.wins / (player.wins + player.losses)) * 100).toFixed(1) : '0.0';
                const isCurrentUser = wallet?.account?.address?.toLowerCase() === player.address.toLowerCase();
                
                return (
                  <tr 
                    key={player.address} 
                    className={`hover:bg-gray-50 ${isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankBadgeColor(rank)}`}>
                          {rank}
                        </span>
                        {rank <= 3 && (
                          <span className="ml-2 text-lg">
                            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {player.name}
                          {isCurrentUser && <span className="ml-2 text-blue-600 font-bold">(You)</span>}
                        </div>
                        <div className="text-xs text-gray-500">
                          {player.address.substring(0, 10)}...{player.address.substring(player.address.length - 6)}
                        </div>
                        <div className="text-xs text-indigo-600 font-medium">{player.trainerRank}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        Level {player.level}
                      </span>
                      {player.nextLevelXp !== "MAX" && (
                        <div className="text-xs text-gray-500 mt-1">
                          {player.nextLevelXp} XP to next
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {player.xp.toLocaleString()}
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2 mx-auto mt-1">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${getXpProgressPercentage(player)}%` }}
                        ></div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">
                        <span className="text-green-600 font-medium">{player.wins}W</span>
                        {' - '}
                        <span className="text-red-600 font-medium">{player.losses}L</span>
                      </div>
                      <div className="text-xs text-gray-500">{winRate}% win rate</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-lg font-bold text-yellow-600">{player.gymBadges}</span>
                        <span className="text-lg">🏅</span>
                      </div>
                      {player.creatures > 0 && (
                        <div className="text-xs text-gray-500">{player.creatures} creatures</div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        player.source === 'blockchain' ? 
                          'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'
                      }`}>
                        {player.source === 'blockchain' ? '⛓️ Chain' : '💾 Local'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {leaderboardData.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trainers found</h3>
              <p className="text-gray-500">Be the first to start your Pokémon journey and earn XP!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              Showing {leaderboardData.length} trainer{leaderboardData.length !== 1 ? 's' : ''}
            </div>
            <div>
              Data from blockchain + local storage
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicGameLeaderboard;