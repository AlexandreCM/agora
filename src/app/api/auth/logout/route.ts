import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { clearSessionCookie, removeSessionByToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const store = cookies();
  const sessionCookie = store.get("agora_session");

  if (sessionCookie?.value) {
    await removeSessionByToken(sessionCookie.value);
  }

  clearSessionCookie();

  return NextResponse.json({ success: true });
}
