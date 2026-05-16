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
| `/links` | API | `POST /api/links/preview` — Open Graph preview + saved links |
| `/recipes` | Client | Servings slider, scaled ingredients, print stylesheet |
| `/epoch` | API | Time parsing UI + `GET /api/time` (server clock JSON) |
| `/crm` | Client | Search, cards, sheet editor, tags |
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
