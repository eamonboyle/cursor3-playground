import { NextResponse } from "next/server"

import { fetchOgPreview } from "@/lib/links/og-preview"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const url =
    body &&
    typeof body === "object" &&
    "url" in body &&
    typeof (body as { url: unknown }).url === "string"
      ? (body as { url: string }).url.trim()
      : ""

  if (!url) {
    return NextResponse.json({ error: "Missing url." }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 })
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only HTTP(S) URLs are allowed." }, { status: 400 })
  }

  try {
    const preview = await fetchOgPreview(parsed.href)
    return NextResponse.json(preview)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Preview failed."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
