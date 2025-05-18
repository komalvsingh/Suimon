"use client"

import { useState, useEffect, useCallback } from "react"
import { ConnectButton } from "@suiet/wallet-kit"
import { useAuth } from "./auth/AuthContext"

// API URL - change this to match your backend URL
const API_URL = "http://localhost:5000/api"

// Update interval (3 minutes = 180000ms)
const UPDATE_INTERVAL = 180000

const Leaderboard = ({ wallet }) => {
  const { user, isAuthenticated } = useAuth()
  const [leaderboardData, setLeaderboardData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch leaderboard data from server
  const fetchLeaderboard = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Fetch player leaderboard
      const response = await fetch(`${API_URL}/game/leaderboard`)
      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard")
      }

      const data = await response.json()

      // Sort by XP level first, then by XP amount
      const sortedData = data.sort((a, b) => {
        if (a.level !== b.level) {
          return b.level - a.level
        }
        return b.xp - a.xp
      })

      setLeaderboardData(sortedData)
      setLastRefreshed(new Date())
      setError("")
    } catch (err) {
      console.error("Error fetching leaderboard data:", err)
      setError(`Failed to load leaderboard data: ${err.message}`)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Initial data fetch
  useEffect(() => {
    fetchLeaderboard()

    // Set up interval for periodic refreshes every 3 minutes
    const intervalId = setInterval(() => {
      fetchLeaderboard()
    }, UPDATE_INTERVAL)

    // Clean up interval on unmount
    return () => clearInterval(intervalId)
  }, [fetchLeaderboard])

  // Handle manual refresh
  const handleRefresh = () => {
    fetchLeaderboard()
  }

  // Format time since last refresh
  const formatTimeSince = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000)
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-500/10 border border-red-500 p-4 rounded-lg text-red-500">{error}</div>}

      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold">SuiMon Leaderboard</h2>

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
          </div>
        </div>

        <div className="text-sm text-gray-400 mb-4">
          Last updated: {formatTimeSince(lastRefreshed)} • Auto-refreshes every 3 minutes
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading leaderboard data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-background/50">
                  <th className="p-3 text-left">Rank</th>
                  <th className="p-3 text-left">Player</th>
                  <th className="p-3 text-center">Level</th>
                  <th className="p-3 text-center">XP</th>
                  <th className="p-3 text-center">Wins</th>
                  <th className="p-3 text-center">Losses</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((player, index) => (
                  <tr
                    key={player.id || player.address}
                    className={`border-b border-gray-700 ${
                      isAuthenticated && user && (player.id === user.id || player.username === user.username)
                        ? "bg-primary/10"
                        : ""
                    }`}
                  >
                    <td className="p-3">
                      <span className={`font-bold ${index < 3 ? "text-primary" : ""}`}>{index + 1}</span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold">{player.username || player.name}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-primary/20 text-primary px-2 py-1 rounded-full">{player.level}</span>
                    </td>
                    <td className="p-3 text-center font-bold">{player.xp}</td>
                    <td className="p-3 text-center">{player.wins}</td>
                    <td className="p-3 text-center">{player.losses}</td>
                  </tr>
                ))}
                {leaderboardData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      No player data found. Be the first to play and earn XP!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-6 p-4 bg-background/50 rounded-lg text-center">
            <p className="text-gray-400 mb-3">Connect your wallet and sign in to appear on the leaderboard</p>
            <ConnectButton />
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
