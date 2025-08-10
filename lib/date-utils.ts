/**
 * Safe date formatting utilities with Hungarian localization
 * Fixes the "Invalid Date" bug by providing robust fallbacks
 */

export interface DateFormatOptions {
  locale?: string
  timeZone?: string
  includeTime?: boolean
  fallback?: string
}

/**
 * Safely format a date string with Hungarian localization
 * @param dateInput - Date string, Date object, or timestamp
 * @param options - Formatting options
 * @returns Formatted date string or fallback
 */
export function safeFormatDate(
  dateInput: string | Date | number | null | undefined,
  options: DateFormatOptions = {},
): string {
  const { locale = "hu-HU", timeZone = "Europe/Budapest", includeTime = false, fallback = "Ismeretlen dátum" } = options

  // Handle null/undefined
  if (!dateInput) {
    return fallback
  }

  try {
    let date: Date

    // Convert input to Date object
    if (dateInput instanceof Date) {
      date = dateInput
    } else if (typeof dateInput === "number") {
      date = new Date(dateInput)
    } else if (typeof dateInput === "string") {
      // Handle various string formats
      if (dateInput.includes("T") || dateInput.includes(" ")) {
        // ISO format or datetime
        date = new Date(dateInput)
      } else if (dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format
        date = new Date(dateInput + "T00:00:00")
      } else if (dateInput.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        // DD/MM/YYYY format
        const [day, month, year] = dateInput.split("/")
        date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      } else {
        // Try parsing as-is
        date = new Date(dateInput)
      }
    } else {
      return fallback
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date input: ${dateInput}`)
      return fallback
    }

    // Format the date
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone,
      year: "numeric",
      month: "long",
      day: "numeric",
    }

    if (includeTime) {
      formatOptions.hour = "2-digit"
      formatOptions.minute = "2-digit"
    }

    return new Intl.DateTimeFormat(locale, formatOptions).format(date)
  } catch (error) {
    console.error("Date formatting error:", error, "Input:", dateInput)
    return fallback
  }
}

/**
 * Format date for display in match cards
 */
export function formatMatchDate(dateInput: string | Date | null): string {
  return safeFormatDate(dateInput, {
    locale: "hu-HU",
    fallback: "Dátum nincs megadva",
  })
}

/**
 * Format datetime for API responses
 */
export function formatApiDateTime(dateInput: string | Date | null): string {
  return safeFormatDate(dateInput, {
    locale: "hu-HU",
    includeTime: true,
    fallback: "Ismeretlen időpont",
  })
}

/**
 * Get relative time (e.g., "2 napja", "holnap")
 */
export function getRelativeTime(dateInput: string | Date | null): string {
  if (!dateInput) return "Ismeretlen"

  try {
    const date = new Date(dateInput)
    if (isNaN(date.getTime())) return "Érvénytelen dátum"

    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Ma"
    if (diffDays === 1) return "Holnap"
    if (diffDays === -1) return "Tegnap"
    if (diffDays > 1) return `${diffDays} nap múlva`
    if (diffDays < -1) return `${Math.abs(diffDays)} napja`

    return safeFormatDate(dateInput)
  } catch (error) {
    console.error("Relative time error:", error)
    return "Ismeretlen"
  }
}

/**
 * Check if a date is today
 */
export function isToday(dateInput: string | Date | null): boolean {
  if (!dateInput) return false

  try {
    const date = new Date(dateInput)
    const today = new Date()

    return date.toDateString() === today.toDateString()
  } catch {
    return false
  }
}

/**
 * Check if a date is in the future
 */
export function isFuture(dateInput: string | Date | null): boolean {
  if (!dateInput) return false

  try {
    const date = new Date(dateInput)
    return date.getTime() > Date.now()
  } catch {
    return false
  }
}

/**
 * Convert date to ISO string safely
 */
export function toISOString(dateInput: string | Date | null): string | null {
  if (!dateInput) return null

  try {
    const date = new Date(dateInput)
    if (isNaN(date.getTime())) return null
    return date.toISOString()
  } catch {
    return null
  }
}

/**
 * Parse various date formats to consistent format
 */
export function parseDate(dateInput: string | Date | null): Date | null {
  if (!dateInput) return null

  try {
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput
    }

    const date = new Date(dateInput)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}
