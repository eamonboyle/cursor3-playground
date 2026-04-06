import type { Metadata } from "next"

import { FocusApp } from "@/components/focus/focus-app"

export const metadata: Metadata = {
  title: "Focus timer",
  description: "Pomodoro-style timer and task list.",
}

export default function FocusPage() {
  return <FocusApp />
}
