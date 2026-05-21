export type JsonValueKind =
  | "object"
  | "array"
  | "string"
  | "number"
  | "boolean"
  | "null"

export type JsonStructureStats = {
  rootKind: JsonValueKind
  maxDepth: number
  nodeCount: number
  keyCount?: number
  arrayLength?: number
  stringChars?: number
  byteLength: number
}

function valueKind(value: unknown): JsonValueKind {
  if (value === null) {
    return "null"
  }
  if (Array.isArray(value)) {
    return "array"
  }
  switch (typeof value) {
    case "object":
      return "object"
    case "string":
      return "string"
    case "number":
      return "number"
    case "boolean":
      return "boolean"
    default:
      return "null"
  }
}

function walk(
  value: unknown,
  depth: number,
  acc: {
    maxDepth: number
    nodeCount: number
    keyCount: number
    stringChars: number
  },
) {
  acc.nodeCount++
  acc.maxDepth = Math.max(acc.maxDepth, depth)

  if (typeof value === "string") {
    acc.stringChars += value.length
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      walk(item, depth + 1, acc)
    }
    return
  }

  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      acc.keyCount++
      walk((value as Record<string, unknown>)[key], depth + 1, acc)
    }
  }
}

export function analyzeJsonStructure(
  value: unknown,
  serialized: string,
): JsonStructureStats {
  const acc = {
    maxDepth: 0,
    nodeCount: 0,
    keyCount: 0,
    stringChars: 0,
  }
  walk(value, 0, acc)

  const rootKind = valueKind(value)
  const stats: JsonStructureStats = {
    rootKind,
    maxDepth: acc.maxDepth,
    nodeCount: acc.nodeCount,
    byteLength: new TextEncoder().encode(serialized).length,
  }

  if (rootKind === "object") {
    stats.keyCount = acc.keyCount
  }
  if (rootKind === "array" && Array.isArray(value)) {
    stats.arrayLength = value.length
  }
  if (acc.stringChars > 0) {
    stats.stringChars = acc.stringChars
  }

  return stats
}
