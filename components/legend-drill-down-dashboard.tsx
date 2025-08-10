"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  Users,
  Target,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react"

interface DrillDownData {
  overview: {
    total_predictions: number
    avg_execution_time: number
    cache_hit_rate: number
    error_rate: number
    unique_teams: number
    top_requested_matchups: Array<{
      home_team: string
      away_team: string
      request_count: number
    }>
  }
  performance_trends: {
    hourly_stats: Array<{
      hour: number
      requests: number
      avg_response_time: number
      error_count: number
    }>
    daily_stats: Array<{
      date: string
      requests: number
      avg_response_time: number
      cache_hit_rate: number
    }>
  }
  team_analytics: {
    most_analyzed_teams: Array<{
      team_name: string
      analysis_count: number
      avg_resilience_score: number
      avg_comeback_frequency: number
    }>
    resilience_distribution: {
      legend: number
      beast: number
      strong: number
      average: number
      weak: number
    }
  }
  alert_summary: {
    total_alerts: number
    critical_alerts: number
    resolved_alerts: number
    pending_alerts: number
    recent_alerts: Array<{
      type: string
      message: string
      severity: string
      timestamp: string
      resolved: boolean
    }>
  }
}

interface LegendDrillDownDashboardProps {
  dateRange?: string
  autoRefresh?: boolean
}

