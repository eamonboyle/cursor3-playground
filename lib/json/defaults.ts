import type { JsonPersisted } from "./types"

export const SAMPLE_JSON = `{
  "name": "Cursor playground",
  "version": 1,
  "features": ["format", "minify", "validate"],
  "meta": {
    "client": true,
    "storage": "localStorage"
  }
}`

export function defaultJsonPersisted(): JsonPersisted {
  return {
    input: SAMPLE_JSON,
    indent: 2,
  }
}
