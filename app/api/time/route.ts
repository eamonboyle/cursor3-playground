import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Demo clock endpoint for the Epoch lab: compare server time with client parsing.
 */
export function GET() {
  const now = new Date()
  return NextResponse.json({
    iso: now.toISOString(),
    unixMs: now.getTime(),
  })
}