export default function LegendDrillDownDashboard({
  dateRange = "7d",
  autoRefresh = true,
}: LegendDrillDownDashboardProps) {
  const [data, setData] = useState<DrillDownData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<string>("overview")
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchDrillDownData()

    if (autoRefresh) {
      const interval = setInterval(fetchDrillDownData, 30000) // 30 seconds
      setRefreshInterval(interval)

      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [dateRange, autoRefresh])

  const fetchDrillDownData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Mock data for demonstration
      const mockData: DrillDownData = {
        overview: {
          total_predictions: 2847,
          avg_execution_time: 52.3,
          cache_hit_rate: 0.847,
          error_rate: 0.023,
          unique_teams: 28,
          top_requested_matchups: [
            { home_team: "Barcelona", away_team: "Real Madrid", request_count: 156 },
            { home_team: "Valencia", away_team: "Sevilla", request_count: 134 },
            { home_team: "Bilbao", away_team: "San Sebastian", request_count: 98 },
          ],
        },
        performance_trends: {
          hourly_stats: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            requests: Math.floor(Math.random() * 200) + 50,
            avg_response_time: Math.floor(Math.random() * 40) + 30,
            error_count: Math.floor(Math.random() * 5),
          })),
          daily_stats: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            requests: Math.floor(Math.random() * 500) + 200,
            avg_response_time: Math.floor(Math.random() * 30) + 40,
            cache_hit_rate: Math.random() * 0.3 + 0.7,
          })),
        },
        team_analytics: {
          most_analyzed_teams: [
            { team_name: "Barcelona", analysis_count: 234, avg_resilience_score: 0.387, avg_comeback_frequency: 0.234 },
            {
              team_name: "Real Madrid",
              analysis_count: 221,
              avg_resilience_score: 0.412,
              avg_comeback_frequency: 0.267,
            },
            { team_name: "Valencia", analysis_count: 189, avg_resilience_score: 0.298, avg_comeback_frequency: 0.198 },
            { team_name: "Sevilla", analysis_count: 167, avg_resilience_score: 0.356, avg_comeback_frequency: 0.223 },
          ],
          resilience_distribution: {
            legend: 12,
            beast: 28,
            strong: 35,
            average: 18,
            weak: 7,
          },
        },
        alert_summary: {
          total_alerts: 23,
          critical_alerts: 2,
          resolved_alerts: 18,
          pending_alerts: 3,
          recent_alerts: [
            {
              type: "performance",
              message: "API response time exceeded 80ms threshold",
              severity: "medium",
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              resolved: false,
            },
            {
              type: "resilience_change",
              message: "Barcelona resilience score changed by +32%",
              severity: "low",
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              resolved: true,
            },
          ],
        },
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800))
      setData(mockData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ismeretlen hiba")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return "text-green-600"
    if (value >= thresholds.warning) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusIcon = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (value >= thresholds.warning) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  if (loading && !data) {
    return (
      <Card className="rounded-3xl shadow-lg border-0 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              LEGEND DRILL-DOWN LOADING
            </h3>
            <p className="text-slate-600 text-sm">Analytics dashboard betöltése...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="rounded-3xl shadow-sm border-0 bg-red-50/80">
        <CardContent className="p-8">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Dashboard Hiba</h3>
            <p className="text-red-600 text-sm">{error}</p>
            <Button onClick={fetchDrillDownData} className="mt-4 bg-transparent" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Újrapróbálás
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="rounded-3xl shadow-lg border-0 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LEGEND MODE Analytics
                </h2>
                <p className="text-sm text-slate-600">Drill-down Dashboard • {dateRange} időszak</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={fetchDrillDownData} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Frissítés
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Összes predikció</p>
                <p className="text-2xl font-bold text-slate-800">{data.overview.total_predictions.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Átlagos válaszidő</p>
                <p
                  className={`text-2xl font-bold ${getStatusColor(data.overview.avg_execution_time, { good: 70, warning: 50 })}`}
                >
                  {data.overview.avg_execution_time}ms
                </p>
              </div>
              <div className="flex items-center">
                {getStatusIcon(70 - data.overview.avg_execution_time, { good: 20, warning: 0 })}
                <Clock className="h-8 w-8 text-green-500 ml-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Cache találati arány</p>
                <p className="text-2xl font-bold text-green-600">{Math.round(data.overview.cache_hit_rate * 100)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Hibaarány</p>
                <p
                  className={`text-2xl font-bold ${getStatusColor(100 - data.overview.error_rate * 100, { good: 98, warning: 95 })}`}
                >
                  {(data.overview.error_rate * 100).toFixed(1)}%
                </p>
              </div>
              {getStatusIcon(100 - data.overview.error_rate * 100, { good: 98, warning: 95 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card className="rounded-2xl border-0 bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Teljesítmény trendek
          </h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Stats */}
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-3">Óránkénti kérések (24h)</h4>
              <div className="space-y-2">
                {data.performance_trends.hourly_stats.slice(0, 8).map((stat, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{stat.hour}:00</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(stat.requests / 250) * 100} className="w-20 h-2" />
                      <span className="font-medium w-12 text-right">{stat.requests}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Stats */}
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-3">Napi statisztikák (7 nap)</h4>
              <div className="space-y-2">
                {data.performance_trends.daily_stats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{new Date(stat.date).toLocaleDateString("hu-HU")}</span>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500">Req:</span>
                        <span className="font-medium">{stat.requests}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500">RT:</span>
                        <span className="font-medium">{stat.avg_response_time}ms</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Legtöbbet elemzett csapatok
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.team_analytics.most_analyzed_teams.map((team, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div className="font-medium text-slate-800">{team.team_name}</div>
                    <div className="text-xs text-slate-500">
                      Resilience: {team.avg_resilience_score.toFixed(3)} • Comeback:{" "}
                      {Math.round(team.avg_comeback_frequency * 100)}%
                    </div>
                  </div>
                  <Badge variant="secondary">{team.analysis_count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Resilience eloszlás
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.team_analytics.resilience_distribution).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        level === "legend"
                          ? "bg-purple-500"
                          : level === "beast"
                            ? "bg-orange-500"
                            : level === "strong"
                              ? "bg-blue-500"
                              : level === "average"
                                ? "bg-gray-500"
                                : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm font-medium capitalize">{level}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={(count / 100) * 100} className="w-16 h-2" />
                    <span className="text-sm font-bold w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Summary */}
      <Card className="rounded-2xl border-0 bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alert összefoglaló
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Kritikus: {data.alert_summary.critical_alerts}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Függő: {data.alert_summary.pending_alerts}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Megoldott: {data.alert_summary.resolved_alerts}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.alert_summary.recent_alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl border-l-4 ${
                  alert.severity === "critical"
                    ? "bg-red-50 border-red-500"
                    : alert.severity === "medium"
                      ? "bg-yellow-50 border-yellow-500"
                      : "bg-blue-50 border-blue-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-800">{alert.message}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {alert.type} • {new Date(alert.timestamp).toLocaleString("hu-HU")}
                    </div>
                  </div>
                  <Badge variant={alert.resolved ? "default" : "destructive"}>
                    {alert.resolved ? "Megoldva" : "Aktív"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
