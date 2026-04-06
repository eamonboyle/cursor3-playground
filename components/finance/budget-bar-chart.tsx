"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  spent: {
    label: "Spent",
    color: "var(--chart-1)",
  },
  budget: {
    label: "Budget",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export type BudgetChartRow = {
  name: string
  spent: number
  budget: number
}

export function BudgetBarChart({ rows }: { rows: BudgetChartRow[] }) {
  if (rows.length === 0) {
    return null
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[260px] w-full">
      <BarChart
        accessibilityLayer
        data={rows}
        margin={{ left: 4, right: 4, top: 8, bottom: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={48}
          tickFormatter={(v) =>
            typeof v === "number"
              ? v.toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })
              : String(v)
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) =>
                typeof value === "number"
                  ? value.toLocaleString(undefined, {
                      style: "currency",
                      currency: "USD",
                    })
                  : String(value)
              }
            />
          }
        />
        <Bar
          dataKey="budget"
          fill="var(--color-budget)"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
        <Bar
          dataKey="spent"
          fill="var(--color-spent)"
          radius={[4, 4, 0, 0]}
          maxBarSize={36}
        />
      </BarChart>
    </ChartContainer>
  )
}
