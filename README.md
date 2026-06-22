# Cursor playground

A **Next.js App Router** project built to try multi-step UI work, agent-assisted refactors, and small product slices. The home page lists self-contained demos; most data stays in **`localStorage`**, with a few **Route Handlers** for server-side fetches and form posts.

**Stack:** Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com/), Recharts, `next-themes`, Sonner.

---

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Use **`⌘K` / `Ctrl+K`** to open the command palette (jump to any demo, toggle theme, or trigger a sample toast). Press **`d`** to toggle light/dark when focus is not in an input.

Other scripts:

| Command | Purpose |
|--------|---------|
| `pnpm build` | Production build |
| `pnpm start` | Run production server |
| `pnpm typecheck` | TypeScript (`tsc --noEmit`) |
| `pnpm test` | Node test runner (`lib/**/*.test.ts`) |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier (TS/TSX) |

---

## Demos

Each route is a small app under `app/<name>/` with colocated UI in `components/<name>/` (and optional `lib/<name>/`). The registry lives in [`lib/playground/demos.ts`](lib/playground/demos.ts); new entries appear on the home page and in the command palette automatically.

| Route | Kind | What it exercises |
|-------|------|-------------------|
| `/` | — | Hub grid, editorial styling |
| `/finance` | Client | Budgets, transactions, charts, tabs, `localStorage` |
| `/habits` | Client | Calendar, streaks, habits |
| `/focus` | Client | Pomodoro timer, sliders, task list |
| `/stopwatch` | Client | Count-up timer, `requestAnimationFrame` display, lap splits, keyboard |
| `/links` | API | `POST /api/links/preview` — Open Graph preview + saved links |
| `/recipes` | Client | Servings slider, scaled ingredients, print stylesheet |
| `/epoch` | API | Time parsing UI + `GET /api/time` (server clock JSON) |
| `/cron` | Client | Cron expression validation and next-run preview (local or UTC) |
| `/crm` | Client | Search, cards, sheet editor, tags |
| `/ids` | Client | UUID, hex, and URL-safe token generation |
| `/branch` | Client | Slugify titles into git-safe branch names (feat/, cursor/, etc.) |
| `/commit` | Client | Conventional Commits linter — type, scope, subject length, body wrap |
| `/git-log` | Client | Parse `git log --oneline` or full log — group by type, breaking changes, copy PR release notes |
| `/git-status` | Client | Parse `git status` / `--porcelain` — staged, unstaged, untracked groups, copy paths or `git add` |
| `/changes` | Client | Parse `git diff --name-status` / `--name-only` — PR file scope, extension filter, copy paths or PR markdown |
| `/owners` | Client | Paste CODEOWNERS + changed paths — last-match owner rules, group by reviewer, copy @mentions for PR requests |
| `/conflict` | Client | Parse git merge conflict markers — block list, ours/theirs sides, Cursor citations |
| `/contrast` | Client | WCAG contrast ratio from hex color pairs |
| `/json` | Client | JSON validate, format, minify, structure stats |
| `/patch` | Client | Unified diff stats—files changed, +/− lines, binary flags |
| `/hunks` | Client | Parse unified diffs into @@ hunks — line ranges, per-hunk +/−, copy start:end:filepath citations |
| `/glob` | Client | Glob include/exclude scope preview over pasted repo paths |
| `/env` | Client | Diff .env.example vs local env keys — missing, extra, value mismatches |
| `/deps` | Client | Diff two package.json files — added, removed, version bumps, pnpm install hints |
| `/outdated` | Client | Parse `pnpm outdated` table or JSON — group patch/minor/major bumps, copy safe `pnpm update` commands |
| `/audit` | Client | Parse `pnpm audit` table or JSON — group by severity, copy dependency paths and `pnpm audit --fix` |
| `/stack` | Client | Parse stack traces into file:line frames — filter node_modules, copy paths |
| `/tsc` | Client | Parse `tsc` / `pnpm typecheck` output — TS codes, file:line paths, node_modules filter |
| `/eslint` | Client | Parse `eslint` / `pnpm lint` output — rule ids, file:line paths, node_modules filter |
| `/prettier` | Client | Parse `prettier --check` / `--list-different` — unformatted files, extension filter, copy fix commands |
| `/test` | Client | Parse `pnpm test`, Vitest, or Jest output — failures by file, node_modules filter, copyable paths |
| `/coverage` | Client | Parse Vitest, Jest, or c8 text coverage tables — rank files by lines %, filter gaps, copy uncovered paths |
| `/playwright` | Client | Parse `playwright test` output — failures by browser project, stack frames, node_modules filter, copyable paths |
| `/build` | Client | Parse `pnpm build` / Next.js output — type errors, module resolution, node_modules filter, copyable paths |
| `/checks` | Client | Parse `gh pr checks`, GitHub Actions summaries, or JSON — group by status, copy failing jobs and rerun hints |
| `/todo` | Client | Scan ripgrep output for TODO/FIXME/HACK/XXX/BUG markers — counts and copyable paths |
| `/loc` | Client | Parse `wc -l` / find output — rank files by line count, extension and folder breakdown, copy largest paths |
| `/grep` | Client | Parse general ripgrep -n or -C output — group by file, extension filter, copyable paths |
| `/import` | Client | Relative and `@/` alias import paths between two repo files — refactor helper |
| `/rename` | Client | Apply rename rules to paths, ripgrep lines, or stack frames after moving files |
| `/whitespace` | Client | Line endings, trailing whitespace, indent style, invisible Unicode in pasted snippets |
| `/citation` | Client | Build and scan Cursor `startLine:endLine:filepath` citation fences from ripgrep or line ranges |
| `/semver` | Client | Compare semver strings, npm ^/~ range checks, sort version lists |
| `/notes` | Client | Sidebar layout, markdown-ish notes, export `.md` |
| `/rsvp` | API | `POST /api/rsvp` — in-memory RSVP (resets on cold start) |
| `/rsvp/host` | API | `GET /api/rsvp` — counts chart + table |
| `/ui` | Client | shadcn samples with copy-to-clipboard snippets |

**Client** = runs entirely in the browser (often persisted with `localStorage`). **API** = uses Next.js Route Handlers under `app/api/`.

---

## API routes

| Method | Path | Role |
|--------|------|------|
| `GET` | `/api/time` | JSON server `iso` + `unixMs` for clock skew demos |
| `POST` | `/api/links/preview` | Fetch a URL server-side and return OG title/description/image |
| `POST` | `/api/rsvp` | Append an RSVP to in-memory storage |
| `GET` | `/api/rsvp` | JSON summary + entries for the host dashboard |

Do not rely on in-memory RSVP data in production; it is for local/demo use only.

---

## UI and theming

Global styles and tokens are in [`app/globals.css`](app/globals.css). Typography uses **Fraunces** (display) and **Manrope** (UI), with **Geist Mono** for monospace. The shell includes a light mesh background and a subtle grain overlay; cards on the hub use staggered entrance motion.

---

## Adding shadcn components

```bash
npx shadcn@latest add <component>
```

Components install under `components/ui/` and can be imported as:

```tsx
import { Button } from "@/components/ui/button"
```
