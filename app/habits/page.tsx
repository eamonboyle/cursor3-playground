import type { Metadata } from "next"

import { HabitsApp } from "@/components/habits/habits-app"

export const metadata: Metadata = {
  title: "Habit tracker",
  description: "Calendar habit tracking with local storage.",
}

export default function HabitsPage() {
  return <HabitsApp />
}
