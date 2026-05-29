export type ImportPathOptions = {
  /** Omit .ts, .tsx, .js, .jsx, .mjs, .cjs from the result. */
  stripExtension: boolean
  /** Prefer `@/` when the target resolves under the project root. */
  useAlias: boolean
  /** Alias prefix (default `@`). */
  aliasPrefix: string
}

export type ImportPathResult = {
  /** Relative import string (no quotes). */
  importPath: string
  /** Same path with @/ when useAlias applies. */
  aliasPath: string | null
  fromDir: string
  warnings: string[]
}

export type ImportPathPersisted = {
  fromFile: string
  toFile: string
  stripExtension: boolean
  useAlias: boolean
}
