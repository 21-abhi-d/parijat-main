/**
 * Cal.com webhook receiver.
 * Verifies HMAC signature, parses booking payload, and persists to MongoDB.
 * Fully implemented in Phase 3.
 */
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("X-Cal-Signature-256");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  // TODO (Phase 3): Verify HMAC signature, parse payload, persist booking
  const body = await req.text();
  console.log("[calcom-webhook] Received payload, length:", body.length);

  return NextResponse.json({ received: true });
}
