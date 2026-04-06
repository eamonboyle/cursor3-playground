function decodeHtmlEntities(raw: string) {
  return raw
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x27;/gi, "'")
}

function pickMeta(html: string, key: string) {
  const esc = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${esc}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${esc}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+name=["']${esc}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${esc}["']`,
      "i",
    ),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) {
      return decodeHtmlEntities(m[1])
    }
  }
  return undefined
}

function pickTitle(html: string) {
  const og = pickMeta(html, "og:title")
  if (og) {
    return og
  }
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return m?.[1] ? decodeHtmlEntities(m[1].trim()) : undefined
}

export type OgPreview = {
  title: string
  description?: string
  image?: string
}

export async function fetchOgPreview(url: string): Promise<OgPreview> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "CursorPlaygroundLinkPreview/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  const html = await res.text()
  const base = new URL(url)

  const title = pickTitle(html) ?? base.hostname
  const description =
    pickMeta(html, "og:description") ?? pickMeta(html, "description")
  let image = pickMeta(html, "og:image")

  if (image && !/^https?:\/\//i.test(image)) {
    try {
      image = new URL(image, base).href
    } catch {
      image = undefined
    }
  }

  return {
    title: title.slice(0, 200),
    description: description?.slice(0, 500),
    image,
  }
}
