export type Rgb = { r: number; g: number; b: number }

function hexNibble(c: string): number {
  const v = parseInt(c, 16)
  return Number.isFinite(v) ? v : -1
}

/**
 * Parses #RGB or #RRGGBB (hash optional, case-insensitive).
 */
export function parseHexColor(raw: string): Rgb | null {
  const s = raw.trim().replace(/^#/, "")
  if (s.length === 3 && /^[0-9a-fA-F]{3}$/.test(s)) {
    const r = hexNibble(s[0]!)
    const g = hexNibble(s[1]!)
    const b = hexNibble(s[2]!)
    if (r < 0 || g < 0 || b < 0) {
      return null
    }
    return { r: (r << 4) | r, g: (g << 4) | g, b: (b << 4) | b }
  }
  if (s.length === 6 && /^[0-9a-fA-F]{6}$/.test(s)) {
    return {
      r: parseInt(s.slice(0, 2), 16),
      g: parseInt(s.slice(2, 4), 16),
      b: parseInt(s.slice(4, 6), 16),
    }
  }
  return null
}

function channelToLinear(channel0to1: number): number {
  return channel0to1 <= 0.03928
    ? channel0to1 / 12.92
    : Math.pow((channel0to1 + 0.055) / 1.055, 2.4)
}

/** WCAG 2.x relative luminance for sRGB (0–1). */
export function relativeLuminance(rgb: Rgb): number {
  const r = channelToLinear(rgb.r / 255)
  const g = channelToLinear(rgb.g / 255)
  const b = channelToLinear(rgb.b / 255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(lumA: number, lumB: number): number {
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

export type ContrastAnalysis = {
  ratio: number
  ratioLabel: string
  foreground: Rgb
  background: Rgb
  passes: {
    aaNormal: boolean
    aaLarge: boolean
    aaaNormal: boolean
    aaaLarge: boolean
  }
}

export function analyzeContrast(
  foregroundHex: string,
  backgroundHex: string,
): ContrastAnalysis | null {
  const foreground = parseHexColor(foregroundHex)
  const background = parseHexColor(backgroundHex)
  if (!foreground || !background) {
    return null
  }
  const lf = relativeLuminance(foreground)
  const lb = relativeLuminance(background)
  const ratio = contrastRatio(lf, lb)
  return {
    ratio,
    ratioLabel: `${ratio.toFixed(2)}:1`,
    foreground,
    background,
    passes: {
      aaNormal: ratio >= 4.5,
      aaLarge: ratio >= 3,
      aaaNormal: ratio >= 7,
      aaaLarge: ratio >= 4.5,
    },
  }
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (n: number) => n.toString(16).padStart(2, "0")
  return `#${to(r)}${to(g)}${to(b)}`
}
