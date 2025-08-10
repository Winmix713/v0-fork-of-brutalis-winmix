"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Activity, Users, Zap, TrendingUp, Bell, Eye, BarChart3 } from "lucide-react"

interface MonitoringMetrics {
  performance: {
    avgExecutionTime: number
    p95ExecutionTime: number
    errorRate: number
    cacheHitRate: number
  }
  usage: {
    dailyRequests: number
    uniqueTeamPairs: number
    abTestParticipants: number
    alertsTriggered: number
  }
  quality: {
    dataConsistency: number
    featureStability: number
    userEngagement: number
    predictionAccuracy: number
  }
}

interface LegendMonitoringWidgetProps {
  showDetailed?: boolean
}

export default function LegendMonitoringWidget({ showDetailed = false }: LegendMonitoringWidgetProps) {
  const [metrics, setMetrics] = useState<MonitoringMetrics | null>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMonitoringData()
    const interval = setInterval(loadMonitoringData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadMonitoringData = async () => {
    try {
      // Mock monitoring data
      const mockMetrics: MonitoringMetrics = {
        performance: {
          avgExecutionTime: Math.floor(Math.random() * 20) + 45, // 45-65ms
          p95ExecutionTime: Math.floor(Math.random() * 20) + 60, // 60-80ms
          errorRate: Math.random() * 3, // 0-3%
          cacheHitRate: Math.floor(Math.random() * 15) + 80, // 80-95%
        },
        usage: {
          dailyRequests: Math.floor(Math.random() * 4000) + 1000, // 1000-5000
          uniqueTeamPairs: Math.floor(Math.random() * 100) + 50, // 50-150
          abTestParticipants: Math.floor(Math.random() * 600) + 200, // 200-800
          alertsTriggered: Math.floor(Math.random() * 5), // 0-5
        },
        quality: {
          dataConsistency: Math.floor(Math.random() * 9) + 90, // 90-99%
          featureStability: Math.floor(Math.random() * 4) + 95, // 95-99%
          userEngagement: Math.floor(Math.random() * 15) + 70, // 70-85%
          predictionAccuracy: Math.floor(Math.random() * 15) + 75, // 75-90%
        },
      }

      setMetrics(mockMetrics)

      // Mock alerts
      const mockAlerts = []
      if (Math.random() < 0.3) {
        // 30% chance of alert
        mockAlerts.push({
          type: "resilience_change",
          severity: "medium",
          message: "Barcelona resilience score changed by 28%",
          timestamp: new Date().toISOString(),
        })
      }
      setAlerts(mockAlerts)
    } catch (error) {
      console.error("Failed to load monitoring data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthStatus = () => {
    if (!metrics) return { status: "unknown", color: "bg-gray-500" }

    const avgExecution = metrics.performance.avgExecutionTime
    const errorRate = metrics.performance.errorRate

    if (avgExecution < 60 && errorRate < 2) {
      return { status: "excellent", color: "bg-green-500" }
    } else if (avgExecution < 70 && errorRate < 3) {
      return { status: "good", color: "bg-blue-500" }
    } else if (avgExecution < 80 && errorRate < 5) {
      return { status: "warning", color: "bg-yellow-500" }
    } else {
      return { status: "critical", color: "bg-red-500" }
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl border-0 bg-slate-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent"></div>
            <span className="text-sm text-slate-600">Loading monitoring data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) return null

  const health = getHealthStatus()

  if (!showDetailed) {
    // Compact widget
    return (
      <Card className="rounded-2xl border-0 bg-slate-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${health.color}`}></div>
              <div>
                <div className="text-sm font-medium text-slate-800">LEGEND Monitoring</div>
                <div className="text-xs text-slate-500">{metrics.performance.avgExecutionTime}ms avg</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {alerts.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <Bell className="h-3 w-3 mr-1" />
                  {alerts.length}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                {metrics.usage.dailyRequests}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed monitoring dashboard
  return (
    <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">LEGEND MODE Monitoring</h3>
              <p className="text-sm text-slate-600">Enterprise-grade system health</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={`${health.color} text-white`}>
              <Activity className="h-3 w-3 mr-1" />
              {health.status.toUpperCase()}
            </Badge>
            {alerts.length > 0 && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {alerts.length} Alert{alerts.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Performance Metrics */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Performance Metrics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-600 mb-1">Avg Execution</div>
              <div className="text-lg font-bold text-slate-800">{metrics.performance.avgExecutionTime}ms</div>
              <Progress value={((70 - metrics.performance.avgExecutionTime) / 70) * 100} className="h-1 mt-2" />
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-600 mb-1">P95 Execution</div>
              <div className="text-lg font-bold text-slate-800">{metrics.performance.p95ExecutionTime}ms</div>
              <Progress value={((90 - metrics.performance.p95ExecutionTime) / 90) * 100} className="h-1 mt-2" />
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-600 mb-1">Error Rate</div>
              <div className="text-lg font-bold text-slate-800">{metrics.performance.errorRate.toFixed(1)}%</div>
              <Progress value={Math.max(0, ((5 - metrics.performance.errorRate) / 5) * 100)} className="h-1 mt-2" />
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-600 mb-1">Cache Hit Rate</div>
              <div className="text-lg font-bold text-slate-800">{metrics.performance.cacheHitRate}%</div>
              <Progress value={metrics.performance.cacheHitRate} className="h-1 mt-2" />
            </div>
          </div>
        </div>

        {/* Usage Metrics */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usage Metrics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="text-xs text-blue-600 mb-1">Daily Requests</div>
              <div className="text-lg font-bold text-blue-800">{metrics.usage.dailyRequests.toLocaleString()}</div>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <div className="text-xs text-green-600 mb-1">Team Pairs</div>
              <div className="text-lg font-bold text-green-800">{metrics.usage.uniqueTeamPairs}</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <div className="text-xs text-purple-600 mb-1">A/B Participants</div>
              <div className="text-lg font-bold text-purple-800">{metrics.usage.abTestParticipants}</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <div className="text-xs text-orange-600 mb-1">Alerts Triggered</div>
              <div className="text-lg font-bold text-orange-800">{metrics.usage.alertsTriggered}</div>
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Quality Metrics
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-600">Data Consistency</span>
                <span className="text-sm font-bold text-slate-800">{metrics.quality.dataConsistency}%</span>
              </div>
              <Progress value={metrics.quality.dataConsistency} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-600">Feature Stability</span>
                <span className="text-sm font-bold text-slate-800">{metrics.quality.featureStability}%</span>
              </div>
              <Progress value={metrics.quality.featureStability} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-600">User Engagement</span>
                <span className="text-sm font-bold text-slate-800">{metrics.quality.userEngagement}%</span>
              </div>
              <Progress value={metrics.quality.userEngagement} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-600">Prediction Accuracy</span>
                <span className="text-sm font-bold text-slate-800">{metrics.quality.predictionAccuracy}%</span>
              </div>
              <Progress value={metrics.quality.predictionAccuracy} className="h-2" />
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Active Alerts
            </h4>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-orange-800">{alert.type}</div>
                      <div className="text-xs text-orange-600">{alert.message}</div>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      {alert.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Summary */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <div>Enterprise Monitoring v1.0</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
