import { CronExpressionParser } from "cron-parser"

export type CronAnalysis =
  | {
      valid: true
      expression: string
      nextRuns: Date[]
    }
  | {
      valid: false
      expression: string
      error: string
    }

export type AnalyzeCronOptions = {
  /** How many upcoming fires to compute (default 8). */
  count?: number
  /** IANA timezone or `UTC`. Defaults to the runtime local zone. */
  tz?: string
}

const DEFAULT_COUNT = 8

export function analyzeCronExpression(
  raw: string,
  options: AnalyzeCronOptions = {},
): CronAnalysis {
  const expression = raw.trim()
  if (!expression) {
    return { valid: false, expression: "", error: "Enter a cron expression." }
  }

  const count = Math.min(Math.max(options.count ?? DEFAULT_COUNT, 1), 24)

  try {
    const interval = CronExpressionParser.parse(expression, {
      tz: options.tz,
    })
    const nextRuns: Date[] = []
    for (let i = 0; i < count; i++) {
      nextRuns.push(interval.next().toDate())
    }
    return { valid: true, expression, nextRuns }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not parse expression."
    return { valid: false, expression, error: message }
  }
}

export const CRON_PRESETS: { label: string; expression: string; hint: string }[] =
  [
    {
      label: "Daily 08:00",
      expression: "0 8 * * *",
      hint: "This playground automation schedule",
    },
    {
      label: "Every 15 min",
      expression: "*/15 * * * *",
      hint: "Frequent polling-style jobs",
    },
    {
      label: "Weekdays 09:00",
      expression: "0 9 * * 1-5",
      hint: "Monday through Friday mornings",
    },
    {
      label: "Sunday midnight",
      expression: "0 0 * * 0",
      hint: "Weekly maintenance window",
    },
    {
      label: "First of month",
      expression: "0 0 1 * *",
      hint: "Monthly billing or reports",
    },
  ]
