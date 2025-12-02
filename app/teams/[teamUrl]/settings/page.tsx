"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, UserPlus, Trash2, Crown, Shield, User } from "lucide-react"

export default function TeamSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const teamUrl = params.teamUrl as string

  const [user, setUser] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("member")

  useEffect(() => {
    const storedSession = localStorage.getItem('student_session')
    if (storedSession) {
      setUser(JSON.parse(storedSession))
    }
    fetchTeam()
    fetchMembers()
  }, [teamUrl])

  const fetchTeam = async () => {
    try {
      const res = await fetch(`/api/teams/${teamUrl}`)
      const result = await res.json()
      
      if (result.success) {
        setTeam(result.data)
      }
    } catch (error) {
      console.error('Error fetching team:', error)
    }
  }

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/teams/${teamUrl}/members`)
      const result = await res.json()
      
      if (result.success) {
        setMembers(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return
    
    try {
      const res = await fetch(`/api/teams/${teamUrl}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: newMemberEmail,
          role: newMemberRole
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        setNewMemberEmail('')
        setNewMemberRole('member')
        setIsAddDialogOpen(false)
        fetchMembers()
      } else {
        alert(result.error || 'Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleRemoveMember = async (userId: number, userName: string) => {
    if (!confirm(`Remove ${userName} from the team?`)) return
    
    try {
      const res = await fetch(`/api/teams/${teamUrl}/members?user_id=${userId}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      
      if (result.success) {
        fetchMembers()
      } else {
        alert(result.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      const res = await fetch(`/api/teams/${teamUrl}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, new_role: newRole })
      })
      
      const result = await res.json()
      
      if (result.success) {
        fetchMembers()
      } else {
        alert(result.error || 'Failed to change role')
      }
    } catch (error) {
      console.error('Error changing role:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const getRoleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="size-4 text-yellow-500" />
    if (role === 'admin') return <Shield className="size-4 text-blue-500" />
    return <User className="size-4 text-gray-500" />
  }

  const getRoleBadgeColor = (role: string) => {
    if (role === 'owner') return "bg-yellow-100 text-yellow-800"
    if (role === 'admin') return "bg-blue-100 text-blue-800"
    return "bg-gray-100 text-gray-800"
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const isOwnerOrAdmin = team?.role === 'owner' || team?.role === 'admin'
  const isOwner = team?.role === 'owner'

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-8 bg-muted/40">
        <div className="container px-4 md:px-6 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => router.push(`/teams/${teamUrl}`)}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to Team
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Team Members</h1>
                <p className="text-muted-foreground">
                  {team?.team_name} · {members.length} members
                </p>
              </div>
              
              {isOwnerOrAdmin && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 size-4" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Team Member</DialogTitle>
                      <DialogDescription>Add a user to this team by email</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">User Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="user@example.com"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                          <SelectTrigger id="role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddMember} disabled={!newMemberEmail.trim()}>
                        Add Member
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-3">
            {members.map((member) => (
              <Card key={member.user_id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="size-10">
                        <AvatarFallback>
                          {member.first_name?.[0]}{member.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isOwner && member.role !== 'owner' ? (
                        <Select
                          value={member.role}
                          onValueChange={(value) => handleChangeRole(member.user_id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <div className="flex items-center gap-2">
                              {getRoleIcon(member.role)}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getRoleBadgeColor(member.role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </span>
                        </Badge>
                      )}

                      {isOwnerOrAdmin && member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.user_id, `${member.first_name} ${member.last_name}`)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
