"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StatsCard } from "@/components/stats-card"
import { ChartCard } from "@/components/chart-card"
import { ReportTable } from "@/components/report-table"
import { DollarSign, Users, TrendingUp, Activity, BarChart as BarChartIcon, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Sample data for demonstration
const sampleRevenueData = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 3000 },
  { name: "Mar", value: 5000 },
  { name: "Apr", value: 4500 },
  { name: "May", value: 6000 },
  { name: "Jun", value: 5500 },
]

const userGrowthData = [
  { name: "Jan", value: 1200 },
  { name: "Feb", value: 1900 },
  { name: "Mar", value: 2400 },
  { name: "Apr", value: 2800 },
  { name: "May", value: 3500 },
  { name: "Jun", value: 4200 },
]

const categoryData = [
  { name: "Product A", value: 400, fill: '#22c55e' },
  { name: "Product B", value: 300, fill: '#3b82f6' },
  { name: "Product C", value: 200, fill: '#f59e0b' },
  { name: "Product D", value: 100, fill: '#ef4444' },
]

const transactionData = [
  { Date: "2024-11-14", Customer: "John Doe", Amount: "$2,500", Status: "Completed" },
  { Date: "2024-11-13", Customer: "Jane Smith", Amount: "$1,800", Status: "Pending" },
  { Date: "2024-11-12", Customer: "Bob Johnson", Amount: "$3,200", Status: "Completed" },
  { Date: "2024-11-11", Customer: "Alice Brown", Amount: "$950", Status: "Completed" },
  { Date: "2024-11-10", Customer: "Charlie Wilson", Amount: "$4,100", Status: "Failed" },
  { Date: "2024-11-09", Customer: "Diana Martinez", Amount: "$2,700", Status: "Completed" },
  { Date: "2024-11-08", Customer: "Edward Lee", Amount: "$1,500", Status: "Pending" },
  { Date: "2024-11-07", Customer: "Fiona Garcia", Amount: "$3,800", Status: "Completed" },
  { Date: "2024-11-06", Customer: "George Taylor", Amount: "$2,200", Status: "Completed" },
  { Date: "2024-11-05", Customer: "Helen Anderson", Amount: "$1,900", Status: "Pending" },
]

