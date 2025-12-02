"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface User {
  username: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => boolean
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Safe localStorage wrapper
  const safeLocalStorage = {
    getItem: (key: string) => {
      if (typeof window !== "undefined") {
        return localStorage.getItem(key)
      }
      return null
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, value)
      }
    },
    removeItem: (key: string) => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key)
      }
    }
  }

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = safeLocalStorage.getItem("morx-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = (username: string, password: string): boolean => {
    // Hardcoded admin credentials
    if (username === "admin" && password === "admin123") {
      const userData: User = {
        username: "Levo",
        name: "Levo",
        email: "tokyo9900777@gmail.com",
        role: "Founder"
      }
      setUser(userData)
      safeLocalStorage.setItem("morx-user", JSON.stringify(userData))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    safeLocalStorage.removeItem("morx-user")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
