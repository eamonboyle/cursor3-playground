/** Sample file body with two git merge conflicts for the demo textarea. */
export const SAMPLE_CONFLICT_TEXT = `import { parseEnv } from "./env"

export function loadConfig(path: string) {
<<<<<<< HEAD
  const raw = readFileSync(path, "utf8")
  return parseEnv(raw)
=======
  const raw = await readFile(path, "utf8")
  return parseEnv(raw, { strict: true })
>>>>>>> feature/async-config
}

export const DEFAULT_TIMEOUT = 5000

<<<<<<< HEAD
export const RETRIES = 3
=======
export const RETRIES = 5
export const RETRY_DELAY_MS = 250
>>>>>>> feature/async-config
`

export const SAMPLE_CONFLICT_FILEPATH = "lib/config/load.ts"
