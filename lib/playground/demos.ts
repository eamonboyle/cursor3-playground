export type DemoKind = "client" | "api"

export type PlaygroundDemo = {
  href: string
  title: string
  description: string
  kind: DemoKind
}

export const PLAYGROUND_DEMOS: PlaygroundDemo[] = [
  {
    href: "/finance",
    title: "Finance sandbox",
    description:
      "Categories, monthly budgets, transactions, charts, and tabs with localStorage.",
    kind: "client",
  },
  {
    href: "/habits",
    title: "Habit tracker",
    description:
      "Mark days on a calendar, streaks, and multiple habits stored in the browser.",
    kind: "client",
  },
  {
    href: "/focus",
    title: "Focus timer",
    description:
      "Pomodoro-style work and break sessions with a task list and adjustable length.",
    kind: "client",
  },
  {
    href: "/links",
    title: "Link organizer",
    description:
      "Save URLs with Open Graph previews fetched through a Next.js Route Handler.",
    kind: "api",
  },
]
