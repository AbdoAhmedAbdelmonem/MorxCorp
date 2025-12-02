"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Plus, Users, Settings, ArrowRight, Search, Trash2, MoreVertical, AlertTriangle, Edit } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TeamsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [teams, setTeams] = useState<any[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState<{ url: string; name: string; projectCount: number } | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [teamToEdit, setTeamToEdit] = useState<any>(null)
  const [editTeamName, setEditTeamName] = useState("")
  const [editTeamDescription, setEditTeamDescription] = useState("")

  useEffect(() => {
    // Check localStorage for user using student_session key
    const storedSession = localStorage.getItem('student_session')
    if (storedSession) {
      const userData = JSON.parse(storedSession)
      setUser(userData)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (user?.user_id) {
      fetchTeams()
    }
  }, [user])

  const fetchTeams = async () => {
    if (!user?.user_id) {
      console.log('Cannot fetch teams - no user_id:', user)
      return;
    }
    
    try {
      console.log('Fetching teams for user_id:', user.user_id)
      const res = await fetch(`/api/teams?user_id=${user.user_id}`)
      const result = await res.json()
      
      console.log('Teams API response:', result)
      
      if (result.success) {
        setTeams(result.data || [])
        console.log('Teams set:', result.data?.length || 0, 'teams')
      } else {
        console.error('Failed to fetch teams:', result.error)
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !user?.user_id) return
    
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          team_name: newTeamName,
          user_id: user.user_id 
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        setNewTeamName('')
        setIsCreateDialogOpen(false)
        // Refresh teams list
        fetchTeams()
      } else {
        alert(result.error || 'Failed to create team')
      }
    } catch (error) {
      console.error('Error creating team:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleEditTeam = (team: any) => {
    setTeamToEdit(team)
    setEditTeamName(team.team_name)
    setEditTeamDescription(team.team_description || "")
    setIsEditDialogOpen(true)
  }

  const handleUpdateTeam = async () => {
    if (!editTeamName.trim() || !teamToEdit || !user?.user_id) return

    try {
      const res = await fetch(`/api/teams/${teamToEdit.team_url}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: editTeamName,
          team_description: editTeamDescription,
          user_id: user.user_id
        })
      })

      const result = await res.json()

      if (result.success) {
        setIsEditDialogOpen(false)
        setTeamToEdit(null)
        setEditTeamName("")
        setEditTeamDescription("")
        fetchTeams()
      } else {
        alert(result.error || 'Failed to update team')
      }
    } catch (error) {
      console.error('Error updating team:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleDeleteTeam = async (teamUrl: string, teamName: string, projectCount: number) => {
    setTeamToDelete({ url: teamUrl, name: teamName, projectCount })
    setIsDeleteDialogOpen(true)
    setDeleteConfirmText("")
    setDeleteConfirmChecked(false)
  }

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return

    try {
      const res = await fetch(`/api/teams/${teamToDelete.url}?user_id=${user.user_id}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      
      if (result.success) {
        setIsDeleteDialogOpen(false)
        setTeamToDelete(null)
        setDeleteConfirmText("")
        setDeleteConfirmChecked(false)
        // Refresh teams list
        fetchTeams()
      } else {
        alert(result.error || 'Failed to delete team')
      }
    } catch (error) {
      console.error('Error deleting team:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const isAuthenticated = !!user

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

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>Please sign in to access teams</CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6 sm:py-8 md:py-12 bg-muted/40">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">Your Teams</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Collaborate and manage projects with your teams
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 sm:h-9"
              />
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-10 sm:h-9">
                  <Plus className="mr-2 size-4" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] mx-4 sm:mx-0">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Create a New Team</DialogTitle>
                  <DialogDescription className="text-sm">Set up a team for collaboration</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="teamName" className="text-sm">Team Name</Label>
                    <Input
                      id="teamName"
                      placeholder="Marketing Team"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                  <Button 
                    onClick={handleCreateTeam} 
                    disabled={!newTeamName.trim()}
                    className="w-full sm:w-auto h-10"
                  >
                    Create Team
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-24 px-4">
              <div className="size-16 sm:size-20 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
                <Users className="size-8 sm:size-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-center">No teams yet</h2>
              <p className="text-sm sm:text-base text-muted-foreground text-center mb-6 sm:mb-8 max-w-md px-4">
                Create your first team to start collaborating
              </p>
              <Button size="lg" onClick={() => setIsCreateDialogOpen(true)} className="h-11 px-6">
                <Plus className="mr-2 size-5" />
                Create Your First Team
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {teams.map((team: any) => (
                <Card 
                  key={team.team_id} 
                  className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50 active:scale-[0.98]"
                  onClick={() => router.push(`/teams/${team.team_url}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="size-10 sm:size-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Users className="size-5 sm:size-5.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg truncate">{team.team_name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Created {new Date(team.create_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      {team.role === 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="size-8 sm:size-9 flex-shrink-0">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditTeam(team)
                              }}
                            >
                              <Edit className="mr-2 size-4" />
                              Edit Team
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteTeam(team.team_url, team.team_name, team.project_count || 0)
                              }} 
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 size-4" />
                              Delete Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {team.project_count || 0} project{team.project_count !== 1 ? 's' : ''}
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-xs h-8 -mr-2">
                        Open →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Team Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Edit Team</DialogTitle>
              <DialogDescription className="text-sm">
                Update your team's name and description
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-team-name" className="text-sm">Team Name *</Label>
                <Input
                  id="edit-team-name"
                  placeholder="Marketing Team"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-team-description" className="text-sm">Description</Label>
                <Textarea
                  id="edit-team-description"
                  placeholder="Describe what this team is working on..."
                  value={editTeamDescription}
                  onChange={(e) => setEditTeamDescription(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="w-full sm:w-auto h-10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTeam}
                disabled={!editTeamName.trim()}
                className="w-full sm:w-auto h-10"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Team Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
            <DialogHeader>
              <div className="flex items-start gap-3 mb-2">
                <div className="size-11 sm:size-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="size-5 sm:size-6 text-destructive" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg sm:text-xl">Delete Team?</DialogTitle>
                  <DialogDescription className="text-sm sm:text-base mt-1">
                    This action cannot be undone
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <Alert variant="destructive" className="border-destructive/50">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <AlertDescription className="ml-2 text-sm">
                  <strong>Warning:</strong> Deleting "{teamToDelete?.name}" will permanently remove:
                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs sm:text-sm">
                    <li>{teamToDelete?.projectCount || 0} project{teamToDelete?.projectCount !== 1 ? 's' : ''}</li>
                    <li>All tasks and data within those projects</li>
                    <li>All team members' access</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm" className="text-sm font-medium">
                    Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs sm:text-sm">delete my team</span> to confirm:
                  </Label>
                  <Input
                    id="delete-confirm"
                    placeholder="delete my team"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="font-mono h-10 text-sm"
                  />
                </div>

                <div className="flex items-start space-x-3 rounded-lg border p-3 sm:p-4">
                  <Checkbox
                    id="delete-checkbox"
                    checked={deleteConfirmChecked}
                    onCheckedChange={(checked) => setDeleteConfirmChecked(checked === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-1 leading-none flex-1 min-w-0">
                    <Label
                      htmlFor="delete-checkbox"
                      className="text-xs sm:text-sm font-medium cursor-pointer"
                    >
                      I understand this action is permanent and cannot be undone
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      All data will be permanently deleted from our servers
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setDeleteConfirmText("")
                  setDeleteConfirmChecked(false)
                }}
                className="w-full sm:w-auto h-10"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteTeam}
                disabled={deleteConfirmText !== "delete my team" || !deleteConfirmChecked}
                className="w-full sm:w-auto h-10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Team Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  )
}
