export type JsonParseSuccess = {
  ok: true
  value: unknown
}

export type JsonParseFailure = {
  ok: false
  error: string
  line?: number
  column?: number
  position?: number
}

export type JsonParseResult = JsonParseSuccess | JsonParseFailure

function extractJsonErrorPosition(message: string): number | undefined {
  const match = message.match(/position\s+(\d+)/i)
  if (!match) {
    return undefined
  }
  const position = Number(match[1])
  return Number.isFinite(position) ? position : undefined
}

function positionToLineColumn(text: string, position: number) {
  let line = 1
  let column = 1
  const end = Math.min(position, text.length)
  for (let i = 0; i < end; i++) {
    if (text[i] === "\n") {
      line++
      column = 1
    } else {
      column++
    }
  }
  return { line, column }
}

export function parseJson(text: string): JsonParseResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return { ok: false, error: "Paste or type JSON to analyze." }
  }

  try {
    const value: unknown = JSON.parse(trimmed)
    return { ok: true, value }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid JSON."
    const position = extractJsonErrorPosition(message)
    const loc =
      position !== undefined
        ? positionToLineColumn(text, position)
        : undefined
    return {
      ok: false,
      error: message,
      line: loc?.line,
      column: loc?.column,
      position,
    }
  }
}
