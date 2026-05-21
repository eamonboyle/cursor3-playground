import { parseJson } from "./parse"
import type { JsonIndent } from "./types"

function indentString(indent: JsonIndent): string | number {
  return indent === "tab" ? "\t" : indent
}

export type JsonFormatSuccess = {
  ok: true
  output: string
}

export type JsonFormatFailure = {
  ok: false
  error: string
  line?: number
  column?: number
}

export type JsonFormatResult = JsonFormatSuccess | JsonFormatFailure

export function formatJson(text: string, indent: JsonIndent): JsonFormatResult {
  const parsed = parseJson(text)
  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.error,
      line: parsed.line,
      column: parsed.column,
    }
  }
  return {
    ok: true,
    output: JSON.stringify(parsed.value, null, indentString(indent)),
  }
}

export function minifyJson(text: string): JsonFormatResult {
  const parsed = parseJson(text)
  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.error,
      line: parsed.line,
      column: parsed.column,
    }
  }
  return {
    ok: true,
    output: JSON.stringify(parsed.value),
  }
}
