import type { IdsPersisted } from "./types"

export function defaultIdsPersisted(): IdsPersisted {
  return {
    format: "uuid",
    count: 5,
    entropyBytes: 16,
    hexUppercase: false,
  }
}
