import type { EnvPersisted } from "./types"

export function defaultEnvPersisted(): EnvPersisted {
  return {
    referenceText: SAMPLE_ENV_REFERENCE,
    localText: SAMPLE_ENV_LOCAL,
    revealValues: false,
  }
}

/** Typical .env.example keys for a Next.js app. */
export const SAMPLE_ENV_REFERENCE = `# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/app

# Auth (optional)
# CLERK_SECRET_KEY=

# Feature flags
ENABLE_ANALYTICS=false
`

/** Local .env with one missing key, one extra, and one changed value. */
export const SAMPLE_ENV_LOCAL = `NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/app_dev
ENABLE_ANALYTICS=true
DEBUG_CURSOR_PLAYGROUND=1
`
