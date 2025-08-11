"use client"

import { useState, useEffect, useCallback } from "react"

export interface EnsembleWeights {
  form: number
  h2h: number
}

export interface BlendedPrediction {
  home: number
  draw: number
  away: number
  btts: number
  over_25: number
  expected_goals: {
    home: number
    away: number
  }
}

const DEFAULT_WEIGHTS: EnsembleWeights = {
  form: 0.6,
  h2h: 0.4,
}

const STORAGE_KEY = "football-ensemble-weights"

/**
 * Hook for managing ensemble prediction weights with localStorage persistence
 */
export function useEnsembleWeight(initialWeights?: EnsembleWeights) {
  const [weights, setWeights] = useState<EnsembleWeights>(initialWeights || DEFAULT_WEIGHTS)
  const [isLoading, setIsLoading] = useState(true)

  // Load weights from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedWeights = JSON.parse(stored)
        if (isValidWeights(parsedWeights)) {
          setWeights(parsedWeights)
        }
      }
    } catch (error) {
      console.warn("Failed to load ensemble weights from localStorage:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save weights to localStorage when they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(weights))
      } catch (error) {
        console.warn("Failed to save ensemble weights to localStorage:", error)
      }
    }
  }, [weights, isLoading])

  const handleWeightChange = useCallback((newWeight: number[]) => {
    // Slider component typically returns an array, take the first value
    const clampedWeight = Math.max(0, Math.min(1, newWeight[0]))
    setWeights({
      form: clampedWeight,
      h2h: 1 - clampedWeight,
    })
  }, [])

  const blendPredictions = useCallback(
    (formPrediction: any, h2hPrediction: any): BlendedPrediction => {
      const { form: formWeight, h2h: h2hWeight } = weights

      return {
        home: formWeight * formPrediction.home + h2hWeight * h2hPrediction.home,
        draw: formWeight * formPrediction.draw + h2hWeight * h2hPrediction.draw,
        away: formWeight * formPrediction.away + h2hWeight * h2hPrediction.away,
        btts: formWeight * formPrediction.btts + h2hWeight * h2hPrediction.btts,
        over_25: formWeight * formPrediction.over_25 + h2hWeight * h2hPrediction.over_25,
        expected_goals: {
          home: formWeight * formPrediction.expected_goals.home + h2hWeight * h2hPrediction.expected_goals.home,
          away: formWeight * formPrediction.expected_goals.away + h2hWeight * h2hPrediction.expected_goals.away,
        },
      }
    },
    [weights],
  )

  const getWeightDescription = useCallback(() => {
    const formPercent = Math.round(weights.form * 100)
    const h2hPercent = Math.round(weights.h2h * 100)

    if (formPercent >= 80) return `Főleg forma alapú (${formPercent}%)`
    if (h2hPercent >= 80) return `Főleg H2H alapú (${h2hPercent}%)`
    return `Kiegyensúlyozott (${formPercent}% forma, ${h2hPercent}% H2H)`
  }, [weights])

  const getConfidenceAdjustment = useCallback(() => {
    // More balanced weights generally give higher confidence
    const balance = 1 - Math.abs(weights.form - weights.h2h)
    return balance * 0.1 // Max 10% confidence boost for perfect balance
  }, [weights])

  return {
    weights,
    isLoading,
    setWeight: handleWeightChange,
    blendPredictions,
    getWeightDescription,
    getConfidenceAdjustment,
    isDefault: weights.form === DEFAULT_WEIGHTS.form && weights.h2h === DEFAULT_WEIGHTS.h2h,
  }
}

/**
 * Validate ensemble weights object
 */
function isValidWeights(weights: any): weights is EnsembleWeights {
  return (
    weights &&
    typeof weights === "object" &&
    typeof weights.form === "number" &&
    typeof weights.h2h === "number" &&
    weights.form >= 0 &&
    weights.form <= 1 &&
    weights.h2h >= 0 &&
    weights.h2h <= 1 &&
    Math.abs(weights.form + weights.h2h - 1) < 0.01 // Allow small floating point errors
  )
}

/**
 * Calculate model disagreement score
 */
export function calculateModelDisagreement(formPrediction: any, h2hPrediction: any): number {
  const homeDisagreement = Math.abs(formPrediction.home - h2hPrediction.home)
  const drawDisagreement = Math.abs(formPrediction.draw - h2hPrediction.draw)
  const awayDisagreement = Math.abs(formPrediction.away - h2hPrediction.away)

  return (homeDisagreement + drawDisagreement + awayDisagreement) / 3
}

/**
 * Get disagreement level description
 */
export function getDisagreementLevel(disagreement: number): {
  level: "low" | "medium" | "high"
  description: string
  color: string
} {
  if (disagreement < 0.1) {
    return {
      level: "low",
      description: "Modellek egyetértenek",
      color: "text-green-600",
    }
  } else if (disagreement < 0.25) {
    return {
      level: "medium",
      description: "Közepes eltérés a modellek között",
      color: "text-yellow-600",
    }
  } else {
    return {
      level: "high",
      description: "Nagy eltérés a modellek között",
      color: "text-red-600",
    }
  }
}
