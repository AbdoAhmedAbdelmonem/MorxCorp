"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Download, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle, Users, FolderKanban, Calendar, FileText, BarChart3, PieChart, Activity } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChartCard } from "@/components/chart-card"
import { StatsCard } from "@/components/stats-card"

export default function TeamReportsPage() {
  const router = useRouter()
  const params = useParams()
  const teamUrl = params.teamUrl as string

  const [user, setUser] = useState<any>(null)
  const [team, setTeam] = useState<any>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("30") // days
  const [selectedProject, setSelectedProject] = useState("all")

  useEffect(() => {
    const storedSession = localStorage.getItem('student_session')
    if (storedSession) {
      setUser(JSON.parse(storedSession))
    }
  }, [])

  useEffect(() => {
    if (user?.user_id && teamUrl) {
      fetchTeamData()
      fetchReportData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, teamUrl])

  useEffect(() => {
    if (user?.user_id && teamUrl) {
      fetchReportData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, selectedProject])

  const fetchTeamData = async () => {
    try {
      const res = await fetch(`/api/teams/${teamUrl}?user_id=${user.user_id}`)
      const result = await res.json()
      if (result.success) {
        setTeam(result.data)
      }
    } catch (error) {
      console.error('Error fetching team:', error)
    }
  }

  const fetchReportData = async () => {
    if (!user?.user_id) return
    
    try {
      const res = await fetch(`/api/teams/${teamUrl}/reports?user_id=${user.user_id}&period=${selectedPeriod}&project=${selectedProject}`)
      const result = await res.json()
      console.log('Report API response:', result)
      if (result.success) {
        setReportData(result.data)
      } else {
        console.error('Report API error:', result.error)
        alert(result.error || 'Failed to load reports')
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
      alert('Failed to load reports. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateReport = async (format: 'pdf' | 'csv') => {
    if (!user?.user_id || !reportData) return

    try {
      const res = await fetch(`/api/teams/${teamUrl}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.user_id,
          period: selectedPeriod,
          project: selectedProject,
          format
        })
      })

      const result = await res.json()
      if (result.success) {
        // Download the report
        window.open(result.data.download_url, '_blank')
      } else {
        alert(result.error || 'Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    }
  }

  const exportReport = () => {
    if (!reportData) return

    // Create CSV content
    let csvContent = "Team Progress Report\n\n"
    csvContent += `Team: ${team.team_name}\n`
    csvContent += `Period: Last ${selectedPeriod} days\n`
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`
    
    csvContent += "=== Overview ===\n"
    csvContent += `Total Projects: ${reportData.overview.total_projects}\n`
    csvContent += `Total Tasks: ${reportData.overview.total_tasks}\n`
    csvContent += `Completed Tasks: ${reportData.overview.completed_tasks}\n`
    csvContent += `In Progress: ${reportData.overview.in_progress_tasks}\n`
    csvContent += `Overdue Tasks: ${reportData.overview.overdue_tasks}\n`
    csvContent += `Completion Rate: ${reportData.overview.completion_rate}%\n\n`
    
    csvContent += "=== Team Members Performance ===\n"
    csvContent += "Name,Assigned Tasks,Completed Tasks,Completion Rate\n"
    reportData.member_performance.forEach((member: any) => {
      csvContent += `${member.name},${member.assigned_tasks},${member.completed_tasks},${member.completion_rate}%\n`
    })
    
    csvContent += "\n=== Project Status ===\n"
    csvContent += "Project,Total Tasks,Completed,In Progress,Todo,Overdue\n"
    reportData.project_stats.forEach((proj: any) => {
      csvContent += `${proj.project_name},${proj.total_tasks},${proj.completed},${proj.in_progress},${proj.todo},${proj.overdue}\n`
    })

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-report-${team.team_name}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportJSON = () => {
    if (!reportData) return

    // Create comprehensive JSON report with AI-generated insights
    const jsonReport = {
      metadata: {
        team_name: team.team_name,
        team_url: teamUrl,
        report_period: `Last ${selectedPeriod} days`,
        generated_at: new Date().toISOString(),
        generated_by: user.name || 'Unknown User'
      },
      executive_summary: generateExecutiveSummary(),
      overview: {
        total_projects: reportData.overview.total_projects,
        total_tasks: reportData.overview.total_tasks,
        completed_tasks: reportData.overview.completed_tasks,
        in_progress_tasks: reportData.overview.in_progress_tasks,
        todo_tasks: reportData.overview.todo_tasks,
        overdue_tasks: reportData.overview.overdue_tasks,
        completion_rate: reportData.overview.completion_rate,
        completion_trend: reportData.overview.completion_trend
      },
      task_distribution: {
        completed: {
          count: reportData.overview.completed_tasks,
          percentage: reportData.overview.total_tasks > 0 
            ? ((reportData.overview.completed_tasks / reportData.overview.total_tasks) * 100).toFixed(1)
            : "0.0"
        },
        in_progress: {
          count: reportData.overview.in_progress_tasks,
          percentage: reportData.overview.total_tasks > 0
            ? ((reportData.overview.in_progress_tasks / reportData.overview.total_tasks) * 100).toFixed(1)
            : "0.0"
        },
        todo: {
          count: reportData.overview.todo_tasks,
          percentage: reportData.overview.total_tasks > 0
            ? ((reportData.overview.todo_tasks / reportData.overview.total_tasks) * 100).toFixed(1)
            : "0.0"
        },
        overdue: {
          count: reportData.overview.overdue_tasks,
          percentage: reportData.overview.total_tasks > 0
            ? ((reportData.overview.overdue_tasks / reportData.overview.total_tasks) * 100).toFixed(1)
            : "0.0"
        }
      },
      projects: reportData.project_stats.map((proj: any) => ({
        project_id: proj.project_id,
        project_name: proj.project_name,
        total_tasks: proj.total_tasks,
        completed: proj.completed,
        in_progress: proj.in_progress,
        todo: proj.todo,
        overdue: proj.overdue,
        completion_rate: proj.total_tasks > 0 ? ((proj.completed / proj.total_tasks) * 100).toFixed(1) : "0.0",
        status: proj.overdue > 0 ? 'At Risk' : proj.completed === proj.total_tasks ? 'Completed' : 'On Track'
      })),
      team_members: reportData.member_performance.map((member: any) => ({
        user_id: member.user_id,
        name: member.name,
        role: member.role,
        assigned_tasks: member.assigned_tasks,
        completed_tasks: member.completed_tasks,
        completion_rate: member.completion_rate,
        performance_level: member.completion_rate >= 80 ? 'Excellent' : 
                          member.completion_rate >= 60 ? 'Good' : 
                          member.completion_rate >= 40 ? 'Average' : 'Needs Improvement'
      })),
      recent_activity: reportData.recent_activity,
      insights: generateInsights()
    }

    // Download JSON
    const blob = new Blob([JSON.stringify(jsonReport, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-report-${team.team_name}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const generateExecutiveSummary = () => {
    if (!reportData) return ''
    
    const completionRate = reportData.overview.completion_rate || 0
    const totalTasks = reportData.overview.total_tasks
    const overdueCount = reportData.overview.overdue_tasks
    const trend = reportData.overview.completion_trend || 0

    let summary = `Team "${team.team_name}" Performance Report (Last ${selectedPeriod} Days)\n\n`
    
    summary += `📊 OVERVIEW: The team is managing ${totalTasks} tasks across ${reportData.overview.total_projects} projects `
    summary += `with a ${completionRate}% completion rate. `
    
    if (trend > 0) {
      summary += `Performance has improved by ${trend}% compared to the previous period, showing positive momentum. `
    } else if (trend < 0) {
      summary += `Performance has declined by ${Math.abs(trend)}% compared to the previous period, requiring attention. `
    } else {
      summary += `Performance remains stable compared to the previous period. `
    }
    
    summary += `\n\n🎯 STATUS BREAKDOWN:\n`
    summary += `• Completed: ${reportData.overview.completed_tasks} tasks (${completionRate}%)\n`
    summary += `• In Progress: ${reportData.overview.in_progress_tasks} tasks\n`
    summary += `• To Do: ${reportData.overview.todo_tasks} tasks\n`
    
    if (overdueCount > 0) {
      summary += `\n⚠️ ATTENTION NEEDED: ${overdueCount} tasks are overdue and require immediate action.\n`
    } else {
      summary += `\n✅ All tasks are on schedule with no overdue items.\n`
    }
    
    // Top performer
    const topPerformer = reportData.member_performance.reduce((top: any, member: any) => 
      member.completion_rate > (top?.completion_rate || 0) ? member : top, null)
    
    if (topPerformer) {
      summary += `\n🌟 TOP PERFORMER: ${topPerformer.name} leads with ${topPerformer.completion_rate}% completion rate (${topPerformer.completed_tasks}/${topPerformer.assigned_tasks} tasks).\n`
    }
    
    return summary
  }

  const generateInsights = () => {
    if (!reportData) return []
    
    const insights = []
    
    // Completion rate insight
    const completionRate = reportData.overview.completion_rate
    if (completionRate >= 80) {
      insights.push({
        type: 'positive',
        category: 'Performance',
        message: `Excellent completion rate of ${completionRate}%. The team is highly productive and on track.`
      })
    } else if (completionRate < 50) {
      insights.push({
        type: 'warning',
        category: 'Performance',
        message: `Completion rate of ${completionRate}% is below target. Consider redistributing workload or addressing blockers.`
      })
    }
    
    // Overdue tasks insight
    if (reportData.overview.overdue_tasks > 0) {
      insights.push({
        type: 'critical',
        category: 'Timeline',
        message: `${reportData.overview.overdue_tasks} overdue tasks detected. Immediate action required to get back on schedule.`
      })
    }
    
    // Project insight
    const atRiskProjects = reportData.project_stats.filter((p: any) => p.overdue > 0).length
    if (atRiskProjects > 0) {
      insights.push({
        type: 'warning',
        category: 'Projects',
        message: `${atRiskProjects} project(s) have overdue tasks and may be at risk of missing deadlines.`
      })
    }
    
    // Team balance insight
    const memberRates = reportData.member_performance.map((m: any) => m.completion_rate)
    const avgRate = memberRates.reduce((sum: number, rate: number) => sum + rate, 0) / memberRates.length
    const stdDev = Math.sqrt(memberRates.reduce((sum: number, rate: number) => sum + Math.pow(rate - avgRate, 2), 0) / memberRates.length)
    
    if (stdDev > 30) {
      insights.push({
        type: 'info',
        category: 'Team Balance',
        message: 'Significant variance in team member performance. Consider pairing high performers with those needing support.'
      })
    }
    
    // Workload insight
    const avgTasksPerMember = reportData.overview.total_tasks / reportData.member_performance.length
    if (avgTasksPerMember > 20) {
      insights.push({
        type: 'warning',
        category: 'Workload',
        message: `Average of ${avgTasksPerMember.toFixed(1)} tasks per member may indicate high workload. Monitor for burnout.`
      })
    }
    
    return insights
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!team || !reportData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <h2 className="text-2xl font-bold mb-2">No Report Data</h2>
            <p className="text-muted-foreground mb-4">Unable to load team reports. Please check the console for errors.</p>
            <Button onClick={() => router.push(`/teams/${teamUrl}`)}>
              <ArrowLeft className="mr-2 size-4" />
              Back to Team
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const completionRate = reportData.overview.completion_rate || 0
  const trend = reportData.overview.completion_trend || 0

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-6 bg-muted/40">
        <div className="container px-4 md:px-6">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => router.push(`/teams/${teamUrl}`)}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to Team
            </Button>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-1">Team Reports</h1>
                <p className="text-sm text-muted-foreground">{team.team_name} · Progress Analytics</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={exportReport} className="w-full sm:w-auto">
                  <Download className="mr-2 size-4" />
                  <span className="hidden sm:inline">Export CSV</span>
                  <span className="sm:hidden">CSV</span>
                </Button>
                <Button variant="outline" onClick={exportJSON} className="w-full sm:w-auto">
                  <FileText className="mr-2 size-4" />
                  <span className="hidden sm:inline">Export JSON Report</span>
                  <span className="sm:hidden">JSON</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {reportData.project_stats.map((proj: any) => (
                    <SelectItem key={proj.project_id} value={proj.project_id.toString()}>
                      {proj.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Overview Cards with StatsCard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Tasks"
              value={reportData.overview.total_tasks.toString()}
              change={`${reportData.overview.total_projects} projects`}
              changeType="neutral"
              icon={Activity}
              description="Across all projects"
            />
            <StatsCard
              title="Completed"
              value={reportData.overview.completed_tasks.toString()}
              change={`${completionRate}%`}
              changeType="positive"
              icon={CheckCircle2}
              description="Completion rate"
            />
            <StatsCard
              title="In Progress"
              value={reportData.overview.in_progress_tasks.toString()}
              change="Active"
              changeType="neutral"
              icon={Clock}
              description="Currently working on"
            />
            <StatsCard
              title="Overdue"
              value={reportData.overview.overdue_tasks.toString()}
              change={reportData.overview.overdue_tasks > 0 ? "Needs attention" : "All on track"}
              changeType={reportData.overview.overdue_tasks > 0 ? "negative" : "positive"}
              icon={AlertCircle}
              description="Past due date"
            />
          </div>

          {/* Interactive Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
            {/* Task Status Distribution Pie Chart - 3 Categories */}
            {(() => {
              const pieData = [
                { name: 'Done', value: reportData.overview.completed_tasks || 0, fill: '#22c55e' },
                { name: 'In Progress', value: reportData.overview.in_progress_tasks || 0, fill: '#3b82f6' },
                { name: 'To Do', value: reportData.overview.todo_tasks || 0, fill: '#6b7280' }
              ].filter(item => item.value > 0)
              
              console.log('Pie Chart Data:', pieData)
              console.log('Overview Data:', reportData.overview)
              
              return reportData.overview.total_tasks > 0 && pieData.length > 0 ? (
                <ChartCard
                  title="Task Status Distribution"
                  data={pieData}
                  type="pie"
                  dataKey="value"
                  description={`${completionRate}% overall completion rate - ${reportData.overview.total_tasks} total tasks`}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Task Status Distribution</CardTitle>
                    <CardDescription>No tasks available</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <PieChart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>No task data to display</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })()}

            {/* Project Progress Bar Chart */}
            <ChartCard
              title="Project Progress Overview"
              data={reportData.project_stats.map((proj: any) => ({
                name: proj.project_name.length > 15 ? proj.project_name.substring(0, 15) + '...' : proj.project_name,
                completed: proj.completed,
                'in progress': proj.in_progress,
                todo: proj.todo
              }))}
              type="bar"
              dataKey="completed"
              xAxisKey="name"
              description="Tasks completed per project"
            />

            {/* Member Performance Line Chart */}
            <ChartCard
              title="Team Member Performance"
              data={reportData.member_performance.map((member: any) => ({
                name: member.name.split(' ')[0],
                'Completion Rate': member.completion_rate,
                'Tasks': member.assigned_tasks
              }))}
              type="line"
              dataKey="Completion Rate"
              xAxisKey="name"
              description="Individual completion rates"
            />

            {/* Completion Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Completion Trend
                </CardTitle>
                <CardDescription>Task completion rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{completionRate}%</div>
                    <Badge variant={trend >= 0 ? "default" : "destructive"} className="gap-1">
                      {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(trend)}% vs previous period
                    </Badge>
                  </div>
                  <Progress value={completionRate} className="h-3" />
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">{reportData.overview.completed_tasks}</div>
                      <div className="text-xs text-muted-foreground">Done</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{reportData.overview.in_progress_tasks}</div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-600">{reportData.overview.todo_tasks}</div>
                      <div className="text-xs text-muted-foreground">To Do</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-red-600">{reportData.overview.overdue_tasks}</div>
                      <div className="text-xs text-muted-foreground">Overdue</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="projects" className="space-y-4">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
              <TabsTrigger value="projects" className="text-xs sm:text-sm">
                <FolderKanban className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Projects</span>
                <span className="sm:hidden">Proj</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="text-xs sm:text-sm">
                <Users className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Team Members</span>
                <span className="sm:hidden">Team</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs sm:text-sm">
                <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Timeline</span>
                <span className="sm:hidden">Time</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="text-xs sm:text-sm">
                <FileText className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Report & Insights</span>
                <span className="sm:hidden">Insights</span>
              </TabsTrigger>
            </TabsList>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Performance</CardTitle>
                  <CardDescription>Status breakdown by project</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.project_stats.map((project: any) => (
                      <div key={project.project_id} className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium">{project.project_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {project.total_tasks} total tasks
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400">
                              {project.completed} done
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400">
                              {project.in_progress} in progress
                            </Badge>
                            {project.overdue > 0 && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400">
                                {project.overdue} overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Progress 
                          value={(project.completed / project.total_tasks) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Members Tab */}
            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Member Performance</CardTitle>
                  <CardDescription>Individual contribution and completion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.member_performance.map((member: any, index: number) => (
                      <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar>
                            <AvatarImage src={member.profile_image} />
                            <AvatarFallback>{member.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-around sm:justify-end">
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold">{member.assigned_tasks}</div>
                            <div className="text-xs text-muted-foreground">Assigned</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{member.completed_tasks}</div>
                            <div className="text-xs text-muted-foreground">Completed</div>
                          </div>
                          <div className="text-center min-w-[60px] sm:min-w-[80px]">
                            <div className="text-xl sm:text-2xl font-bold">{member.completion_rate}%</div>
                            <div className="text-xs text-muted-foreground">Rate</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>Recent task updates and milestones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.recent_activity.map((activity: any, index: number) => (
                      <div key={index} className="flex gap-4 pb-4 border-b last:border-0">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            activity.type === 'completed' ? 'bg-green-500' :
                            activity.type === 'started' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`} />
                          {index < reportData.recent_activity.length - 1 && (
                            <div className="w-px h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.task_title}</p>
                          <p className="text-sm text-muted-foreground">
                            {activity.project_name} · {activity.user_name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={
                          activity.type === 'completed' ? 'default' :
                          activity.type === 'started' ? 'secondary' :
                          'outline'
                        }>
                          {activity.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Report & Insights Tab */}
            <TabsContent value="insights" className="space-y-4">
              {/* Executive Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Executive Summary
                  </CardTitle>
                  <CardDescription>AI-generated performance analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                    {generateExecutiveSummary()}
                  </div>
                </CardContent>
              </Card>

              {/* Key Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Key Insights & Recommendations
                  </CardTitle>
                  <CardDescription>Data-driven analysis and actionable suggestions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {generateInsights().map((insight: any, index: number) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border-l-4 ${
                          insight.type === 'positive' ? 'bg-green-50 border-green-500 dark:bg-green-950/20' :
                          insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-950/20' :
                          insight.type === 'critical' ? 'bg-red-50 border-red-500 dark:bg-red-950/20' :
                          'bg-blue-50 border-blue-500 dark:bg-blue-950/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${
                            insight.type === 'positive' ? 'text-green-600 dark:text-green-400' :
                            insight.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                            insight.type === 'critical' ? 'text-red-600 dark:text-red-400' :
                            'text-blue-600 dark:text-blue-400'
                          }`}>
                            {insight.type === 'positive' && '✅'}
                            {insight.type === 'warning' && '⚠️'}
                            {insight.type === 'critical' && '🚨'}
                            {insight.type === 'info' && 'ℹ️'}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm mb-1">{insight.category}</div>
                            <div className="text-sm text-muted-foreground">{insight.message}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {generateInsights().length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No specific insights at this time. Keep up the good work!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Task Distribution Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Detailed Task Distribution
                  </CardTitle>
                  <CardDescription>Statistical breakdown of task categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">✓ Done</span>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {reportData.overview.completed_tasks}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-500 mt-1">
                        {reportData.overview.total_tasks > 0 
                          ? ((reportData.overview.completed_tasks / reportData.overview.total_tasks) * 100).toFixed(1)
                          : "0.0"}% of total tasks
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-400">◐ In Progress</span>
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {reportData.overview.in_progress_tasks}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                        {reportData.overview.total_tasks > 0
                          ? ((reportData.overview.in_progress_tasks / reportData.overview.total_tasks) * 100).toFixed(1)
                          : "0.0"}% of total tasks
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-950/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-400">○ To Do</span>
                        <Activity className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="text-2xl font-bold text-gray-700 dark:text-gray-400">
                        {reportData.overview.todo_tasks}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-500 mt-1">
                        {reportData.overview.total_tasks > 0
                          ? ((reportData.overview.todo_tasks / reportData.overview.total_tasks) * 100).toFixed(1)
                          : "0.0"}% of total tasks
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
