"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { useColorTheme } from "@/components/color-theme-provider"
import { useAuth } from "@/contexts/auth-context"
import { User, CreditCard, Palette, Bell, Shield, ChevronRight, Check, Languages, Monitor, Volume2 } from "lucide-react"

function ColorThemeSelector() {
  const { colorTheme, setColorTheme } = useColorTheme()

  const colorThemes = [
    { value: "default", label: "Default (Mint)", colors: ["158 64% 52%", "142 76% 36%", "160 84% 39%"] },
    { value: "volcano", label: "Volcano", colors: ["14 100% 57%", "24 95% 53%", "14 100% 57%"] },
    { value: "nightowl", label: "Night Owl", colors: ["207 90% 54%", "286 85% 60%", "171 100% 41%"] },
    { value: "skyblue", label: "Sky Blue", colors: ["199 89% 48%", "204 96% 27%", "186 100% 69%"] },
    { value: "sunset", label: "Sunset", colors: ["340 82% 52%", "25 95% 53%", "291 64% 42%"] },
    { value: "forest", label: "Forest", colors: ["142 76% 36%", "84 68% 42%", "173 58% 39%"] },
    { value: "ocean", label: "Ocean", colors: ["212 100% 48%", "188 78% 41%", "199 89% 48%"] },
    { value: "lavender", label: "Lavender", colors: ["262 83% 58%", "291 47% 51%", "280 67% 80%"] },
    { value: "rose", label: "Rose", colors: ["330 81% 60%", "346 77% 49%", "350 89% 60%"] },
    { value: "amber", label: "Amber", colors: ["32 95% 44%", "38 92% 50%", "45 93% 47%"] },
    { value: "mint", label: "Mint", colors: ["158 64% 52%", "168 76% 42%", "160 84% 39%"] },
    { value: "crimson", label: "Crimson", colors: ["348 83% 47%", "356 75% 53%", "340 82% 52%"] },
    { value: "indigo", label: "Indigo", colors: ["239 84% 67%", "243 75% 59%", "249 95% 63%"] },
    { value: "emerald", label: "Emerald", colors: ["158 64% 52%", "142 76% 36%", "152 60% 53%"] },
    { value: "coral", label: "Coral", colors: ["16 100% 66%", "14 91% 68%", "351 95% 71%"] },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Theme</CardTitle>
        <CardDescription>
          Choose your favorite color palette for the entire site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {colorThemes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setColorTheme(theme.value as any)}
              className={`relative p-4 border-2 rounded-lg transition-all hover:border-primary/50 ${
                colorTheme === theme.value ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="space-y-3">
                <div className="flex gap-1 justify-center">
                  {theme.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="h-8 w-8 rounded-full"
                      style={{ backgroundColor: `hsl(${color})` }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-center">{theme.label}</p>
              </div>
              {colorTheme === theme.value && (
                <div className="absolute top-2 right-2">
                  <Check className="size-4 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isNewUser, setIsNewUser] = useState(false)

  // Profile state - use authenticated user data from localStorage
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profileImage: "",
    location: ""
  })

  // Password state
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  })

  // Preferences state
  const [preferences, setPreferences] = useState({
    language: "en",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
    marketingEmails: false,
    soundEnabled: true,
    desktopNotifications: true,
    showOnlineStatus: true,
    autoSave: true,
    compactMode: false,
    animationsEnabled: true
  })

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
    }
  }

  useEffect(() => {
    // Check if this is a new user from URL params
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      setIsNewUser(urlParams.get('welcome') === 'true')
    }

    // Load user data from localStorage using student_session key
    const storedSession = safeLocalStorage.getItem('student_session')
    if (storedSession) {
      const userData = JSON.parse(storedSession)
      setUser(userData)
      setProfile({
        firstName: userData.first_name || "",
        lastName: userData.last_name || "",
        email: userData.email || "",
        profileImage: userData.profile_image || "",
        location: userData.location || ""
      })
    }

    // Load preferences from localStorage
    const stored = safeLocalStorage.getItem("morx-preferences")
    if (stored) {
      setPreferences(JSON.parse(stored))
    }
  }, [])

  // Plan data
  const planData = {
    name: "Professional",
    price: "$49/month",
    status: "Active",
    nextBilling: "December 15, 2025",
    features: [
      "Unlimited reports",
      "Advanced analytics",
      "Priority support",
      "Custom integrations",
      "Team collaboration"
    ],
    usage: {
      reports: { current: 847, limit: "Unlimited" },
      storage: { current: 23.5, limit: 100, unit: "GB" },
      teamMembers: { current: 8, limit: 15 }
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Check if user is logged in
      if (!user || !user.user_id) {
        alert("Please log in to update your profile")
        return
      }

      const updateData: any = {
        user_id: user.user_id,
        first_name: profile.firstName,
        last_name: profile.lastName,
        location: profile.location
      }

      // Only include password if both fields are filled and match
      if (passwordData.newPassword && passwordData.confirmPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          alert("Passwords do not match!")
          return
        }
        updateData.password = passwordData.newPassword
      }

      const res = await fetch('/api/users/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      const result = await res.json()

      if (result.success) {
        // Update localStorage with new data using student_session key
        safeLocalStorage.setItem('student_session', JSON.stringify(result.data))
        
        // Update local state
        setUser(result.data)
        setProfile({
          firstName: result.data.first_name,
          lastName: result.data.last_name,
          email: result.data.email,
          profileImage: result.data.profile_image || "",
          location: result.data.location || ""
        })

        // Clear password fields
        setPasswordData({ newPassword: "", confirmPassword: "" })

        // Trigger header update
        window.dispatchEvent(new CustomEvent('userLogin', { detail: result.data }))

        alert("Profile updated successfully!")
        
        // If this was a new user completing their profile, redirect to teams
        if (isNewUser) {
          setTimeout(() => {
            window.location.href = '/teams'
          }, 1000)
        }
      } else {
        alert(result.error || "Failed to update profile")
      }
    } catch (error) {
      console.error("Profile update error:", error)
      alert("An error occurred. Please try again.")
    }
  }

  const handlePreferenceChange = (key: string, value: any) => {
    const updated = { ...preferences, [key]: value }
    setPreferences(updated)
    safeLocalStorage.setItem("morx-preferences", JSON.stringify(updated))
  }

  const themeOptions = [
    { value: "light", label: "Light", icon: "☀️" },
    { value: "dark", label: "Dark", icon: "🌙" },
    { value: "system", label: "System", icon: "💻" }
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-12 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isNewUser ? 'Welcome! Complete Your Profile' : 'Settings'}
            </h1>
            <p className="text-muted-foreground">
              {isNewUser 
                ? 'Please complete your profile information to get started with Morx' 
                : 'Manage your account settings and preferences'}
            </p>
          </div>

          {isNewUser && (
            <Card className="mb-6 border-primary bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="size-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">Complete Your Profile</h3>
                    <p className="text-sm text-muted-foreground">
                      Add additional information like your location and set a password to secure your account. 
                      You can also customize your preferences in the other tabs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="size-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Bell className="size-4" />
                <span className="hidden sm:inline">Preferences</span>
              </TabsTrigger>
              <TabsTrigger value="plan" className="flex items-center gap-2">
                <CreditCard className="size-4" />
                <span className="hidden sm:inline">Plan</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="size-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-20">
                      {profile.profileImage ? (
                        <AvatarImage src={profile.profileImage} alt={profile.firstName} />
                      ) : (
                        <AvatarImage src="/Morx.png" />
                      )}
                      <AvatarFallback className="text-lg">
                        {profile.firstName?.substring(0, 1)}{profile.lastName?.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm">Change Photo</Button>
                      <p className="text-xs text-muted-foreground">JPG, GIF or PNG. Max size 2MB.</p>
                    </div>
                  </div>

                  <Separator />

                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profile.firstName}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profile.lastName}
                          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="location">Governorate</Label>
                        <Select 
                          value={profile.location} 
                          onValueChange={(value) => setProfile({ ...profile, location: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Governorate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Cairo">Cairo</SelectItem>
                            <SelectItem value="Giza">Giza</SelectItem>
                            <SelectItem value="Alexandria">Alexandria</SelectItem>
                            <SelectItem value="Dakahlia">Dakahlia</SelectItem>
                            <SelectItem value="Red Sea">Red Sea</SelectItem>
                            <SelectItem value="Beheira">Beheira</SelectItem>
                            <SelectItem value="Fayoum">Fayoum</SelectItem>
                            <SelectItem value="Gharbia">Gharbia</SelectItem>
                            <SelectItem value="Ismailia">Ismailia</SelectItem>
                            <SelectItem value="Menofia">Menofia</SelectItem>
                            <SelectItem value="Minya">Minya</SelectItem>
                            <SelectItem value="Qaliubiya">Qaliubiya</SelectItem>
                            <SelectItem value="New Valley">New Valley</SelectItem>
                            <SelectItem value="Suez">Suez</SelectItem>
                            <SelectItem value="Aswan">Aswan</SelectItem>
                            <SelectItem value="Assiut">Assiut</SelectItem>
                            <SelectItem value="Beni Suef">Beni Suef</SelectItem>
                            <SelectItem value="Port Said">Port Said</SelectItem>
                            <SelectItem value="Damietta">Damietta</SelectItem>
                            <SelectItem value="Sharkia">Sharkia</SelectItem>
                            <SelectItem value="South Sinai">South Sinai</SelectItem>
                            <SelectItem value="Kafr El Sheikh">Kafr El Sheikh</SelectItem>
                            <SelectItem value="Matrouh">Matrouh</SelectItem>
                            <SelectItem value="Luxor">Luxor</SelectItem>
                            <SelectItem value="Qena">Qena</SelectItem>
                            <SelectItem value="North Sinai">North Sinai</SelectItem>
                            <SelectItem value="Sohag">Sohag</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            placeholder="Enter new password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm new password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Leave blank to keep current password</p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => window.location.reload()}>Cancel</Button>
                      <Button type="submit">Save Changes</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Additional security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange("emailNotifications", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Push Notifications</div>
                      <div className="text-sm text-muted-foreground">Receive push notifications on your devices</div>
                    </div>
                    <Switch
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange("pushNotifications", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Desktop Notifications</div>
                      <div className="text-sm text-muted-foreground">Show notifications on your desktop</div>
                    </div>
                    <Switch
                      checked={preferences.desktopNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange("desktopNotifications", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Weekly Report</div>
                      <div className="text-sm text-muted-foreground">Receive weekly activity summary</div>
                    </div>
                    <Switch
                      checked={preferences.weeklyReport}
                      onCheckedChange={(checked) => handlePreferenceChange("weeklyReport", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Marketing Emails</div>
                      <div className="text-sm text-muted-foreground">Receive updates about new features</div>
                    </div>
                    <Switch
                      checked={preferences.marketingEmails}
                      onCheckedChange={(checked) => handlePreferenceChange("marketingEmails", checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Display & Behavior</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={preferences.language} onValueChange={(value) => handlePreferenceChange("language", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select value={preferences.dateFormat} onValueChange={(value) => handlePreferenceChange("dateFormat", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeFormat">Time Format</Label>
                      <Select value={preferences.timeFormat} onValueChange={(value) => handlePreferenceChange("timeFormat", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12h">12 Hour</SelectItem>
                          <SelectItem value="24h">24 Hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Sound Effects</div>
                      <div className="text-sm text-muted-foreground">Play sounds for interactions</div>
                    </div>
                    <Switch
                      checked={preferences.soundEnabled}
                      onCheckedChange={(checked) => handlePreferenceChange("soundEnabled", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Show Online Status</div>
                      <div className="text-sm text-muted-foreground">Let others see when you're online</div>
                    </div>
                    <Switch
                      checked={preferences.showOnlineStatus}
                      onCheckedChange={(checked) => handlePreferenceChange("showOnlineStatus", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Auto Save</div>
                      <div className="text-sm text-muted-foreground">Automatically save your work</div>
                    </div>
                    <Switch
                      checked={preferences.autoSave}
                      onCheckedChange={(checked) => handlePreferenceChange("autoSave", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Compact Mode</div>
                      <div className="text-sm text-muted-foreground">Use a more condensed layout</div>
                    </div>
                    <Switch
                      checked={preferences.compactMode}
                      onCheckedChange={(checked) => handlePreferenceChange("compactMode", checked)}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">Animations</div>
                      <div className="text-sm text-muted-foreground">Enable UI animations and transitions</div>
                    </div>
                    <Switch
                      checked={preferences.animationsEnabled}
                      onCheckedChange={(checked) => handlePreferenceChange("animationsEnabled", checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Plan & Billing Tab */}
            <TabsContent value="plan" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Current Plan</CardTitle>
                      <CardDescription>Manage your subscription and billing</CardDescription>
                    </div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                      {planData.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h3 className="text-2xl font-bold">{planData.name}</h3>
                      <p className="text-muted-foreground">{planData.price}</p>
                    </div>
                    <Button>Upgrade Plan</Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next billing date</span>
                      <span className="font-medium">{planData.nextBilling}</span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Plan Features</h4>
                    <div className="space-y-2">
                      {planData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="size-4 text-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-4">Usage</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Reports Generated</span>
                          <span className="font-medium">
                            {planData.usage.reports.current} / {planData.usage.reports.limit}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Storage Used</span>
                          <span className="font-medium">
                            {planData.usage.storage.current} / {planData.usage.storage.limit} {planData.usage.storage.unit}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${(planData.usage.storage.current / planData.usage.storage.limit) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Team Members</span>
                          <span className="font-medium">
                            {planData.usage.teamMembers.current} / {planData.usage.teamMembers.limit}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${(planData.usage.teamMembers.current / planData.usage.teamMembers.limit) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Manage your payment information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-gradient-to-br from-primary to-primary/70 rounded flex items-center justify-center text-primary-foreground font-bold">
                        ****
                      </div>
                      <div>
                        <div className="font-medium">Visa ending in 4242</div>
                        <div className="text-sm text-muted-foreground">Expires 12/2026</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Update</Button>
                  </div>
                  <Button variant="outline" className="w-full">
                    <span>Add Payment Method</span>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Light/Dark Mode</CardTitle>
                  <CardDescription>
                    Choose how Morx looks and feels in your browser
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {themeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={`relative p-4 border-2 rounded-lg transition-all hover:border-primary/50 ${
                          theme === option.value ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-4xl">{option.icon}</span>
                          <span className="font-medium">{option.label}</span>
                        </div>
                        {theme === option.value && (
                          <div className="absolute top-2 right-2">
                            <Check className="size-5 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <ColorThemeSelector />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
