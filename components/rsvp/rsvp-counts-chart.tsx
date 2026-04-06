"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  count: {
    label: "Responses",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
] as const

export type RsvpCountRow = { name: string; count: number }

export function RsvpCountsChart({ rows }: { rows: RsvpCountRow[] }) {
  if (rows.every((r) => r.count === 0)) {
    return (
      <p className="text-sm text-muted-foreground">
        No responses yet. Submit the public RSVP form first.
      </p>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[220px] w-full">
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
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {rows.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
