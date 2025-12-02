"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, Moon, Sun, Settings, LogOut, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { NotificationPanel } from "@/components/notification-panel"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    
    // Check localStorage for user data using student_session key
    const storedSession = localStorage.getItem('student_session')
    if (storedSession) {
      try {
        const userData = JSON.parse(storedSession)
        setUser(userData)
      } catch (error) {
        console.error('Error parsing session:', error)
      }
    }
    
    // Listen for login events
    const handleUserLogin = (event: any) => {
      const userData = event.detail
      console.log('User login event:', userData)
      setUser(userData)
    }
    
    // Listen for storage changes (in case profile is updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'student_session' && e.newValue) {
        try {
          const userData = JSON.parse(e.newValue)
          console.log('Storage changed:', userData)
          setUser(userData)
        } catch (error) {
          console.error('Error parsing session from storage event:', error)
        }
      }
    }
    
    window.addEventListener('userLogin', handleUserLogin)
    window.addEventListener('storage', handleStorageChange)
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener('userLogin', handleUserLogin)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleLogout = async () => {
    // Clear localStorage using student_session key
    localStorage.removeItem('student_session')
    setUser(null)
    // Sign out from NextAuth
    await signOut({ redirect: false })
    router.push("/")
  }

  const isAuthenticated = !!user

  return (
    <header
      className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${
        isScrolled ? "bg-background/80 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Image src="/Morx.png" alt="Morx" width={40} height={40} className="size-10" />
          <span className="text-xl rock-salt">Morx</span>
        </Link>
        
        <nav className="hidden md:flex gap-8">
          {isAuthenticated ? (
            <>
              <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Home
              </Link>
              <Link href="/reports" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Reports
              </Link>
              <Link href="/teams" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Teams
              </Link>
            </>
          ) : (
            <>
              <Link href="/docs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Documentation
              </Link>
              <Link href="/api" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                API
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Pricing
              </Link>
              <Link href="/support" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Support
              </Link>
            </>
          )}
        </nav>

        <div className="hidden md:flex gap-4 items-center">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {mounted && theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
          {isAuthenticated && user && (
            <NotificationPanel userId={user.user_id} />
          )}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profile_image || "/Morx.png"} alt={user.first_name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.first_name?.substring(0, 1)}{user.last_name?.substring(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.first_name} {user.last_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/teams" className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Teams</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/signin" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Sign In
              </Link>
              <Button className="rounded-full" asChild>
                <Link href="/signin">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {mounted && theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-background/95 backdrop-blur-lg border-b">
          <div className="container py-4 flex flex-col gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
                <Link href="/reports" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Reports
                </Link>
                <Link href="/teams" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Teams
                </Link>
              </>
            ) : (
              <>
                <Link href="/docs" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Documentation
                </Link>
                <Link href="/api" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  API
                </Link>
                <Link href="/pricing" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Pricing
                </Link>
                <Link href="/support" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Support
                </Link>
              </>
            )}
            <div className="flex flex-col gap-2 pt-2 border-t">
              {isAuthenticated && user ? (
                <>
                  <div className="py-2 text-sm font-medium text-muted-foreground">
                    {user.email}
                  </div>
                  <Link href="/settings" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Settings
                  </Link>
                  <Button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} variant="outline" className="rounded-full">
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/signin" className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Button className="rounded-full" asChild>
                    <Link href="/signin">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
