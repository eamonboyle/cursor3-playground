import type { BranchNameResult, BranchPrefix } from "./types"

/** Git disallows these branch names (case-insensitive for matching). */
const RESERVED_BRANCH_NAMES = new Set([
  "main",
  "master",
  "head",
  "develop",
  "development",
])

const MAX_LENGTH_MIN = 20
const MAX_LENGTH_MAX = 80

export function clampMaxLength(value: number): number {
  return Math.min(MAX_LENGTH_MAX, Math.max(MAX_LENGTH_MIN, Math.floor(value)))
}

/**
 * Slugify a single path segment: lowercase, ASCII letters/digits, hyphen separators.
 */
export function slugifySegment(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function truncateAtHyphen(slug: string, maxLen: number): string {
  if (slug.length <= maxLen) {
    return slug
  }
  const slice = slug.slice(0, maxLen)
  const lastHyphen = slice.lastIndexOf("-")
  if (lastHyphen > 8) {
    return slice.slice(0, lastHyphen).replace(/-+$/, "")
  }
  return slice.replace(/-+$/, "")
}

function isReserved(branch: string, slug: string): boolean {
  const lower = branch.toLowerCase()
  const slugLower = slug.toLowerCase()
  return (
    RESERVED_BRANCH_NAMES.has(lower) ||
    RESERVED_BRANCH_NAMES.has(slugLower) ||
    RESERVED_BRANCH_NAMES.has(lower.split("/").pop() ?? "")
  )
}

export function buildBranchName(
  title: string,
  opts: { prefix: BranchPrefix; maxLength: number },
): BranchNameResult {
  const warnings: string[] = []
  const slug = slugifySegment(title)

  if (!slug) {
    return {
      branch: "",
      slug: "",
      warnings: ["Enter a title with letters or numbers."],
    }
  }

  const maxLength = clampMaxLength(opts.maxLength)
  const prefixSegment = opts.prefix ? `${opts.prefix}/` : ""
  const maxSlugLen = Math.max(8, maxLength - prefixSegment.length)
  let body = slug

  if (body.length > maxSlugLen) {
    body = truncateAtHyphen(body, maxSlugLen)
    warnings.push(`Truncated to ${maxLength} characters (prefix included).`)
  }

  const branch = `${prefixSegment}${body}`

  if (isReserved(branch, body)) {
    warnings.push(
      "Name may collide with a reserved branch (main, master, HEAD); add a suffix.",
    )
  }

  if (/^-|-$|\.lock$|\.lock\//.test(branch) || branch.includes("..")) {
    warnings.push("Branch contains patterns some hosts reject; review before push.")
  }

  return { branch, slug: body, warnings }
}
