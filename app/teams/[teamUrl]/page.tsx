"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Users, Folder, MoreVertical, Trash2, ArrowLeft, Settings, BarChart3, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TeamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const teamUrl = params.teamUrl as string

  const [user, setUser] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDesc, setNewProjectDesc] = useState("")
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("member")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<{ url: string; name: string; taskCount: number } | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false)

  useEffect(() => {
    const storedSession = localStorage.getItem('student_session')
    if (storedSession) {
      setUser(JSON.parse(storedSession))
    }
  }, [])

  useEffect(() => {
    if (user?.user_id) {
      fetchTeam()
    }
  }, [user, teamUrl])

  useEffect(() => {
    if (team) {
      fetchProjects()
    }
  }, [team])

  useEffect(() => {
    if (isMembersDialogOpen && team && user?.user_id) {
      fetchTeamMembers()
    }
  }, [isMembersDialogOpen, team, user])

  const fetchTeam = async () => {
    if (!user?.user_id) {
      setIsLoading(false)
      return;
    }
    
    try {
      const res = await fetch(`/api/teams/${teamUrl}?user_id=${user.user_id}`)
      const result = await res.json()
      
      if (result.success) {
        setTeam(result.data)
      } else {
        // Set team with error flag for unauthorized access
        setTeam({ error: true, message: result.error, owner: result.owner })
      }
    } catch (error) {
      console.error('Error fetching team:', error)
      setTeam({ error: true, message: 'Failed to load team', owner: null })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProjects = async () => {
    if (!team || !user?.user_id) return
    
    try {
      const res = await fetch(`/api/projects?team_id=${team.team_id}&user_id=${user.user_id}`)
      const result = await res.json()
      
      if (result.success) {
        setProjects(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchTeamMembers = async () => {
    if (!team || !user?.user_id) return
    
    try {
      const res = await fetch(`/api/teams/${teamUrl}/members?user_id=${user.user_id}`)
      const result = await res.json()
      
      if (result.success) {
        setTeamMembers(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !user?.user_id) return
    
    try {
      const res = await fetch(`/api/teams/${teamUrl}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: newMemberEmail,
          role: newMemberRole,
          user_id: user.user_id
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        setNewMemberEmail('')
        setNewMemberRole('member')
        setIsAddMemberOpen(false)
        fetchTeamMembers()
        alert(result.message)
      } else {
        alert(result.error || 'Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleRemoveMember = async (memberId: number, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the team?`)) return
    if (!user?.user_id) return
    
    try {
      const res = await fetch(`/api/teams/${teamUrl}/members?requester_id=${user.user_id}&user_id=${memberId}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      
      if (result.success) {
        fetchTeamMembers()
        alert(result.message)
      } else {
        alert(result.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleChangeRole = async (memberId: number, newRole: string, memberName: string) => {
    if (!confirm(`Change ${memberName}'s role to ${newRole}?`)) return
    if (!user?.user_id) return
    
    try {
      const res = await fetch(`/api/teams/${teamUrl}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: memberId,
          new_role: newRole,
          requester_id: user.user_id
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        fetchTeamMembers()
        alert(result.message)
      } else {
        alert(result.error || 'Failed to change role')
      }
    } catch (error) {
      console.error('Error changing role:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !team || !user?.user_id) return
    
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: newProjectName,
          description: newProjectDesc,
          team_id: team.team_id,
          user_id: user.user_id
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        setNewProjectName('')
        setNewProjectDesc('')
        setIsCreateDialogOpen(false)
        fetchProjects()
      } else {
        alert(result.error || 'Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleDeleteProject = async (projectUrl: string, projectName: string, taskCount: number) => {
    setProjectToDelete({ url: projectUrl, name: projectName, taskCount })
    setIsDeleteDialogOpen(true)
    setDeleteConfirmText("")
    setDeleteConfirmChecked(false)
  }

  const confirmDeleteProject = async () => {
    if (!projectToDelete || !user?.user_id) return

    try {
      const res = await fetch(`/api/projects/${projectToDelete.url}?user_id=${user.user_id}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      
      if (result.success) {
        setIsDeleteDialogOpen(false)
        setProjectToDelete(null)
        setDeleteConfirmText("")
        setDeleteConfirmChecked(false)
        fetchProjects()
      } else {
        alert(result.error || 'Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('An error occurred. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading team...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Login required
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-muted/40">
          <div className="text-center px-4 max-w-md">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="size-10 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">Login Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to access teams and projects. Please sign in to continue.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push('/signin')} size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
              <Button onClick={() => router.push('/signup')} variant="outline" size="lg" className="w-full sm:w-auto">
                Create Account
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Unauthorized access
  if (team?.error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-muted/40">
          <div className="text-center px-4 max-w-lg">
            <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="size-10 text-destructive" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-destructive">Unauthorized Access</h1>
            <p className="text-muted-foreground mb-4">
              You are not authorized to view this team. Only team members can access this page.
            </p>
            <Alert className="mb-6 border-primary/50 bg-primary/5">
              <AlertDescription className="text-left">
                <p className="font-semibold mb-2">Need access to this team?</p>
                {team.owner ? (
                  <p className="text-sm">
                    Contact the team owner: <span className="font-mono font-semibold text-primary">{team.owner.name}</span>
                  </p>
                ) : (
                  <p className="text-sm">Contact the team administrator for access.</p>
                )}
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/teams')} variant="outline" size="lg">
              <ArrowLeft className="mr-2 size-4" />
              Back to Teams
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!team) {
    return null
  }

  const isOwnerOrAdmin = team.role === 'owner' || team.role === 'admin'

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-4 sm:py-6 md:py-8 bg-muted/40">
        <div className="container px-4 sm:px-6 lg:px-8">
          {/* Team Header */}
          <div className="mb-6 sm:mb-8">
            <Button
              variant="ghost"
              className="mb-4 h-9 px-3 sm:px-4 -ml-3"
              onClick={() => router.push('/teams')}
            >
              <ArrowLeft className="mr-2 size-4" />
              <span className="hidden xs:inline">Back to Teams</span>
              <span className="xs:hidden">Back</span>
            </Button>
            
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight mb-2 break-words">{team.team_name}</h1>
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users className="size-3 sm:size-4" />
                    {projects.length} project{projects.length !== 1 ? 's' : ''}
                  </span>
                  <Badge variant="secondary" className="capitalize">{team.role}</Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/teams/${teamUrl}/reports`)}
                  className="h-9 text-xs sm:text-sm flex-1 lg:flex-none"
                  size="sm"
                >
                  <BarChart3 className="mr-1.5 sm:mr-2 size-3.5 sm:size-4" />
                </Button>
                {isOwnerOrAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => setIsMembersDialogOpen(true)}
                    className="h-9 text-xs sm:text-sm flex-1 lg:flex-none"
                    size="sm"
                  >
                    <Settings className="mr-1.5 sm:mr-2 size-3.5 sm:size-4" />
                  </Button>
                )}
                {isOwnerOrAdmin && (
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="h-9 text-xs sm:text-sm flex-1 lg:flex-none" size="sm">
                        <Plus className="mr-1.5 sm:mr-2 size-3.5 sm:size-4" />
                        <span className="hidden xs:inline">New Project</span>
                        <span className="xs:hidden">New</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] mx-4 sm:mx-0">
                      <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">Create New Project</DialogTitle>
                        <DialogDescription className="text-sm">Add a new project to this team</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="projectName" className="text-sm">Project Name</Label>
                          <Input
                            id="projectName"
                            placeholder="Website Redesign"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="projectDesc" className="text-sm">Description (optional)</Label>
                          <Textarea
                            id="projectDesc"
                            placeholder="Describe your project..."
                            value={newProjectDesc}
                            onChange={(e) => setNewProjectDesc(e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button onClick={handleCreateProject} disabled={!newProjectName.trim()} className="w-full sm:w-auto h-10">
                          Create Project
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>

          {/* Members Management Dialog */}
          <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col mx-4 sm:mx-0">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Users className="size-4 sm:size-5" />
                  <span className="truncate">Team Members</span>
                </DialogTitle>
                <DialogDescription className="text-sm">
                  Manage team members, roles, and project access
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {/* Team Members Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold">Team Members ({teamMembers.length})</h3>
                    {(team.role === 'owner' || team.role === 'admin') && (
                      <Button size="sm" onClick={() => setIsAddMemberOpen(true)}>
                        <Plus className="mr-1 size-3" />
                        Add Member
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <Card key={member.user_id} className="p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                            <Avatar className="size-9 sm:size-10 flex-shrink-0">
                              <AvatarImage src={member.profile_image} />
                              <AvatarFallback className="text-xs sm:text-sm">
                                {member.first_name[0]}{member.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base truncate">{member.first_name} {member.last_name}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{member.email}</p>
                              <div className="flex items-center gap-2 mt-1.5 sm:mt-2 flex-wrap">
                                <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="capitalize text-xs">
                                  {member.role}
                                </Badge>
                                <span className="text-xs text-muted-foreground hidden sm:inline">ID: {member.user_id}</span>
                              </div>
                            </div>
                          </div>
                          
                          {(team.role === 'owner' || team.role === 'admin') && member.role !== 'owner' && member.user_id !== user?.user_id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {team.role === 'owner' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleChangeRole(member.user_id, 'admin', `${member.first_name} ${member.last_name}`)}>
                                      Make Admin
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleChangeRole(member.user_id, 'member', `${member.first_name} ${member.last_name}`)}>
                                      Make Member
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleRemoveMember(member.user_id, `${member.first_name} ${member.last_name}`)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 size-3" />
                                  Remove from Team
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Projects Section */}
                <div className="space-y-3">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold">Team Projects ({projects.length})</h3>
                    <p className="text-sm text-muted-foreground">All team members can access these projects</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {projects.map((project: any) => (
                      <Card key={project.project_id} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push(`/projects/${project.project_url}`)}>
                        <div className="flex items-start gap-2">
                          <Folder className="size-5 text-primary mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{project.project_name}</p>
                            <p className="text-xs text-muted-foreground">{project.task_count || 0} tasks</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Member Dialog */}
          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogContent className="sm:max-w-md mx-4 sm:mx-0">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Add Team Member</DialogTitle>
                <DialogDescription className="text-sm">
                  Invite a user to join {team.team_name}. They will have access to all team projects.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="memberEmail" className="text-sm">User Email *</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    placeholder="user@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberRole" className="text-sm">Role</Label>
                  <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                    <SelectTrigger id="memberRole" className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member - Can view and edit tasks</SelectItem>
                      <SelectItem value="admin">Admin - Can manage members and projects</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setIsAddMemberOpen(false)} className="w-full sm:w-auto h-10">Cancel</Button>
                <Button onClick={handleAddMember} disabled={!newMemberEmail.trim()} className="w-full sm:w-auto h-10">Add Member</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Projects Grid */}
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-24 px-4">
              <div className="size-16 sm:size-20 rounded-full bg-muted flex items-center justify-center mb-4 sm:mb-6">
                <Folder className="size-8 sm:size-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-center">No projects yet</h2>
              <p className="text-sm sm:text-base text-muted-foreground text-center mb-6 sm:mb-8 max-w-md px-4">
                {isOwnerOrAdmin 
                  ? "Create your first project to start organizing tasks"
                  : "No projects have been created in this team yet"}
              </p>
              {isOwnerOrAdmin && (
                <Button size="lg" onClick={() => setIsCreateDialogOpen(true)} className="h-11 px-6">
                  <Plus className="mr-2 size-5" />
                  Create First Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
              {projects.map((project: any) => {
                const progress = project.task_count > 0 
                  ? (project.completed_tasks / project.task_count) * 100 
                  : 0

                return (
                  <Card
                    key={project.project_id}
                    className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/50 active:scale-[0.98] group"
                    onClick={() => router.push(`/projects/${project.project_url}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                          <div className="size-10 sm:size-11 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Folder className="size-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg truncate">{project.project_name}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {project.task_count} task{project.task_count !== 1 ? 's' : ''}
                            </CardDescription>
                          </div>
                        </div>
                        {isOwnerOrAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="size-8 sm:size-9 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteProject(project.project_url, project.project_name, project.task_count || 0)
                                }} 
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete Project
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3 sm:mb-4">
                        {project.description || "No description"}
                      </p>
                      
                      <div className="space-y-2.5 sm:space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Progress</span>
                            <span>{project.completed_tasks} / {project.task_count}</span>
                          </div>
                          <Progress value={progress} className="h-1.5 sm:h-2" />
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-muted-foreground truncate">
                            <span className="hidden sm:inline">Created by </span>{project.first_name} {project.last_name}
                          </div>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {Math.round(progress)}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Delete Project Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
              <DialogHeader>
                <div className="flex items-start gap-3 mb-2">
                  <div className="size-11 sm:size-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="size-5 sm:size-6 text-destructive" />
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-lg sm:text-xl">Delete Project?</DialogTitle>
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
                    <strong>Warning:</strong> Deleting "{projectToDelete?.name}" will permanently remove:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-xs sm:text-sm">
                      <li>{projectToDelete?.taskCount || 0} task{projectToDelete?.taskCount !== 1 ? 's' : ''}</li>
                      <li>All task comments and attachments</li>
                      <li>All task assignments</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirm" className="text-sm font-medium">
                      Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs sm:text-sm">delete my project</span> to confirm:
                    </Label>
                    <Input
                      id="delete-confirm"
                      placeholder="delete my project"
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
                  onClick={confirmDeleteProject}
                  disabled={deleteConfirmText !== "delete my project" || !deleteConfirmChecked}
                  className="w-full sm:w-auto h-10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project Permanently
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  )
}
