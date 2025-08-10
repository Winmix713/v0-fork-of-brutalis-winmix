"use client"

import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LegendTooltipProps {
  title: string
  description: string
  formula?: string
}

export function LegendTooltip({ title, description, formula }: LegendTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3 w-3 text-slate-400 hover:text-slate-600 cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3 bg-slate-800 text-white rounded-xl">
          <div className="space-y-2">
            <div className="font-semibold text-sm">{title}</div>
            <div className="text-xs text-slate-300">{description}</div>
            {formula && (
              <div className="text-xs text-orange-300 font-mono bg-slate-700 px-2 py-1 rounded">{formula}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export const LEGEND_TOOLTIPS = {
  COMEBACK_FREQUENCY: {
    title: "Comeback Frequency",
    description: "Milyen gyakran fordít a csapat hátrányos helyzetből. Magasabb érték = gyakoribb comeback.",
    formula: "Total Comebacks / Total Matches",
  },
  SUCCESS_RATE: {
    title: "Comeback Success Rate",
    description: "A comeback kísérletek hány százaléka végződik győzelemmel.",
    formula: "Comeback Wins / Total Comebacks",
  },
  RESILIENCE_SCORE: {
    title: "Mental Resilience Score",
    description: "Pszichológiai erősség mérőszáma. Figyelembe veszi a comeback képességet és a vezetés elvesztését.",
    formula: "(Comebacks × 2 - Blown Leads) / Total Matches",
  },
  MAX_DEFICIT: {
    title: "Max Deficit Overcome",
    description: "A legnagyobb gólhátrányt, amit a csapat valaha ledolgozott egy mérkőzésen.",
    formula: "MAX(Halftime Deficit → Fulltime Win/Draw)",
  },
  BLOWN_LEAD_FREQUENCY: {
    title: "Blown Lead Frequency",
    description: "Milyen gyakran veszíti el a csapat a félidei vezetését. Alacsonyabb érték = stabilabb.",
    formula: "Blown Leads / Total Matches",
  },
  H2H_ADVANTAGE: {
    title: "H2H Comeback Advantage",
    description: "Melyik csapat dominál comeback szempontból az egymás elleni meccseken.",
    formula: "(Home Comebacks - Away Comebacks) / Total H2H Matches",
  },
}