export default function ReportsPage() {
  const [revenueData, setRevenueData] = useState(sampleRevenueData)
  const [performanceData, setPerformanceData] = useState([
    { Metric: "Page Load Time", Value: "1.2s", Change: "+5%", Status: "Good" },
    { Metric: "Server Response", Value: "250ms", Change: "-10%", Status: "Excellent" },
    { Metric: "Error Rate", Value: "0.3%", Change: "-20%", Status: "Good" },
    { Metric: "Uptime", Value: "99.9%", Change: "+0.1%", Status: "Excellent" },
  ])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users data and transform it for the chart and performance table
  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        setLoading(true)
        // Use absolute URL for fetch to avoid SSR issues
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
        const response = await fetch(`${baseUrl}/api/users`) //localhost:3000/api/users
        
        if (!response.ok) {
          throw new Error(`Failed to fetch users data: ${response.status}`)
        }
        
        const users = await response.json()
        
        const chartData = users.map((user: any, index: number) => ({
          name: user.name || `User ${index + 1}`,
          value: user.id * 100 // Convert ID to revenue-like value
        }))
        
        // Transform users data into performance table format
        const tableData = users.map((user: any, index: number) => {
          const statuses = ["Good", "Excellent", "Average", "Poor"]
          const changes = ["+5%", "-10%", "+15%", "-5%", "+20%", "-15%"]
          
          return {
            Metric: user.name || `User ${index + 1}`,
            Value: user.id.toString(),
            Change: changes[index % changes.length],
            Status: statuses[index % statuses.length]
          }
        })
        
        setRevenueData(chartData.length > 0 ? chartData : sampleRevenueData)
        setPerformanceData(tableData.length > 0 ? tableData : [
          { Metric: "Page Load Time", Value: "1.2s", Change: "+5%", Status: "Good" },
          { Metric: "Server Response", Value: "250ms", Change: "-10%", Status: "Excellent" },
          { Metric: "Error Rate", Value: "0.3%", Change: "-20%", Status: "Good" },
          { Metric: "Uptime", Value: "99.9%", Change: "+0.1%", Status: "Excellent" },
        ])
        setError(null)
      } catch (err) {
        console.error('Error fetching users:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
        // Use sample data as fallback
        setRevenueData(sampleRevenueData)
        setPerformanceData([
          { Metric: "Page Load Time", Value: "1.2s", Change: "+5%", Status: "Good" },
          { Metric: "Server Response", Value: "250ms", Change: "-10%", Status: "Excellent" },
          { Metric: "Error Rate", Value: "0.3%", Change: "-20%", Status: "Good" },
          { Metric: "Uptime", Value: "99.9%", Change: "+0.1%", Status: "Excellent" },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchUsersData()
  }, [])
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-20 bg-gradient-to-b from-muted/50 to-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
              <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                Reports & Statistics
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="max-w-[700px] text-muted-foreground md:text-lg">
                Track your performance, monitor key metrics, and make data-driven decisions with comprehensive reports.
              </p>
              <div className="flex gap-4">
                <Button className="rounded-full">
                  <Calendar className="mr-2 size-4" />
                  Custom Range
                </Button>
                <Button variant="outline" className="rounded-full">
                  Export All
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
              <StatsCard
                title="Total Revenue"
                value="$45,231"
                change="+20.1%"
                changeType="positive"
                icon={DollarSign}
                description="From last month"
              />
              <StatsCard
                title="Active Users"
                value="4,235"
                change="+18.5%"
                changeType="positive"
                icon={Users}
                description="Currently online"
              />
              <StatsCard
                title="Growth Rate"
                value="12.5%"
                change="-4.3%"
                changeType="negative"
                icon={TrendingUp}
                description="Compared to last quarter"
              />
              <StatsCard
                title="Activity Score"
                value="98.2"
                change="-2.1%"
                changeType="negative"
                icon={Activity}
                description="Overall performance"
              />
            </div>

            {/* Charts Section */}
            <Tabs defaultValue="overview" className="w-full mb-12">
              <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="detailed">Detailed</TabsTrigger>
                <TabsTrigger value="comparison">Comparison</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6 mt-6">
                {error && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm">
                    ⚠️ {error} - Using sample data instead.
                  </div>
                )}
                <div className="grid gap-6 md:grid-cols-2">
                  <ChartCard
                    title={loading ? "Revenue Trend (Loading...)" : "Revenue Trend (Live Data)"}
                    data={revenueData}
                    type="line"
                    dataKey="value"
                    xAxisKey="name"
                    description={loading ? "Loading user data..." : "Revenue data based on user information"}
                  />
                  <ChartCard
                    title="User Growth"
                    data={userGrowthData}
                    type="bar"
                    dataKey="value"
                    xAxisKey="name"
                    description="New user registrations per month"
                  />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <ChartCard
                    title="Product Distribution"
                    data={categoryData}
                    type="pie"
                    dataKey="value"
                    xAxisKey="name"
                    description="Sales distribution by product category"
                  />
                  <div className="flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <BarChartIcon className="size-16 mx-auto text-primary/40" />
                      <h3 className="text-xl font-bold">Additional Insights</h3>
                      <p className="text-muted-foreground">
                        More detailed analytics and custom reports will be displayed here.
                      </p>
                      <Button variant="outline" className="rounded-full">
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="detailed" className="space-y-6 mt-6">
                <ReportTable
                  title="Recent Transactions"
                  columns={["Date", "Customer", "Amount", "Status"]}
                  data={transactionData}
                  description="Latest transactions and their status"
                />
              </TabsContent>
              
              <TabsContent value="comparison" className="space-y-6 mt-6">
                <ReportTable
                  title="Performance Metrics"
                  columns={["Metric", "Value", "Change", "Status"]}
                  data={performanceData}
                  description="System performance indicators"
                />
              </TabsContent>
            </Tabs>

            {/* Additional Reports Section */}
            <div className="grid gap-6 md:grid-cols-3 mb-12">
              <div className="rounded-xl border border-border/40 bg-gradient-to-b from-background to-muted/10 p-6 hover:shadow-md transition-all">
                <div className="size-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-4">
                  <DollarSign className="size-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Financial Reports</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Detailed breakdown of income, expenses, and profit margins.
                </p>
                <Button variant="outline" className="w-full rounded-full" size="sm">
                  View Report
                </Button>
              </div>
              
              <div className="rounded-xl border border-border/40 bg-gradient-to-b from-background to-muted/10 p-6 hover:shadow-md transition-all">
                <div className="size-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-4">
                  <Users className="size-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">User Analytics</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  User behavior, engagement metrics, and demographics.
                </p>
                <Button variant="outline" className="w-full rounded-full" size="sm">
                  View Report
                </Button>
              </div>
              
              <div className="rounded-xl border border-border/40 bg-gradient-to-b from-background to-muted/10 p-6 hover:shadow-md transition-all">
                <div className="size-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-4">
                  <TrendingUp className="size-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Growth Reports</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Track growth trends and forecast future performance.
                </p>
                <Button variant="outline" className="w-full rounded-full" size="sm">
                  View Report
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
