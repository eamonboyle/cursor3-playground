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
    href: "/stopwatch",
    title: "Stopwatch",
    description:
      "Count-up timer with centisecond display, lap table, Space to run or pause, and copy splits as TSV.",
    kind: "client",
  },
  {
    href: "/ids",
    title: "ID lab",
    description:
      "Bulk-generate UUIDs, hex secrets, and URL-safe tokens; copy with one click.",
    kind: "client",
  },
  {
    href: "/contrast",
    title: "Contrast checker",
    description:
      "WCAG contrast ratio, AA and AAA pass rows, and a live text preview from hex pairs.",
    kind: "client",
  },
  {
    href: "/links",
    title: "Link organizer",
    description:
      "Save URLs with Open Graph previews fetched through a Next.js Route Handler.",
    kind: "api",
  },
  {
    href: "/recipes",
    title: "Recipe scaler",
    description:
      "Scale a demo recipe by servings, print a clean sheet, pure client math.",
    kind: "client",
  },
  {
    href: "/epoch",
    title: "Epoch lab",
    description:
      "Parse Unix seconds or ms and ISO strings; GET /api/time returns server time for skew checks.",
    kind: "api",
  },
  {
    href: "/cron",
    title: "Cron lab",
    description:
      "Validate five-field cron strings, split fields, and preview the next ten run times in local or UTC.",
    kind: "client",
  },
  {
    href: "/crm",
    title: "Tiny CRM",
    description:
      "Search contact cards, edit details in a sheet, tags and notes in localStorage.",
    kind: "client",
  },
  {
    href: "/notes",
    title: "Markdown notes",
    description:
      "Sidebar note list, editor, and export to a .md file from the browser.",
    kind: "client",
  },
  {
    href: "/rsvp",
    title: "Event RSVP",
    description:
      "Public form posts to POST /api/rsvp (in-memory until server restart).",
    kind: "api",
  },
  {
    href: "/rsvp/host",
    title: "RSVP host dashboard",
    description:
      "GET /api/rsvp summary chart and response table for the demo event.",
    kind: "api",
  },
  {
    href: "/ui",
    title: "UI gallery",
    description:
      "Tabs of live shadcn samples with copy-to-clipboard JSX snippets.",
    kind: "client",
  },
]
