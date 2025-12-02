"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ArrowLeft, MoreVertical, Trash2, Calendar, User, AlertCircle, CheckCircle2, Clock, Settings, Edit, MessageSquare, Paperclip, Send, X, Download, Heart, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"

interface Task {
  task_id: number
  title: string
  description: string
  status: number // 0=todo, 1=in-progress, 2=done
  priority: number
  due_date: string | null
  assigned_users: string | null // Format: "userId:Name||userId:Name"
  comment_count: number
}

interface Comment {
  comment_id: number
  comment_text: string
  created_at: string
  user_id: number
  first_name: string
  last_name: string
  profile_image: string | null
  likes: number
}

interface TaskFile {
  file_id: number
  file_name: string
  file_type: string
  file_size: number
  uploaded_at: string
  user_id: number
  first_name: string
  last_name: string
}

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectUrl = params.projectUrl as string

  const [user, setUser] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberRole, setNewMemberRole] = useState("member")
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false)
  const [editProjectName, setEditProjectName] = useState("")
  const [editProjectDescription, setEditProjectDescription] = useState("")
  
  // Task form state
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDesc, setNewTaskDesc] = useState("")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState("1")
  const [selectedAssignees, setSelectedAssignees] = useState<number[]>([])

  // Task details dialog
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [files, setFiles] = useState<TaskFile[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  useEffect(() => {
    const storedSession = localStorage.getItem('student_session')
    if (storedSession) {
      setUser(JSON.parse(storedSession))
    }
  }, [])

  useEffect(() => {
    if (user?.user_id) {
      fetchProject()
    }
  }, [user, projectUrl])

  useEffect(() => {
    if (project && user?.user_id) {
      fetchTasks()
      fetchTeamMembers()
    }
  }, [project, user])

  const fetchProject = async () => {
    if (!user?.user_id) {
      setIsLoading(false)
      return
    }
    
    try {
      const res = await fetch(`/api/projects/${projectUrl}?user_id=${user.user_id}`)
      const result = await res.json()
      
      if (result.success) {
        setProject(result.data)
      } else {
        // Set project with error flag for unauthorized access
        setProject({ 
          error: true, 
          message: result.error, 
          owner: result.data?.owner || null, 
          teamName: result.data?.teamName || null 
        })
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setProject({ error: true, message: 'Failed to load project', owner: null, teamName: null })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTasks = async () => {
    if (!project || !user?.user_id) return
    
    try {
      const res = await fetch(`/api/tasks?project_id=${project.project_id}&user_id=${user.user_id}`)
      const result = await res.json()
      
      if (result.success) {
        setTasks(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchTeamMembers = async () => {
    if (!project || !user?.user_id) {
      console.log('Cannot fetch team members - missing project or user_id', { project, user_id: user?.user_id })
      return
    }
    
    try {
      console.log('Fetching team members for:', project.team_url)
      const res = await fetch(`/api/teams/${project.team_url}/members?user_id=${user.user_id}`)
      const result = await res.json()
      
      console.log('Team members API response:', result)
      
      if (result.success) {
        console.log('Setting team members:', result.data)
        setTeamMembers(result.data || [])
      } else {
        console.error('Failed to fetch team members:', result.error)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !project || !user?.user_id) return
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          project_id: project.project_id,
          user_id: user.user_id,
          due_date: newTaskDueDate || null,
          priority: parseInt(newTaskPriority),
          assigned_to: selectedAssignees
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        setNewTaskTitle('')
        setNewTaskDesc('')
        setNewTaskDueDate('')
        setNewTaskPriority('1')
        setSelectedAssignees([])
        setIsCreateDialogOpen(false)
        fetchTasks()
      } else {
        alert(result.error || 'Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleUpdateTaskStatus = async (taskId: number, newStatus: number) => {
    if (!user?.user_id) return
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task_id: taskId, 
          user_id: user.user_id,
          status: newStatus 
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteTask = async (taskId: number, taskTitle: string) => {
    if (!user?.user_id) return
    if (!confirm(`Delete "${taskTitle}"?`)) return
    
    try {
      const res = await fetch(`/api/tasks?task_id=${taskId}&user_id=${user.user_id}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      
      if (result.success) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setNewTaskTitle(task.title)
    setNewTaskDesc(task.description || '')
    setNewTaskDueDate(task.due_date ? task.due_date.split('T')[0] : '')
    setNewTaskPriority(task.priority?.toString() || '1')
    
    // Parse assigned users
    if (task.assigned_users) {
      const assignees = task.assigned_users.split('||').map(a => {
        const [userId] = a.split(':')
        return parseInt(userId)
      })
      setSelectedAssignees(assignees)
    } else {
      setSelectedAssignees([])
    }
    
    setIsEditDialogOpen(true)
  }

  const handleUpdateTask = async () => {
    if (!editingTask || !newTaskTitle.trim() || !user?.user_id) return
    
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: editingTask.task_id,
          user_id: user.user_id,
          title: newTaskTitle,
          description: newTaskDesc,
          due_date: newTaskDueDate || null,
          priority: parseInt(newTaskPriority)
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        // Update assignments
        await fetch('/api/tasks/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_id: editingTask.task_id,
            user_id: user.user_id,
            assigned_to: selectedAssignees
          })
        })
        
        setNewTaskTitle('')
        setNewTaskDesc('')
        setNewTaskDueDate('')
        setNewTaskPriority('1')
        setSelectedAssignees([])
        setIsEditDialogOpen(false)
        setEditingTask(null)
        fetchTasks()
      } else {
        alert(result.error || 'Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !project || !user?.user_id) return
    
    try {
      const res = await fetch(`/api/teams/${project.team_url}/members`, {
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
        alert(`${result.message}`)
      } else {
        alert(result.error || 'Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const getDaysDiff = (dueDate: string | null) => {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Task details functions
  const openTaskDetails = async (task: Task) => {
    setSelectedTask(task)
    setIsTaskDetailsOpen(true)
    await Promise.all([
      fetchComments(task.task_id),
      fetchFiles(task.task_id)
    ])
  }

  const fetchComments = async (taskId: number) => {
    setIsLoadingComments(true)
    try {
      const res = await fetch(`/api/tasks/comments?task_id=${taskId}`)
      const result = await res.json()
      if (result.success) {
        setComments(result.data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  const fetchFiles = async (taskId: number) => {
    setIsLoadingFiles(true)
    try {
      const res = await fetch(`/api/tasks/files?task_id=${taskId}`)
      const result = await res.json()
      if (result.success) {
        setFiles(result.data)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask || !user?.user_id) return
    
    try {
      const res = await fetch('/api/tasks/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: selectedTask.task_id,
          user_id: user.user_id,
          comment_text: newComment
        })
      })
      
      const result = await res.json()
      if (result.success) {
        setComments(prev => [result.data, ...prev])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!user?.user_id) return
    if (!confirm('Delete this comment?')) return
    
    try {
      const res = await fetch(`/api/tasks/comments?comment_id=${commentId}&user_id=${user.user_id}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      if (result.success) {
        setComments(prev => prev.filter(c => c.comment_id !== commentId))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedTask || !user?.user_id) return
    
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('task_id', selectedTask.task_id.toString())
      formData.append('user_id', user.user_id.toString())
      
      const res = await fetch('/api/tasks/files', {
        method: 'POST',
        body: formData
      })
      
      const result = await res.json()
      if (result.success) {
        setFiles(prev => [result.data, ...prev])
      } else {
        alert(result.error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file')
    } finally {
      setUploadingFile(false)
      e.target.value = '' // Reset input
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    if (!user?.user_id) return
    if (!confirm('Delete this file?')) return
    
    try {
      const res = await fetch(`/api/tasks/files?file_id=${fileId}&user_id=${user.user_id}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      if (result.success) {
        setFiles(prev => prev.filter(f => f.file_id !== fileId))
      }
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  const handleLikeComment = async (commentId: number) => {
    if (!user?.user_id) return
    
    try {
      const res = await fetch('/api/tasks/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_id: commentId,
          user_id: user.user_id
        })
      })
      
      const result = await res.json()
      if (result.success) {
        setComments(prev => prev.map(c => 
          c.comment_id === commentId 
            ? { ...c, likes: result.data.likes }
            : c
        ))
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleEditProject = () => {
    setEditProjectName(project.project_name)
    setEditProjectDescription(project.description || "")
    setIsEditProjectDialogOpen(true)
  }

  const handleUpdateProject = async () => {
    if (!editProjectName.trim() || !user?.user_id) return

    try {
      const res = await fetch(`/api/projects/${projectUrl}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: editProjectName,
          description: editProjectDescription,
          user_id: user.user_id
        })
      })

      const result = await res.json()

      if (result.success) {
        setProject({ ...project, project_name: editProjectName, description: editProjectDescription })
        setIsEditProjectDialogOpen(false)
      } else {
        alert(result.error || 'Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      alert('An error occurred. Please try again.')
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 3) return "bg-red-500"
    if (priority === 2) return "bg-orange-500"
    return "bg-blue-500"
  }

  const getPriorityLabel = (priority: number) => {
    if (priority === 3) return "High"
    if (priority === 2) return "Medium"
    return "Low"
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!project) return null

  const todoTasks = tasks.filter(t => t.status === 0)
  const inProgressTasks = tasks.filter(t => t.status === 1)
  const doneTasks = tasks.filter(t => t.status === 2)

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project...</p>
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
              <AlertCircle className="size-10 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3">Login Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to access projects and their tasks. Please sign in to continue.
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
  if (project?.error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-muted/40">
          <div className="text-center px-4 max-w-lg">
            <div className="size-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="size-10 text-destructive" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-destructive">Unauthorized Access</h1>
            <p className="text-muted-foreground mb-4">
              You are not authorized to view this project. Only team members can access team projects.
            </p>
            {project.teamName && (
              <Alert className="mb-6 border-primary/50 bg-primary/5">
                <AlertDescription className="text-left">
                  <p className="font-semibold mb-2">Need access to this project?</p>
                  <p className="text-sm mb-1">This project belongs to team: <span className="font-semibold text-primary">{project.teamName}</span></p>
                  {project.owner && (
                    <p className="text-sm">
                      Contact the team owner: <span className="font-mono font-semibold text-primary">{project.owner.name}</span>
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}
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

  if (!project) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6 bg-muted/40">
        <div className="container px-4 md:px-6">
          {/* Project Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{project.project_name}</h1>
                <p className="text-sm text-muted-foreground">{project.team_name} · {tasks.length} tasks</p>
              </div>
              
              <div className="flex items-center gap-2">
                {(project.role === 'owner' || project.role === 'admin') && (
                  <Button variant="outline" size="icon" onClick={handleEditProject}>
                    <Edit className="size-4" />
                  </Button>
                )}
                
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 size-4" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>Add a task to {project.project_name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="taskTitle">Task Title *</Label>
                      <Input
                        id="taskTitle"
                        placeholder="Fix bug in login page"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taskDesc">Description</Label>
                      <Textarea
                        id="taskDesc"
                        placeholder="Describe the task..."
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                          <SelectTrigger id="priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Low</SelectItem>
                            <SelectItem value="2">Medium</SelectItem>
                            <SelectItem value="3">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Assign To</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedAssignees.length === 0 ? (
                              "Select team members..."
                            ) : (
                              <span className="flex items-center gap-1">
                                {selectedAssignees.length} member{selectedAssignees.length > 1 ? 's' : ''} selected
                              </span>
                            )}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <div className="max-h-[300px] overflow-y-auto p-2">
                            {teamMembers.length === 0 ? (
                              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                No team members found
                              </div>
                            ) : (
                              teamMembers.map((member) => {
                                const isSelected = selectedAssignees.includes(member.user_id)
                                return (
                                  <div
                                    key={member.user_id}
                                    className="flex items-center space-x-3 rounded-md px-3 py-2 hover:bg-accent cursor-pointer"
                                    onClick={() => {
                                      setSelectedAssignees(prev =>
                                        isSelected
                                          ? prev.filter(id => id !== member.user_id)
                                          : [...prev, member.user_id]
                                      )
                                    }}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        setSelectedAssignees(prev =>
                                          checked
                                            ? [...prev, member.user_id]
                                            : prev.filter(id => id !== member.user_id)
                                        )
                                      }}
                                    />
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={member.profile_image || undefined} />
                                      <AvatarFallback>
                                        {member.first_name[0]}{member.last_name[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">
                                        {member.first_name} {member.last_name}
                                      </p>
                                      <p className="text-xs text-muted-foreground capitalize">
                                        {member.role || 'member'}
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <Check className="h-4 w-4 text-primary" />
                                    )}
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                      {selectedAssignees.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedAssignees.map((userId) => {
                            const member = teamMembers.find(m => m.user_id === userId)
                            if (!member) return null
                            return (
                              <Badge key={userId} variant="secondary" className="gap-1">
                                {member.first_name} {member.last_name}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() => {
                                    setSelectedAssignees(prev => prev.filter(id => id !== userId))
                                  }}
                                />
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>
                      Create Task
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </div>

          {/* Edit Task Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>Update task details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editTaskTitle">Task Title *</Label>
                  <Input
                    id="editTaskTitle"
                    placeholder="Fix bug in login page"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editTaskDesc">Description</Label>
                  <Textarea
                    id="editTaskDesc"
                    placeholder="Describe the task..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editDueDate">Due Date</Label>
                    <Input
                      id="editDueDate"
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editPriority">Priority</Label>
                    <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                      <SelectTrigger id="editPriority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Low</SelectItem>
                        <SelectItem value="2">Medium</SelectItem>
                        <SelectItem value="3">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assign To</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedAssignees.length === 0 ? (
                          "Select team members..."
                        ) : (
                          <span className="flex items-center gap-1">
                            {selectedAssignees.length} member{selectedAssignees.length > 1 ? 's' : ''} selected
                          </span>
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <div className="max-h-[300px] overflow-y-auto p-2">
                        {teamMembers.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            No team members found
                          </div>
                        ) : (
                          teamMembers.map((member) => {
                            const isSelected = selectedAssignees.includes(member.user_id)
                            return (
                              <div
                                key={member.user_id}
                                className="flex items-center space-x-3 rounded-md px-3 py-2 hover:bg-accent cursor-pointer"
                                onClick={() => {
                                  setSelectedAssignees(prev =>
                                    isSelected
                                      ? prev.filter(id => id !== member.user_id)
                                      : [...prev, member.user_id]
                                  )
                                }}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    setSelectedAssignees(prev =>
                                      checked
                                        ? [...prev, member.user_id]
                                        : prev.filter(id => id !== member.user_id)
                                    )
                                  }}
                                />
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.profile_image || undefined} />
                                  <AvatarFallback>
                                    {member.first_name[0]}{member.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {member.first_name} {member.last_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {member.role || 'member'}
                                  </p>
                                </div>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {selectedAssignees.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedAssignees.map((userId) => {
                        const member = teamMembers.find(m => m.user_id === userId)
                        if (!member) return null
                        return (
                          <Badge key={userId} variant="secondary" className="gap-1">
                            {member.first_name} {member.last_name}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => {
                                setSelectedAssignees(prev => prev.filter(id => id !== userId))
                              }}
                            />
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateTask}>Update Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Member Dialog */}
          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Invite a user to join {project.team_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="memberEmail">User Email *</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    placeholder="user@example.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberRole">Role</Label>
                  <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                    <SelectTrigger id="memberRole">
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
                <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                <Button onClick={handleAddMember}>Add Member</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Settings Dialog */}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="size-5" />
                  Project & Team Details
                </DialogTitle>
                <DialogDescription>
                  Complete information from database
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Project Details Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">Project Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium">Project ID</p>
                      <p className="font-mono">{project.project_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Project Name</p>
                      <p>{project.project_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Project URL</p>
                      <p className="font-mono text-blue-600">{project.project_url}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Team ID</p>
                      <p className="font-mono">{project.team_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Created At</p>
                      <p>{project.created_at ? new Date(project.created_at).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Total Tasks</p>
                      <p className="font-semibold">{tasks.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Tasks Status</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">Todo: {tasks.filter(t => t.status === 0).length}</Badge>
                        <Badge variant="secondary">Progress: {tasks.filter(t => t.status === 1).length}</Badge>
                        <Badge variant="secondary">Done: {tasks.filter(t => t.status === 2).length}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Details Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold border-b pb-2">Team Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground font-medium">Team ID</p>
                      <p className="font-mono">{project.team_id}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Team Name</p>
                      <p>{project.team_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Team URL</p>
                      <p className="font-mono text-blue-600">{project.team_url}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Total Members</p>
                      <p className="font-semibold">{teamMembers.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Your Role</p>
                      <Badge variant="outline" className="capitalize">{project.role}</Badge>
                    </div>
                  </div>
                </div>

                {/* Team Members Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-lg font-semibold">Team Members ({teamMembers.length})</h3>
                    {(project.role === 'owner' || project.role === 'admin') && (
                      <Button size="sm" variant="outline" onClick={() => setIsAddMemberOpen(true)}>
                        <Plus className="mr-1 size-3" />
                        Add Member
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {teamMembers.map((member) => (
                      <div key={member.user_id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10">
                            <AvatarImage src={member.profile_image} />
                            <AvatarFallback>
                              {member.first_name[0]}{member.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{member.first_name} {member.last_name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="capitalize">
                            {member.role}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">ID: {member.user_id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Task Details Dialog */}
          <Dialog open={isTaskDetailsOpen} onOpenChange={setIsTaskDetailsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedTask?.title}</DialogTitle>
                <DialogDescription>
                  Task ID: {selectedTask?.task_id} | {selectedTask?.description}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content - Comments */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Task Info */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn("text-xs", getPriorityColor(selectedTask?.priority || 1), "text-white border-0")}>
                        {getPriorityLabel(selectedTask?.priority || 1)}
                      </Badge>
                      {selectedTask?.due_date && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="mr-1 size-3" />
                          Due: {new Date(selectedTask.due_date).toLocaleDateString()}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs capitalize">
                        {selectedTask?.status === 0 ? 'To Do' : selectedTask?.status === 1 ? 'In Progress' : 'Done'}
                      </Badge>
                    </div>

                    <Separator />

                    {/* Comments Section */}
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <MessageSquare className="size-4" />
                        Comments ({comments.length})
                      </h3>
                      
                      {/* Add Comment Form */}
                      <div className="flex gap-2">
                        <Avatar className="size-8">
                          <AvatarImage src={user?.profile_image} />
                          <AvatarFallback>
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                          />
                          <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                            <Send className="size-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Comments List */}
                      <ScrollArea className="h-[300px] pr-4">
                        {isLoadingComments ? (
                          <div className="text-center py-8 text-sm text-muted-foreground">Loading comments...</div>
                        ) : comments.length === 0 ? (
                          <div className="text-center py-8 text-sm text-muted-foreground">No comments yet. Be the first to comment!</div>
                        ) : (
                          <div className="space-y-4">
                            {comments.map((comment) => (
                              <div key={comment.comment_id} className="flex gap-3">
                                <Avatar className="size-8">
                                  <AvatarImage src={comment.profile_image || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {comment.first_name[0]}{comment.last_name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium">
                                        {comment.first_name} {comment.last_name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(comment.created_at).toLocaleString()}
                                      </p>
                                    </div>
                                    {comment.user_id === user?.user_id && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-6"
                                        onClick={() => handleDeleteComment(comment.comment_id)}
                                      >
                                        <X className="size-3" />
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-sm bg-muted p-2 rounded-lg">{comment.comment_text}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs hover:text-red-500 transition-colors"
                                      onClick={() => handleLikeComment(comment.comment_id)}
                                    >
                                      <Heart className={cn("size-3 mr-1", (comment.likes || 0) > 0 && "fill-red-500 text-red-500")} />
                                      <span className="font-medium">{comment.likes || 0}</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>

                  {/* Sidebar - Assignments & Files */}
                  <div className="space-y-4">
                    {/* Assigned To Section */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <User className="size-4" />
                        Assigned To
                      </h3>
                      <div className="space-y-2">
                        {selectedTask?.assigned_users ? (
                          selectedTask.assigned_users.split('||').map((assignee, idx) => {
                            const [userId, ...nameParts] = assignee.split(':')
                            const name = nameParts.join(':')
                            return (
                              <div key={idx} className="flex items-center gap-2 text-sm">
                                <Avatar className="size-6">
                                  <AvatarFallback className="text-xs">
                                    {name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{name}</span>
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground">No one assigned</p>
                        )}
                      </div>
                      {(project?.role === 'owner' || project?.role === 'admin') && (
                        <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => handleEditTask(selectedTask!)}>
                          <User className="mr-1 size-3" />
                          Assign Members
                        </Button>
                      )}
                    </div>

                    <Separator />

                    {/* Files Section */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Paperclip className="size-4" />
                        Files ({files.length})
                      </h3>
                      
                      {/* Upload File Button */}
                      <div className="relative">
                        <input
                          type="file"
                          id="file-upload"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          aria-label="Upload file"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          disabled={uploadingFile}
                        >
                          <Plus className="mr-1 size-3" />
                          {uploadingFile ? 'Uploading...' : 'Upload File'}
                        </Button>
                      </div>

                      {/* Files List */}
                      <ScrollArea className="h-[200px]">
                        {isLoadingFiles ? (
                          <div className="text-center py-4 text-sm text-muted-foreground">Loading files...</div>
                        ) : files.length === 0 ? (
                          <div className="text-center py-4 text-sm text-muted-foreground">No files attached</div>
                        ) : (
                          <div className="space-y-2">
                            {files.map((file) => (
                              <div key={file.file_id} className="flex items-center gap-2 p-2 rounded-lg border bg-card text-xs">
                                <Paperclip className="size-3 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{file.file_name}</p>
                                  <p className="text-muted-foreground">
                                    {formatFileSize(file.file_size)} • {file.first_name} {file.last_name}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    asChild
                                  >
                                    <a href={`/api/tasks/files/download?file_id=${file.file_id}`} download target="_blank" rel="noopener noreferrer" title="Download file">
                                      <Download className="size-3" />
                                    </a>
                                  </Button>
                                  {file.user_id === user?.user_id && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-6"
                                      onClick={() => handleDeleteFile(file.file_id)}
                                    >
                                      <X className="size-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTaskDetailsOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Project Dialog */}
          <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
                <DialogDescription>
                  Update your project's name and description
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-project-name">Project Name *</Label>
                  <Input
                    id="edit-project-name"
                    placeholder="My Project"
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-project-description">Description</Label>
                  <Textarea
                    id="edit-project-description"
                    placeholder="Describe what this project is about..."
                    value={editProjectDescription}
                    onChange={(e) => setEditProjectDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditProjectDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateProject}
                  disabled={!editProjectName.trim()}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Kanban Board */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* To Do Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-gray-500"></div>
                <h3 className="font-semibold">To Do</h3>
                <Badge variant="secondary" className="ml-auto">{todoTasks.length}</Badge>
              </div>
              <div className="space-y-3">
                {todoTasks.map((task) => (
                  <TaskCard
                    key={task.task_id}
                    task={task}
                    onStatusChange={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                    onOpenDetails={openTaskDetails}
                    userRole={project.role}
                    getDaysDiff={getDaysDiff}
                    getPriorityColor={getPriorityColor}
                    getPriorityLabel={getPriorityLabel}
                  />
                ))}
                {todoTasks.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-blue-500"></div>
                <h3 className="font-semibold">In Progress</h3>
                <Badge variant="secondary" className="ml-auto">{inProgressTasks.length}</Badge>
              </div>
              <div className="space-y-3">
                {inProgressTasks.map((task) => (
                  <TaskCard
                    key={task.task_id}
                    task={task}
                    onStatusChange={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                    onOpenDetails={openTaskDetails}
                    userRole={project.role}
                    getDaysDiff={getDaysDiff}
                    getPriorityColor={getPriorityColor}
                    getPriorityLabel={getPriorityLabel}
                  />
                ))}
                {inProgressTasks.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </div>

            {/* Done Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500"></div>
                <h3 className="font-semibold">Done</h3>
                <Badge variant="secondary" className="ml-auto">{doneTasks.length}</Badge>
              </div>
              <div className="space-y-3">
                {doneTasks.map((task) => (
                  <TaskCard
                    key={task.task_id}
                    task={task}
                    onStatusChange={handleUpdateTaskStatus}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                    onOpenDetails={openTaskDetails}
                    userRole={project.role}
                    getDaysDiff={getDaysDiff}
                    getPriorityColor={getPriorityColor}
                    getPriorityLabel={getPriorityLabel}
                  />
                ))}
                {doneTasks.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Task Card Component
function TaskCard({ 
  task, 
  onStatusChange, 
  onDelete,
  onEdit,
  onOpenDetails,
  userRole,
  getDaysDiff,
  getPriorityColor,
  getPriorityLabel
}: {
  task: Task
  onStatusChange: (id: number, status: number) => void
  onDelete: (id: number, title: string) => void
  onEdit: (task: Task) => void
  onOpenDetails: (task: Task) => void
  userRole: string
  getDaysDiff: (date: string | null) => number | null
  getPriorityColor: (priority: number) => string
  getPriorityLabel: (priority: number) => string
}) {
  const daysDiff = getDaysDiff(task.due_date)
  const isOverdue = daysDiff !== null && daysDiff < 0
  const isDueSoon = daysDiff !== null && daysDiff >= 0 && daysDiff <= 2

  return (
    <Card className="group hover:shadow-md transition-all">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
            {task.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(userRole === 'owner' || userRole === 'admin') && (
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  Edit Task
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onStatusChange(task.task_id, 0)}>
                Move to To Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(task.task_id, 1)}>
                Move to In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(task.task_id, 2)}>
                Move to Done
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(task.task_id, task.title)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 size-3" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={cn("text-xs", getPriorityColor(task.priority), "text-white border-0")}>
            {getPriorityLabel(task.priority)}
          </Badge>
          
          {task.due_date && (
            <Badge variant="outline" className={cn(
              "text-xs",
              isOverdue && "bg-red-100 text-red-700 border-red-200",
              isDueSoon && "bg-yellow-100 text-yellow-700 border-yellow-200"
            )}>
              <Calendar className="mr-1 size-3" />
              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Badge>
          )}
        </div>

        {task.assigned_users && (() => {
          const assignees = task.assigned_users.split('||').map(a => {
            const [userId, ...nameParts] = a.split(':')
            return { userId, name: nameParts.join(':') }
          })
          return assignees.length > 0 && (
            <div className="flex items-center gap-1">
              {assignees.slice(0, 3).map((assignee, idx) => (
                <Avatar key={idx} className="size-6 border-2 border-background">
                  <AvatarFallback className="text-[10px]">
                    {assignee.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
              {assignees.length > 3 && (
                <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">
                  +{assignees.length - 3}
                </div>
              )}
            </div>
          )
        })()}

        <div className="flex items-center justify-between pt-2 border-t">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenDetails(task)}
          >
            <MessageSquare className="mr-1 size-3" />
            {task.comment_count || 0} Comments
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-7 text-xs"
            onClick={() => onOpenDetails(task)}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

