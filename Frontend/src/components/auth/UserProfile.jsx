"use client"

import { useAuth } from "./AuthContext"
import { useWallet } from "@suiet/wallet-kit"

export default function UserProfile() {
  const { user, logout } = useAuth()
  const wallet = useWallet()

  if (!user) return null

  return (
    <div className="flex items-center space-x-3">
      <div className="hidden md:block">
        <p className="text-sm text-gray-400">{user.username || user.email}</p>
        {user.walletAddress && (
          <p className="text-xs text-gray-500">
            {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
          </p>
        )}
      </div>
      <button
        onClick={logout}
        className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
      >
        Logout
      </button>
    </div>
  )
}
