"use client"

import { useState } from "react"
import { useAuth } from "./AuthContext"
import { useWallet } from "@suiet/wallet-kit"

export default function LoginSignup() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()
  const wallet = useWallet()

  // Fluorescent colors from App.jsx
  const colors = {
    primary: "text-fuchsia-500",
    secondary: "text-cyan-400",
    accent1: "text-lime-400",
    accent2: "text-purple-500",
    accent3: "text-pink-500",
    accent4: "text-emerald-400",
  }

  const bgColors = {
    primary: "bg-fuchsia-500",
    secondary: "bg-cyan-400",
    accent1: "bg-lime-400",
    accent2: "bg-purple-500",
    accent3: "bg-pink-500",
    accent4: "bg-emerald-400",
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let result

      if (isLogin) {
        result = await login(email, password)
      } else {
        if (!username) {
          throw new Error("Username is required")
        }
        result = await signup(username, email, password)
      }

      if (!result.success) {
        throw new Error(result.error || "Authentication failed")
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6">
      <div className="w-full max-w-md bg-gray-800/60 backdrop-blur-sm rounded-xl p-8 border border-gray-700 shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className={`${bgColors.primary} w-2 h-6 rounded-full animate-pulse`}></div>
            <div className={`${bgColors.secondary} w-2 h-6 rounded-full animate-pulse delay-100`}></div>
            <div className={`${bgColors.accent1} w-2 h-6 rounded-full animate-pulse delay-200`}></div>
            <h2 className={`text-3xl font-bold ${colors.primary} ml-3`}>{isLogin ? "Login" : "Sign Up"}</h2>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-medium" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-gray-100"
                placeholder="Enter your username"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-gray-300 mb-2 text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-gray-100"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-gray-100"
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              disabled={loading}
              className={`${bgColors.primary} hover:bg-fuchsia-600 px-6 py-3 rounded-lg font-bold shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
            </button>

            {wallet.connected && !isLogin && (
              <div className="text-center text-sm text-gray-400">
                <p>
                  Wallet will be linked: {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className={`${colors.secondary} text-sm hover:underline focus:outline-none`}
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
