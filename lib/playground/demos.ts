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
    href: "/branch",
    title: "Branch name lab",
    description:
      "Slugify feature titles into git-safe branch names with optional feat, fix, chore, or cursor prefixes.",
    kind: "client",
  },
  {
    href: "/commit",
    title: "Commit message lab",
    description:
      "Lint Conventional Commits — subject length, body wrap, breaking-change footers, and copyable reports.",
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
    href: "/json",
    title: "JSON lab",
    description:
      "Validate, format, and minify JSON with tree stats, error line hints, and localStorage.",
    kind: "client",
  },
  {
    href: "/patch",
    title: "Patch lab",
    description:
      "Paste unified diff output for per-file +/− counts, binary flags, and a copyable markdown summary.",
    kind: "client",
  },
  {
    href: "/glob",
    title: "Glob scope lab",
    description:
      "Paste repo paths and glob patterns with ! excludes to preview agent, test, or ignore-file scope.",
    kind: "client",
  },
  {
    href: "/env",
    title: "Env key diff",
    description:
      "Compare .env.example vs local env by key — missing, extra, and value mismatches with masked secrets.",
    kind: "client",
  },
  {
    href: "/stack",
    title: "Stack trace lab",
    description:
      "Parse error stacks into file:line frames — filter node_modules, dedupe, copy paths for Cursor.",
    kind: "client",
  },
  {
    href: "/tsc",
    title: "TypeScript diagnostic lab",
    description:
      "Paste tsc or pnpm typecheck output — group TS error codes, filter node_modules, copy file:line paths.",
    kind: "client",
  },
  {
    href: "/eslint",
    title: "ESLint diagnostic lab",
    description:
      "Paste eslint or pnpm lint output — group by rule id, filter node_modules, copy file:line paths.",
    kind: "client",
  },
  {
    href: "/todo",
    title: "TODO marker lab",
    description:
      "Paste ripgrep output for TODO, FIXME, HACK, XXX, and BUG — grouped counts and copyable file:line paths.",
    kind: "client",
  },
  {
    href: "/import",
    title: "Import path lab",
    description:
      "Compute relative and @/ alias import strings when moving files or fixing broken imports after a refactor.",
    kind: "client",
  },
  {
    href: "/rename",
    title: "Rename map lab",
    description:
      "Apply file-move rules to pasted paths, ripgrep hits, or stack frames — copy rewritten lines after a refactor.",
    kind: "client",
  },
  {
    href: "/whitespace",
    title: "Whitespace lab",
    description:
      "Scan snippets for mixed line endings, trailing spaces, tab vs space indent, and invisible Unicode.",
    kind: "client",
  },
  {
    href: "/citation",
    title: "Citation lab",
    description:
      "Build ```start:end:filepath fences from ripgrep hits—validate ranges and copy agent-ready code citations.",
    kind: "client",
  },
  {
    href: "/semver",
    title: "Semver lab",
    description:
      "Compare versions, check npm ^ and ~ ranges, and sort pasted dependency lists with prerelease ordering.",
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
