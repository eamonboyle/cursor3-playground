import { NextResponse } from "next/server"

export const runtime = "nodejs"

type Status = "yes" | "no" | "maybe"

type Entry = {
  id: string
  name: string
  email: string
  status: Status
  message: string
  createdAt: string
}

const entries: Entry[] = []

function isStatus(v: unknown): v is Status {
  return v === "yes" || v === "no" || v === "maybe"
}

export async function GET() {
  const counts = { yes: 0, no: 0, maybe: 0 }
  for (const e of entries) {
    counts[e.status]++
  }
  return NextResponse.json({
    total: entries.length,
    counts,
    entries: entries.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      status: e.status,
      message: e.message,
      createdAt: e.createdAt,
    })),
  })
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const name = typeof b.name === "string" ? b.name.trim() : ""
  const email = typeof b.email === "string" ? b.email.trim() : ""
  const status = b.status
  const message =
    typeof b.message === "string" ? b.message.trim().slice(0, 500) : ""

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required." },
      { status: 400 },
    )
  }

  if (!isStatus(status)) {
    return NextResponse.json(
      { error: "Status must be yes, no, or maybe." },
      { status: 400 },
    )
  }

  entries.push({
    id: crypto.randomUUID(),
    name: name.slice(0, 120),
    email: email.slice(0, 120),
    status,
    message,
    createdAt: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
