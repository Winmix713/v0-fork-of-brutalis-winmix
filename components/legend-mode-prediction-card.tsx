import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Flame, Zap, Shield, Info, Brain } from "lucide-react"

interface LegendModePredictionCardProps {
  homeTeam: string
  awayTeam: string
  // These would typically come from an API call to your backend ML model
  // For now, using mock data
  comebackProbabilityHome?: number
  comebackProbabilityAway?: number
  resilienceFactorHome?: number
  resilienceFactorAway?: number
  mentalStrengthHome?: number
  mentalStrengthAway?: number
  recentFormH2H?: string
  playerInjuries?: string[]
}

export default function LegendModePredictionCard({
  homeTeam,
  awayTeam,
  comebackProbabilityHome = 0.15, // Mock data
  comebackProbabilityAway = 0.1, // Mock data
  resilienceFactorHome = 0.85, // Mock data
  resilienceFactorAway = 0.7, // Mock data
  mentalStrengthHome = 0.92, // Mock data
  mentalStrengthAway = 0.8, // Mock data
  recentFormH2H = "mixed", // Mock data
  playerInjuries = [], // Mock data
}: LegendModePredictionCardProps) {
  return (
    <Card className="rounded-3xl shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-red-500" />
          LEGEND MODE Elemzés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">{homeTeam}</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Visszatérési valószínűség: {(comebackProbabilityHome * 100).toFixed(1)}%</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Annak valószínűsége, hogy a csapat hátrányból feláll és nyer.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>Ellenállási faktor: {(resilienceFactorHome * 100).toFixed(1)}%</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>A csapat képessége a nyomás kezelésére és a teljesítmény fenntartására.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span>Mentális erő: {(mentalStrengthHome * 100).toFixed(1)}%</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>A csapat pszichológiai felkészültsége és koncentrációja.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          <Separator orientation="vertical" />
          <div>
            <h3 className="font-semibold mb-2">{awayTeam}</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>Visszatérési valószínűség: {(comebackProbabilityAway * 100).toFixed(1)}%</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Annak valószínűsége, hogy a csapat hátrányból feláll és nyer.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>Ellenállási faktor: {(resilienceFactorAway * 100).toFixed(1)}%</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>A csapat képessége a nyomás kezelésére és a teljesítmény fenntartására.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span>Mentális erő: {(mentalStrengthAway * 100).toFixed(1)}%</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>A csapat pszichológiai felkészültsége és koncentrációja.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <h3 className="font-semibold mb-2">További tényezők</h3>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-gray-500" />
            <span>Legutóbbi H2H forma: {recentFormH2H}</span>
          </div>
          {playerInjuries && playerInjuries.length > 0 && (
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-500" />
              <span>Sérült játékosok: {playerInjuries.join(", ")}</span>
            </div>
          )}
          {playerInjuries && playerInjuries.length === 0 && (
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-500" />
              <span>Nincs jelentős sérült játékos.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
