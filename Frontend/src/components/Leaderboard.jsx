"use client"

import { useState, useEffect, useCallback } from "react"
import { SuiClient } from "@mysten/sui.js/client"
import { ConnectButton } from "@suiet/wallet-kit"
import { LazyLoadImage } from "react-lazy-load-image-component"

// Initialize Sui client for testnet
const TESTNET_CLIENT = new SuiClient({
  url: "https://fullnode.testnet.sui.io",
})

// Contract address from BattleArena.js
const CONTRACT_ADDRESS = "0x70217963607936caee034ce016fb2e9be0debc644d13a6ac40d955940e1066a7"

// XP Constants for level calculation
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
  { level: 10, xpRequired: 2500, reward: "Legendary Card" },
]

const Leaderboard = ({ wallet }) => {
  const [leaderboardData, setLeaderboardData] = useState([])
  const [creatureLeaderboard, setCreatureLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("players") // 'players' or 'creatures'
  const [userStats, setUserStats] = useState(null)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Helper function to calculate level from XP
  const calculateLevelFromXP = (xp) => {
    let playerLevel = 1
    let nextLevelXp = 0
    let reward = ""

    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
      if (xp >= XP_LEVELS[i].xpRequired) {
        playerLevel = XP_LEVELS[i].level
        nextLevelXp = i < XP_LEVELS.length - 1 ? XP_LEVELS[i + 1].xpRequired : null
        reward = XP_LEVELS[i].reward
        break
      }
    }

    return {
      level: playerLevel,
      nextLevelXp: nextLevelXp !== null ? nextLevelXp - xp : "MAX",
      reward,
    }
  }

  // Helper function to get element type color
  const getTypeColor = (type) => {
    switch (type) {
      case "nature":
        return "bg-green-500/20 text-green-500"
      case "flame":
        return "bg-red-500/20 text-red-500"
      case "aqua":
        return "bg-blue-500/20 text-blue-500"
      default:
        return "bg-gray-500/20 text-gray-500"
    }
  }

  // Helper function to get element type based on ID
  const getElementType = (id) => {
    const numId = Number.parseInt(id)
    if (numId >= 1 && numId <= 3) return "nature"
    if (numId >= 4 && numId <= 6) return "flame"
    if (numId >= 7 && numId <= 9) return "aqua"
    return "normal"
  }

  // Fetch all creatures from blockchain
  const fetchAllCreatures = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Get recent events related to XP gain
      const events = await TESTNET_CLIENT.queryEvents({
        query: {
          MoveEventType: `${CONTRACT_ADDRESS}::starter_nft::ExperienceGained`,
        },
        limit: 100, // Adjust as needed
      })

      // Create a map to track the latest XP for each creature
      const creatureMap = new Map()

      // Process events to extract creature data
      for (const event of events.data) {
        const fields = event.parsedJson
        if (!fields) continue

        const creatureId = fields.creature_id
        const xpGained = Number.parseInt(fields.amount) || 0
        const owner = fields.owner

        // If we haven't seen this creature before or this is a newer event
        if (!creatureMap.has(creatureId)) {
          // Fetch the creature details
          try {
            const creatureObj = await TESTNET_CLIENT.getObject({
              id: creatureId,
              options: {
                showContent: true,
                showDisplay: true,
              },
            })

            if (creatureObj.data) {
              const content = creatureObj.data.content?.fields || {}
              const display = creatureObj.data.display?.data?.fields || {}

              creatureMap.set(creatureId, {
                id: creatureId,
                name: content.name || display.name || "Unnamed Creature",
                image: content.image_url || display.image_url || "",
                experience: Number.parseInt(content.experience) || 0,
                level: Number.parseInt(content.evolution_stage) || 0,
                power: Number.parseInt(content.power) || Number.parseInt(content.experience) || 0,
                elementType: getElementType(content.pokemon_id || 0),
                owner: owner,
                wins: Number.parseInt(content.wins) || 0,
                losses: Number.parseInt(content.losses) || 0,
              })
            }
          } catch (err) {
            console.error(`Error fetching creature ${creatureId}:`, err)
          }
        }
      }

      // Convert map to array and sort by experience
      const creaturesArray = Array.from(creatureMap.values())
      const sortedCreatures = creaturesArray.sort((a, b) => b.experience - a.experience)

      // Group creatures by owner to create player leaderboard
      const playerMap = new Map()
      for (const creature of sortedCreatures) {
        if (!creature.owner) continue

        if (!playerMap.has(creature.owner)) {
          playerMap.set(creature.owner, {
            address: creature.owner,
            name: `Player ${creature.owner.substring(0, 6)}...`,
            xp: creature.experience,
            wins: creature.wins,
            losses: creature.losses,
            creatures: 1,
            highestPower: creature.power,
          })
        } else {
          const player = playerMap.get(creature.owner)
          player.xp += creature.experience
          player.wins += creature.wins
          player.losses += creature.losses
          player.creatures += 1
          player.highestPower = Math.max(player.highestPower, creature.power)
          playerMap.set(creature.owner, player)
        }
      }

      // Convert player map to array and sort by XP
      const playersArray = Array.from(playerMap.values())
      const sortedPlayers = playersArray.sort((a, b) => b.xp - a.xp)

      // Update state with sorted data
      setCreatureLeaderboard(sortedCreatures)
      setLeaderboardData(sortedPlayers)

      // Update user stats if wallet is connected
      if (wallet?.account?.address) {
        const userAddress = wallet.account.address
        const userInLeaderboard = sortedPlayers.find(
          (player) => player.address.toLowerCase() === userAddress.toLowerCase(),
        )

        if (userInLeaderboard) {
          const levelInfo = calculateLevelFromXP(userInLeaderboard.xp)
          setUserStats({
            ...userInLeaderboard,
            level: levelInfo.level,
            nextLevelXp: levelInfo.nextLevelXp,
            reward: levelInfo.reward,
          })
        } else {
          // Get user XP from localStorage as fallback
          const userXP = Number.parseInt(localStorage.getItem("playerXP")) || 0
          const levelInfo = calculateLevelFromXP(userXP)

          setUserStats({
            address: userAddress,
            name: `Player ${userAddress.substring(0, 6)}...`,
            xp: userXP,
            wins: 0,
            losses: 0,
            creatures: 0,
            highestPower: 0,
            level: levelInfo.level,
            nextLevelXp: levelInfo.nextLevelXp,
            reward: levelInfo.reward,
          })
        }
      }

      setLastRefreshed(new Date())
      setError("")
    } catch (err) {
      console.error("Error fetching blockchain data:", err)
      setError(`Failed to load leaderboard data: ${err.message}`)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [wallet])

  // Initial data fetch
  useEffect(() => {
    fetchAllCreatures()

    // Set up interval for periodic refreshes
    const intervalId = setInterval(() => {
      fetchAllCreatures()
    }, refreshInterval * 1000)

    // Clean up interval on unmount
    return () => clearInterval(intervalId)
  }, [fetchAllCreatures, refreshInterval])

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  // Handle manual refresh
  const handleRefresh = () => {
    fetchAllCreatures()
  }

  // Change refresh interval
  const handleRefreshIntervalChange = (e) => {
    setRefreshInterval(Number.parseInt(e.target.value))
  }

  // Format time since last refresh
  const formatTimeSince = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
  }

  // Render player leaderboard
  const renderPlayerLeaderboard = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-background/50">
            <th className="p-3 text-left">Rank</th>
            <th className="p-3 text-left">Player</th>
            <th className="p-3 text-center">Level</th>
            <th className="p-3 text-center">Total XP</th>
            <th className="p-3 text-center">Wins</th>
            <th className="p-3 text-center">Losses</th>
            <th className="p-3 text-center">Win Rate</th>
            <th className="p-3 text-center">Creatures</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((player, index) => {
            const winRate =
              player.wins + player.losses > 0 ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(1) : "0.0"
            const levelInfo = calculateLevelFromXP(player.xp)

            return (
              <tr key={player.address} className="border-b border-gray-700">
                <td className="p-3">
                  <span className={`font-bold ${index < 3 ? "text-primary" : ""}`}>{index + 1}</span>
                </td>
                <td className="p-3">
                  <div className="font-bold">{player.name}</div>
                  <div className="text-sm text-gray-400">{player.address.substring(0, 10)}...</div>
                </td>
                <td className="p-3 text-center">
                  <span className="bg-primary/20 text-primary px-2 py-1 rounded-full">{levelInfo.level}</span>
                </td>
                <td className="p-3 text-center font-bold">{player.xp}</td>
                <td className="p-3 text-center">{player.wins}</td>
                <td className="p-3 text-center">{player.losses}</td>
                <td className="p-3 text-center">{winRate}%</td>
                <td className="p-3 text-center">{player.creatures}</td>
              </tr>
            )
          })}
          {leaderboardData.length === 0 && !isLoading && (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-400">
                No player data found. Be the first to train your creatures!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

  // Render creature leaderboard
  const renderCreatureLeaderboard = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-background/50">
            <th className="p-3 text-left">Rank</th>
            <th className="p-3 text-left">Creature</th>
            <th className="p-3 text-center">Type</th>
            <th className="p-3 text-center">Level</th>
            <th className="p-3 text-center">XP</th>
            <th className="p-3 text-center">Power</th>
            <th className="p-3 text-left">Owner</th>
            <th className="p-3 text-center">Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {creatureLeaderboard.map((creature, index) => {
            const winRate =
              creature.wins + creature.losses > 0
                ? ((creature.wins / (creature.wins + creature.losses)) * 100).toFixed(1)
                : "0.0"
            const levelInfo = calculateLevelFromXP(creature.experience)
            const typeClass = getTypeColor(creature.elementType)

            return (
              <tr key={creature.id} className="border-b border-gray-700">
                <td className="p-3">
                  <span className={`font-bold ${index < 3 ? "text-primary" : ""}`}>{index + 1}</span>
                </td>
                <td className="p-3">
                  <div className="flex items-center">
                    {creature.image && (
                      <div className="w-10 h-10 mr-3 rounded-full overflow-hidden bg-background/30">
                        <LazyLoadImage
                          src={creature.image}
                          alt={creature.name}
                          className="w-full h-full object-cover"
                          effect="blur"
                        />
                      </div>
                    )}
                    <div className="font-bold">{creature.name}</div>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs ${typeClass}`}>{creature.elementType}</span>
                </td>
                <td className="p-3 text-center">
                  <span className="bg-primary/20 text-primary px-2 py-1 rounded-full">{levelInfo.level}</span>
                </td>
                <td className="p-3 text-center font-bold">{creature.experience}</td>
                <td className="p-3 text-center">{creature.power}</td>
                <td className="p-3">
                  <div className="text-sm">{creature.owner ? creature.owner.substring(0, 10) + "..." : "Unknown"}</div>
                </td>
                <td className="p-3 text-center">{winRate}%</td>
              </tr>
            )
          })}
          {creatureLeaderboard.length === 0 && !isLoading && (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-400">
                No creature data found. Train your creatures to see them here!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

  // Render user stats
  const renderUserStats = () => {
    if (!userStats) return null

    const winRate =
      userStats.wins + userStats.losses > 0
        ? ((userStats.wins / (userStats.wins + userStats.losses)) * 100).toFixed(1)
        : "0.0"

    // Find user rank
    const userRank =
      leaderboardData.findIndex((player) => player.address.toLowerCase() === wallet.account.address.toLowerCase()) + 1

    return (
      <div className="mt-6 p-4 bg-background/50 rounded-lg">
        <h3 className="font-bold mb-4">Your Stats</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-background/70 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Level</div>
            <div className="text-xl font-bold flex items-center">
              <span className="bg-primary/20 text-primary px-2 py-1 rounded-full mr-2">{userStats.level}</span>
              {userStats.nextLevelXp !== "MAX" && (
                <span className="text-sm text-gray-400">({userStats.nextLevelXp} XP to next level)</span>
              )}
            </div>
            {userStats.reward && <div className="text-xs text-gray-400 mt-1">Next reward: {userStats.reward}</div>}
          </div>

          <div className="bg-background/70 p-3 rounded-lg">
            <div className="text-sm text-gray-400">XP & Rank</div>
            <div className="text-xl font-bold">{userStats.xp} XP</div>
            {userRank > 0 && (
              <div className="text-sm text-gray-400">
                Rank #{userRank} of {leaderboardData.length}
              </div>
            )}
          </div>

          <div className="bg-background/70 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Win Rate</div>
            <div className="text-xl font-bold">{winRate}%</div>
            <div className="text-sm text-gray-400">
              {userStats.wins} W / {userStats.losses} L
            </div>
          </div>

          <div className="bg-background/70 p-3 rounded-lg">
            <div className="text-sm text-gray-400">Creatures</div>
            <div className="text-xl font-bold">{userStats.creatures}</div>
            {userStats.highestPower > 0 && (
              <div className="text-sm text-gray-400">Highest Power: {userStats.highestPower}</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg text-red-500">{error}</div>}

      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold">SuiMon Leaderboard</h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex space-x-2">
              <button
                onClick={() => handleTabChange("players")}
                className={`px-4 py-2 rounded-md ${
                  activeTab === "players" ? "bg-primary text-white" : "bg-background hover:bg-background/80"
                }`}
              >
                Top Players
              </button>
              <button
                onClick={() => handleTabChange("creatures")}
                className={`px-4 py-2 rounded-md ${
                  activeTab === "creatures" ? "bg-primary text-white" : "bg-background hover:bg-background/80"
                }`}
              >
                Top Creatures
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="px-3 py-2 rounded-md bg-background hover:bg-background/80 flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
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
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
              <select
                value={refreshInterval}
                onChange={handleRefreshIntervalChange}
                className="px-2 py-2 rounded-md bg-background border border-gray-700"
              >
                <option value="10">10s</option>
                <option value="30">30s</option>
                <option value="60">1m</option>
                <option value="300">5m</option>
              </select>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-400 mb-4">
          Last updated: {formatTimeSince(lastRefreshed)} • Auto-refreshes every {refreshInterval} seconds
        </div>

        {isLoading && leaderboardData.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading blockchain data...</p>
          </div>
        ) : (
          <>
            {activeTab === "players" ? renderPlayerLeaderboard() : renderCreatureLeaderboard()}

            {wallet?.account ? (
              renderUserStats()
            ) : (
              <div className="mt-6 p-4 bg-background/50 rounded-lg text-center">
                <p className="text-gray-400 mb-3">Connect your wallet to see your stats and rank on the leaderboard</p>
                <ConnectButton />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
