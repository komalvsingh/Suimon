"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useWallet } from "@suiet/wallet-kit"

// API URL - change this to match your backend URL
const API_URL = "http://localhost:5000/api"

// Create the auth context
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const wallet = useWallet()

  // Check for existing user session on initial load
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const storedUser = localStorage.getItem("suimon_user")

        if (storedUser) {
          const userData = JSON.parse(storedUser)

          // Verify the session with backend
          const response = await fetch(`${API_URL}/auth/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userData.token}`,
            },
          })

          if (response.ok) {
            setUser(userData)
          } else {
            // If verification fails, clear local storage
            localStorage.removeItem("suimon_user")
          }
        }
      } catch (error) {
        console.error("Auth verification error:", error)
        localStorage.removeItem("suimon_user")
      } finally {
        setLoading(false)
      }
    }

    checkUserSession()
  }, [])

  // Update user data when wallet connects/disconnects
  useEffect(() => {
    if (user && wallet.connected && wallet.address) {
      updateUserWallet(wallet.address)
    }
  }, [wallet.connected, wallet.address, user])

  const updateUserWallet = async (walletAddress) => {
    if (!user) return

    try {
      const response = await fetch(`${API_URL}/auth/update-wallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          walletAddress,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const updatedUser = { ...user, walletAddress: result.walletAddress }
        setUser(updatedUser)
        localStorage.setItem("suimon_user", JSON.stringify(updatedUser))
      }
    } catch (error) {
      console.error("Failed to update wallet address:", error)
    }
  }

  const login = async (email, password) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      // Store user data in localStorage
      localStorage.setItem("suimon_user", JSON.stringify(data))
      setUser(data)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signup = async (username, email, password) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          walletAddress: wallet.connected ? wallet.address : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Signup failed")
      }

      // Store user data in localStorage
      localStorage.setItem("suimon_user", JSON.stringify(data))
      setUser(data)

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("suimon_user")
    setUser(null)

    // Refresh the page
    window.location.reload()
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
