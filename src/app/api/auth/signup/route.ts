import { NextRequest, NextResponse } from "next/server";

import { createUser, getUserByEmail } from "@/lib/users";
import {
  createUserSession,
  determineUserRole,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ message: "Corps de requête manquant." }, { status: 400 });
  }

  const { name, email, password } = body as {
    name?: unknown;
    email?: unknown;
    password?: unknown;
  };

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ message: "Le nom est obligatoire." }, { status: 400 });
  }

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ message: "L'email est obligatoire." }, { status: 400 });
  }

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { message: "Le mot de passe doit contenir au moins 8 caractères." },
      { status: 400 },
    );
  }

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return NextResponse.json({ message: "Un compte existe déjà avec cet email." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const role = determineUserRole(email);

  const user = await createUser({
    name: name.trim(),
    email: email.trim(),
    passwordHash,
    role,
  });

  const session = await createUserSession(user.id);
  setSessionCookie(session.token, session.expiresAt);

  return NextResponse.json(user, { status: 201 });
}
