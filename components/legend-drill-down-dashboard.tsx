"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Loader2 } from "lucide-react"

interface DrillDownData {
  date: string
  accuracy: number
  latency: number
  error_rate: number
}

type LegendDrillDownDashboardProps = {}

export default function LegendDrillDownDashboard() {
  const [data, setData] = useState<DrillDownData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("7d") // 7 days, 30 days, 90 days

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        // Mock API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const mockData: DrillDownData[] = []
        const days = Number.parseInt(timeframe.replace("d", ""))
        for (let i = 0; i < days; i++) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          mockData.push({
            date: date.toISOString().split("T")[0],
            accuracy: Number.parseFloat((Math.random() * 0.2 + 0.7).toFixed(2)), // 0.7 to 0.9
            latency: Number.parseFloat((Math.random() * 50 + 100).toFixed(0)), // 100-150ms
            error_rate: Number.parseFloat((Math.random() * 0.02).toFixed(2)), // 0-2%
          })
        }
        setData(mockData.reverse()) // Show chronologically
      } catch (err: any) {
        setError(err.message || "Failed to fetch drill-down data.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeframe])

  return (
    <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>LEGEND Részletes Elemzés</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-end">
          <div className="grid gap-2">
            <Label htmlFor="timeframe">Időkeret</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger id="timeframe" className="w-[180px]">
                <SelectValue placeholder="Válassz időkeretet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Utolsó 7 nap</SelectItem>
                <SelectItem value="30d">Utolsó 30 nap</SelectItem>
                <SelectItem value="90d">Utolsó 90 nap</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-3 text-gray-600">Adatok betöltése...</span>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center p-4">
            <p className="font-semibold">Hiba:</p>
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">Pontosság trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0.6, 1]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="#8884d8" name="Pontosság" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Késleltetés trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="latency" stroke="#82ca9d" name="Késleltetés (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Hibaráta trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 0.05]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="error_rate" stroke="#ffc658" name="Hibaráta" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
