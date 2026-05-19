import type { IdFormat } from "./types"

function randomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length)
  crypto.getRandomValues(out)
  return out
}

function bytesToHex(bytes: Uint8Array, upperCase: boolean): string {
  let s = ""
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i]!.toString(16).padStart(2, "0")
  }
  return upperCase ? s.toUpperCase() : s
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

export function generateOne(
  format: IdFormat,
  opts: { entropyBytes: number; hexUppercase: boolean },
): string {
  if (format === "uuid") {
    return crypto.randomUUID()
  }
  const bytes = randomBytes(Math.max(1, opts.entropyBytes))
  if (format === "hex") {
    return bytesToHex(bytes, opts.hexUppercase)
  }
  return bytesToBase64Url(bytes)
}

export function generateMany(
  format: IdFormat,
  count: number,
  opts: { entropyBytes: number; hexUppercase: boolean },
): string[] {
  const n = Math.min(50, Math.max(1, Math.floor(count)))
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    out.push(generateOne(format, opts))
  }
  return out
}
