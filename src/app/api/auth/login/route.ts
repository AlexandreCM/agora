import { NextRequest, NextResponse } from "next/server";

import { createUserSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/lib/users";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ message: "Corps de requête manquant." }, { status: 400 });
  }

  const { email, password } = body as {
    email?: unknown;
    password?: unknown;
  };

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ message: "L'email est obligatoire." }, { status: 400 });
  }

  if (typeof password !== "string" || !password) {
    return NextResponse.json({ message: "Le mot de passe est obligatoire." }, { status: 400 });
  }

  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return NextResponse.json({ message: "Identifiants invalides." }, { status: 401 });
  }

  const passwordValid = await verifyPassword(password, existingUser.passwordHash);

  if (!passwordValid) {
    return NextResponse.json({ message: "Identifiants invalides." }, { status: 401 });
  }

  const session = await createUserSession(existingUser.id);
  setSessionCookie(session.token, session.expiresAt);

  const { passwordHash: _ignored, ...user } = existingUser;

  return NextResponse.json(user);
}
