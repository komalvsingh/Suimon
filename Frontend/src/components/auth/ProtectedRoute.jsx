"use client"

import { useAuth } from "./AuthContext"
import LoginSignup from "./LoginSignup"

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    // Show loading spinner while checking authentication
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex space-x-2">
          <div className="h-4 w-4 rounded-full bg-fuchsia-500 animate-pulse"></div>
          <div className="h-4 w-4 rounded-full bg-cyan-400 animate-pulse delay-100"></div>
          <div className="h-4 w-4 rounded-full bg-lime-400 animate-pulse delay-200"></div>
        </div>
      </div>
    )
  }

  // If not authenticated, show login/signup page
  if (!isAuthenticated) {
    return <LoginSignup />
  }

  // If authenticated, render the children
  return children
}
