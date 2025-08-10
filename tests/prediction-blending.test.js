import { useEnsembleWeight, calculateModelDisagreement, getDisagreementLevel } from "../hooks/use-ensemble-weight"
import { renderHook, act } from "@testing-library/react"
import jest from "jest" // Import jest to declare the variable

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

describe("Ensemble Weight Hook", () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
  })

  describe("useEnsembleWeight", () => {
    test("should initialize with default weights", () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useEnsembleWeight())

      expect(result.current.weights.form).toBe(0.6)
      expect(result.current.weights.h2h).toBe(0.4)
      expect(result.current.isDefault).toBe(true)
    })

    test("should load weights from localStorage", () => {
      const storedWeights = { form: 0.7, h2h: 0.3 }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedWeights))

      const { result } = renderHook(() => useEnsembleWeight())

      expect(result.current.weights.form).toBe(0.7)
      expect(result.current.weights.h2h).toBe(0.3)
      expect(result.current.isDefault).toBe(false)
    })

    test("should update form weight correctly", () => {
      const { result } = renderHook(() => useEnsembleWeight())

      act(() => {
        result.current.updateFormWeight(0.8)
      })

      expect(result.current.weights.form).toBe(0.8)
      expect(result.current.weights.h2h).toBe(0.2)
    })

    test("should update H2H weight correctly", () => {
      const { result } = renderHook(() => useEnsembleWeight())

      act(() => {
        result.current.updateH2HWeight(0.7)
      })

      expect(result.current.weights.form).toBe(0.3)
      expect(result.current.weights.h2h).toBe(0.7)
    })

    test("should clamp weights to valid range", () => {
      const { result } = renderHook(() => useEnsembleWeight())

      act(() => {
        result.current.updateFormWeight(1.5) // Should be clamped to 1.0
      })

      expect(result.current.weights.form).toBe(1.0)
      expect(result.current.weights.h2h).toBe(0.0)

      act(() => {
        result.current.updateFormWeight(-0.5) // Should be clamped to 0.0
      })

      expect(result.current.weights.form).toBe(0.0)
      expect(result.current.weights.h2h).toBe(1.0)
    })

    test("should reset weights to default", () => {
      const { result } = renderHook(() => useEnsembleWeight())

      act(() => {
        result.current.updateFormWeight(0.8)
      })

      act(() => {
        result.current.resetWeights()
      })

      expect(result.current.weights.form).toBe(0.6)
      expect(result.current.weights.h2h).toBe(0.4)
      expect(result.current.isDefault).toBe(true)
    })

    test("should blend predictions correctly", () => {
      const { result } = renderHook(() => useEnsembleWeight())

      const formPrediction = {
        home: 0.5,
        draw: 0.3,
        away: 0.2,
        btts: 0.6,
        over_25: 0.7,
        expected_goals: { home: 1.5, away: 1.0 },
      }

      const h2hPrediction = {
        home: 0.4,
        draw: 0.4,
        away: 0.2,
        btts: 0.5,
        over_25: 0.6,
        expected_goals: { home: 1.2, away: 1.1 },
      }

      const blended = result.current.blendPredictions(formPrediction, h2hPrediction)

      // With default weights (0.6 form, 0.4 h2h)
      expect(blended.home).toBeCloseTo(0.6 * 0.5 + 0.4 * 0.4) // 0.46
      expect(blended.draw).toBeCloseTo(0.6 * 0.3 + 0.4 * 0.4) // 0.34
      expect(blended.away).toBe(0.2) // Same in both predictions
      expect(blended.btts).toBeCloseTo(0.6 * 0.6 + 0.4 * 0.5) // 0.56
      expect(blended.over_25).toBeCloseTo(0.6 * 0.7 + 0.4 * 0.6) // 0.66
    })

    test("should provide weight description", () => {
      const { result } = renderHook(() => useEnsembleWeight())

      // Default balanced
      expect(result.current.getWeightDescription()).toMatch(/Kiegyensúlyozott/)

      act(() => {
        result.current.updateFormWeight(0.9)
      })

      expect(result.current.getWeightDescription()).toMatch(/Főleg forma alapú/)

      act(() => {
        result.current.updateFormWeight(0.1)
      })

      expect(result.current.getWeightDescription()).toMatch(/Főleg H2H alapú/)
    })

    test("should calculate confidence adjustment", () => {
      const { result } = renderHook(() => useEnsembleWeight())

      // Perfect balance should give maximum adjustment
      act(() => {
        result.current.updateFormWeight(0.5)
      })

      const adjustment = result.current.getConfidenceAdjustment()
      expect(adjustment).toBeCloseTo(0.1) // Maximum 10% boost

      // Extreme weights should give minimal adjustment
      act(() => {
        result.current.updateFormWeight(1.0)
      })

      const extremeAdjustment = result.current.getConfidenceAdjustment()
      expect(extremeAdjustment).toBeCloseTo(0.0)
    })

    test("should save weights to localStorage", () => {
      const { result } = renderHook(() => useEnsembleWeight())

      act(() => {
        result.current.updateFormWeight(0.8)
      })

      // Should save to localStorage after state update
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "football-ensemble-weights",
        JSON.stringify({ form: 0.8, h2h: 0.2 }),
      )
    })
  })

  describe("calculateModelDisagreement", () => {
    test("should calculate disagreement correctly", () => {
      const formPrediction = { home: 0.5, draw: 0.3, away: 0.2 }
      const h2hPrediction = { home: 0.4, draw: 0.4, away: 0.2 }

      const disagreement = calculateModelDisagreement(formPrediction, h2hPrediction)

      // Average of |0.5-0.4|, |0.3-0.4|, |0.2-0.2| = (0.1 + 0.1 + 0.0) / 3 = 0.067
      expect(disagreement).toBeCloseTo(0.067, 3)
    })

    test("should return 0 for identical predictions", () => {
      const prediction = { home: 0.5, draw: 0.3, away: 0.2 }

      const disagreement = calculateModelDisagreement(prediction, prediction)

      expect(disagreement).toBe(0)
    })

    test("should handle maximum disagreement", () => {
      const formPrediction = { home: 1.0, draw: 0.0, away: 0.0 }
      const h2hPrediction = { home: 0.0, draw: 0.0, away: 1.0 }

      const disagreement = calculateModelDisagreement(formPrediction, h2hPrediction)

      // Average of |1.0-0.0|, |0.0-0.0|, |0.0-1.0| = (1.0 + 0.0 + 1.0) / 3 = 0.667
      expect(disagreement).toBeCloseTo(0.667, 3)
    })
  })

  describe("getDisagreementLevel", () => {
    test("should classify low disagreement", () => {
      const result = getDisagreementLevel(0.05)

      expect(result.level).toBe("low")
      expect(result.description).toBe("Modellek egyetértenek")
      expect(result.color).toBe("text-green-600")
    })

    test("should classify medium disagreement", () => {
      const result = getDisagreementLevel(0.15)

      expect(result.level).toBe("medium")
      expect(result.description).toBe("Közepes eltérés a modellek között")
      expect(result.color).toBe("text-yellow-600")
    })

    test("should classify high disagreement", () => {
      const result = getDisagreementLevel(0.3)

      expect(result.level).toBe("high")
      expect(result.description).toBe("Nagy eltérés a modellek között")
      expect(result.color).toBe("text-red-600")
    })

    test("should handle boundary values", () => {
      expect(getDisagreementLevel(0.1).level).toBe("medium")
      expect(getDisagreementLevel(0.25).level).toBe("high")
    })
  })
})
