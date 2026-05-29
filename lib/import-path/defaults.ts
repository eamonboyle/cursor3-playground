import type { ImportPathPersisted } from "./types"

export function defaultImportPathPersisted(): ImportPathPersisted {
  return {
    fromFile: "components/branch/branch-app.tsx",
    toFile: "lib/branch/slug.ts",
    stripExtension: true,
    useAlias: true,
  }
}
