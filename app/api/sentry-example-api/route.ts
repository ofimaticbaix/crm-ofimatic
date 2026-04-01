import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

class SentryExampleAPIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SentryExampleAPIError"
  }
}

export function GET() {
  throw new SentryExampleAPIError("This is a test error from the Sentry Example API Route")
  return NextResponse.json({ data: "Testing Sentry Error..." })
}
