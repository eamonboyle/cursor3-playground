import type { Metadata } from "next"

import { StopwatchApp } from "@/components/stopwatch/stopwatch-app"

export const metadata: Metadata = {
  title: "Stopwatch",
  description: "Count-up stopwatch with lap splits and keyboard shortcuts.",
}

export default function StopwatchPage() {
  return <StopwatchApp />
}
