"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { PasswordLanding } from "./password-landing"

// ============================================================================
// FEATURE FLAG: Set to true to enable password protection
// ============================================================================
const ENABLE_PASSWORD_PROTECTION = false

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // If password protection is disabled, automatically authenticate
    if (!ENABLE_PASSWORD_PROTECTION) {
      setIsAuthenticated(true)
      setIsLoading(false)
      return
    }

    // Check if user is already authenticated
    const authStatus = sessionStorage.getItem("huella_authenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const login = () => {
    setIsAuthenticated(true)
  }

  const logout = () => {
    sessionStorage.removeItem("huella_authenticated")
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-300 mx-auto mb-4"></div>
          <p className="text-stone-400 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  // Only show password landing if password protection is enabled and user is not authenticated
  if (ENABLE_PASSWORD_PROTECTION && !isAuthenticated) {
    return <PasswordLanding onPasswordCorrect={login} />
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
