import {
  safeFormatDate,
  formatMatchDate,
  formatApiDateTime,
  getRelativeTime,
  isToday,
  isFuture,
  toISOString,
  parseDate,
} from "../lib/date-utils"

describe("Date Utils", () => {
  describe("safeFormatDate", () => {
    test("should format valid date string", () => {
      const result = safeFormatDate("2025-08-15")
      expect(result).toMatch(/2025/)
      expect(result).toMatch(/augusztus/)
      expect(result).toMatch(/15/)
    })

    test("should handle invalid date gracefully", () => {
      const result = safeFormatDate("invalid-date")
      expect(result).toBe("Ismeretlen dátum")
    })

    test("should handle null/undefined input", () => {
      expect(safeFormatDate(null)).toBe("Ismeretlen dátum")
      expect(safeFormatDate(undefined)).toBe("Ismeretlen dátum")
      expect(safeFormatDate("")).toBe("Ismeretlen dátum")
    })

    test("should handle Date object", () => {
      const date = new Date("2025-08-15")
      const result = safeFormatDate(date)
      expect(result).toMatch(/2025/)
      expect(result).toMatch(/augusztus/)
    })

    test("should handle timestamp", () => {
      const timestamp = new Date("2025-08-15").getTime()
      const result = safeFormatDate(timestamp)
      expect(result).toMatch(/2025/)
    })

    test("should use custom fallback", () => {
      const result = safeFormatDate("invalid", { fallback: "Custom fallback" })
      expect(result).toBe("Custom fallback")
    })

    test("should include time when requested", () => {
      const result = safeFormatDate("2025-08-15T14:30:00", { includeTime: true })
      expect(result).toMatch(/14:30/)
    })

    test("should handle DD/MM/YYYY format", () => {
      const result = safeFormatDate("15/08/2025")
      expect(result).toMatch(/2025/)
      expect(result).toMatch(/augusztus/)
    })

    it("should format a valid ISO date string correctly", () => {
      const dateString = "2023-10-27T10:00:00Z"
      const expected = new Date(dateString).toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      expect(safeFormatDate(dateString)).toBe(expected)
    })

    it("should return 'Érvénytelen dátum' for an invalid date string", () => {
      const invalidDateString = "not-a-date"
      expect(safeFormatDate(invalidDateString)).toBe("Érvénytelen dátum")
    })

    it("should handle null input gracefully", () => {
      expect(safeFormatDate(null)).toBe("Érvénytelen dátum")
    })

    it("should handle undefined input gracefully", () => {
      expect(safeFormatDate(undefined)).toBe("Érvénytelen dátum")
    })

    it("should format a date string without time correctly (defaults to midnight UTC)", () => {
      const dateString = "2024-03-15"
      const expected = new Date("2024-03-15T00:00:00Z").toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      expect(safeFormatDate(dateString)).toBe(expected)
    })
  })

  describe("formatMatchDate", () => {
    test("should format match date correctly", () => {
      const result = formatMatchDate("2025-08-15")
      expect(result).toMatch(/2025/)
      expect(result).toMatch(/augusztus/)
    })

    test("should handle null input", () => {
      const result = formatMatchDate(null)
      expect(result).toBe("Dátum nincs megadva")
    })
  })

  describe("formatApiDateTime", () => {
    test("should format datetime with time", () => {
      const result = formatApiDateTime("2025-08-15T14:30:00")
      expect(result).toMatch(/14:30/)
    })

    test("should handle null input", () => {
      const result = formatApiDateTime(null)
      expect(result).toBe("Ismeretlen időpont")
    })
  })

  describe("getRelativeTime", () => {
    test('should return "Ma" for today', () => {
      const today = new Date().toISOString().split("T")[0]
      const result = getRelativeTime(today)
      expect(result).toBe("Ma")
    })

    test('should return "Holnap" for tomorrow', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      const result = getRelativeTime(tomorrow)
      expect(result).toBe("Holnap")
    })

    test('should return "Tegnap" for yesterday', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      const result = getRelativeTime(yesterday)
      expect(result).toBe("Tegnap")
    })

    test("should return days for future dates", () => {
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      const result = getRelativeTime(futureDate)
      expect(result).toBe("3 nap múlva")
    })

    test("should return days for past dates", () => {
      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      const result = getRelativeTime(pastDate)
      expect(result).toBe("3 napja")
    })

    test("should handle invalid input", () => {
      const result = getRelativeTime("invalid-date")
      expect(result).toBe("Érvénytelen dátum")
    })

    test("should handle null input", () => {
      const result = getRelativeTime(null)
      expect(result).toBe("Ismeretlen")
    })
  })

  describe("isToday", () => {
    test("should return true for today", () => {
      const today = new Date().toISOString().split("T")[0]
      expect(isToday(today)).toBe(true)
    })

    test("should return false for yesterday", () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      expect(isToday(yesterday)).toBe(false)
    })

    test("should return false for invalid input", () => {
      expect(isToday("invalid-date")).toBe(false)
      expect(isToday(null)).toBe(false)
    })
  })

  describe("isFuture", () => {
    test("should return true for future date", () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      expect(isFuture(futureDate)).toBe(true)
    })

    test("should return false for past date", () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      expect(isFuture(pastDate)).toBe(false)
    })

    test("should return false for invalid input", () => {
      expect(isFuture("invalid-date")).toBe(false)
      expect(isFuture(null)).toBe(false)
    })
  })

  describe("toISOString", () => {
    test("should convert valid date to ISO string", () => {
      const result = toISOString("2025-08-15")
      expect(result).toMatch(/2025-08-15T/)
    })

    test("should return null for invalid input", () => {
      expect(toISOString("invalid-date")).toBe(null)
      expect(toISOString(null)).toBe(null)
    })

    test("should handle Date object", () => {
      const date = new Date("2025-08-15")
      const result = toISOString(date)
      expect(result).toMatch(/2025-08-15T/)
    })
  })

  describe("parseDate", () => {
    test("should parse valid date string", () => {
      const result = parseDate("2025-08-15")
      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2025)
    })

    test("should return null for invalid input", () => {
      expect(parseDate("invalid-date")).toBe(null)
      expect(parseDate(null)).toBe(null)
    })

    test("should handle Date object", () => {
      const date = new Date("2025-08-15")
      const result = parseDate(date)
      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2025)
    })

    test("should return null for invalid Date object", () => {
      const invalidDate = new Date("invalid")
      const result = parseDate(invalidDate)
      expect(result).toBe(null)
    })
  })
})
